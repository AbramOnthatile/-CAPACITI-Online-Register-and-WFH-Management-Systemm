package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.WfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.CreateWfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.ReadinessDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhActionResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhDecisionRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhRequestDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.WfhStatus;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ConflictException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ResourceNotFoundException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.WfhRequestMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.WfhRequestRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;
import za.ac.capaciti.capacitionlineregisterbackend.util.Helper;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Service
public class WfhRequestService implements IWfhRequestService {
    public static final String WFH_REASON = "WFH_REASON";

    private final WfhRequestRepository wfhRequestRepository;
    private final UserRepository userRepository;
    private final WfhRequestMapper wfhRequestMapper;
    private final IQualityGateService qualityGateService;
    private final AuditService auditService;

    public WfhRequestService(WfhRequestRepository wfhRequestRepository,
                            UserRepository userRepository,
                            WfhRequestMapper wfhRequestMapper,
                            IQualityGateService qualityGateService,
                            AuditService auditService) {
        this.wfhRequestRepository = wfhRequestRepository;
        this.userRepository = userRepository;
        this.wfhRequestMapper = wfhRequestMapper;
        this.qualityGateService = qualityGateService;
        this.auditService = auditService;
    }

    @Override
    public WfhActionResponse create(String email, CreateWfhRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        LocalDate startDate = request.startDate();
        LocalDate endDate = request.endDate();
        if (startDate.isBefore(TimeUtil.today())) {
            throw new BadRequestException("Start date cannot be before today.");
        }
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("End date cannot be before the start date.");
        }
        long totalDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (totalDays > 10) {
            throw new BadRequestException("WFH request cannot exceed 10 days.");
        }
        if (wfhRequestRepository.existsOverlapping(user, startDate, endDate)) {
            throw new ConflictException("WFH_OVERLAP", "WFH request overlaps with an existing approved or pending request.");
        }

        QualityResult quality = qualityGateService.check(user, WFH_REASON, request.draftKey(), request.reason());
        if (!quality.accepted()) {
            return new WfhActionResponse(null, quality);
        }

        WfhRequest entity = WfhRequest.builder()
                .user(user)
                .startDate(startDate)
                .endDate(endDate)
                .reason(request.reason())
                .readiness(toMap(request.readiness()))
                .status(WfhStatus.PENDING)
                .aiQualityFlag(quality.flagged())
                .build();

        WfhRequest saved = wfhRequestRepository.save(entity);
        return new WfhActionResponse(wfhRequestMapper.toDto(saved), quality);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WfhRequestDto> mine(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return wfhRequestRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(wfhRequestMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WfhRequestDto> search(WfhStatus status, UUID userId, LocalDate from, LocalDate to, Pageable pageable) {
        return wfhRequestRepository.search(status, userId, from, to, pageable)
                .map(wfhRequestMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public WfhRequestDto getById(UUID id) {
        return wfhRequestRepository.findWithUsersById(id)
                .map(wfhRequestMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("WFH request not found: " + id));
    }

    @Override
    @Transactional
    public WfhRequestDto decide(UUID id, WfhDecisionRequest request, String actorEmail) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actorEmail));
        WfhRequest entity = wfhRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WFH request not found: " + id));

        if (entity.getStatus() != WfhStatus.PENDING) {
            throw new ConflictException("WFH_ALREADY_DECIDED", "WFH request has already been decided.");
        }

        boolean approved = request.approved();
        if (!approved && (request.comment() == null || request.comment().isBlank())) {
            throw new BadRequestException("A comment is required when rejecting");
        }

        entity.setStatus(approved ? WfhStatus.APPROVED : WfhStatus.REJECTED);
        entity.setReviewedBy(actor);
        entity.setReviewedAt(TimeUtil.now());
        entity.setReviewComment(request.comment());
        WfhRequest saved = wfhRequestRepository.save(entity);

        String event = approved ? "WFH_APPROVED" : "WFH_REJECTED";
        auditService.log(event, saved.getId(), "WfhRequest", Map.of(
                "userId", saved.getUser().getId(),
                "startDate", saved.getStartDate(),
                "endDate", saved.getEndDate()
        ));
        return wfhRequestMapper.toDto(saved);
    }

    @Override
    @Transactional
    public WfhRequestDto cancel(UUID id, String email) {
        WfhRequest entity = wfhRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WFH request not found: " + id));

        if (entity.getUser() == null || !entity.getUser().getEmail().equals(email)) {
            throw new ResourceNotFoundException("WFH request not found: " + id);
        }

        boolean allowed = entity.getStatus() == WfhStatus.PENDING
                || (entity.getStatus() == WfhStatus.APPROVED && entity.getStartDate().isAfter(TimeUtil.today()));

        if (!allowed) {
            throw new ConflictException("WFH_NOT_CANCELLABLE", "This WFH request cannot be cancelled.");
        }

        entity.setStatus(WfhStatus.CANCELLED);
        WfhRequest saved = wfhRequestRepository.save(entity);
        auditService.log("WFH_CANCELLED", saved.getId(), "WfhRequest", Map.of(
                "userId", saved.getUser().getId(),
                "startDate", saved.getStartDate(),
                "endDate", saved.getEndDate()
        ));
        return wfhRequestMapper.toDto(saved);
    }

    private Map<String, Object> toMap(ReadinessDto readiness) {
        if (readiness == null) {
            return null;
        }
        Map<String, Object> map = new HashMap<>();
        map.put("stableInternet", readiness.stableInternet());
        map.put("powerBackup", readiness.powerBackup());
        map.put("quietWorkspace", readiness.quietWorkspace());
        map.put("laptopReady", readiness.laptopReady());
        return map;
    }
}
