package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import za.ac.capaciti.capacitionlineregisterbackend.domain.AttendanceRecord;
import za.ac.capaciti.capacitionlineregisterbackend.domain.CampusHub;
import za.ac.capaciti.capacitionlineregisterbackend.domain.Notification;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.WfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.AttendanceActionResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.AttendanceDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.ClockInRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.ClockOutRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.ExcuseRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;
import za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.DepartureStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.QualityContext;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ConflictException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ForbiddenException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ResourceNotFoundException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.AttendanceMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AttendanceRecordRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.NotificationRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.WfhRequestRepository;
import za.ac.capaciti.capacitionlineregisterbackend.util.Helper;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Service
public class AttendanceService implements IAttendanceService {

    static final String MISSING_CLOCK_OUT = "MISSING_CLOCK_OUT";

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final UserRepository userRepository;
    private final WfhRequestRepository wfhRequestRepository;
    private final AttendanceStatusEngine statusEngine;
    private final IpWhitelistService ipWhitelistService;
    private final LocationVerificationService locationVerificationService;
    private final IQualityGateService qualityGateService;
    private final AttendanceMapper attendanceMapper;
    private final AuditService auditService;
    private final NotificationRepository notificationRepository;
    private final IPromptGeneratorService promptGeneratorService;
    private final IPromptService promptService;

    public AttendanceService(
            AttendanceRecordRepository attendanceRecordRepository,
            UserRepository userRepository,
            WfhRequestRepository wfhRequestRepository,
            AttendanceStatusEngine statusEngine,
            IpWhitelistService ipWhitelistService,
            LocationVerificationService locationVerificationService,
            IQualityGateService qualityGateService,
            AttendanceMapper attendanceMapper,
            AuditService auditService,
            NotificationRepository notificationRepository,
            IPromptGeneratorService promptGeneratorService,
            IPromptService promptService) {
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.userRepository = userRepository;
        this.wfhRequestRepository = wfhRequestRepository;
        this.statusEngine = statusEngine;
        this.ipWhitelistService = ipWhitelistService;
        this.locationVerificationService = locationVerificationService;
        this.qualityGateService = qualityGateService;
        this.attendanceMapper = attendanceMapper;
        this.auditService = auditService;
        this.notificationRepository = notificationRepository;
        this.promptGeneratorService = promptGeneratorService;
        this.promptService = promptService;
    }

    @Override
    @Transactional
    public AttendanceActionResponse clockIn(String email, ClockInRequest request, HttpServletRequest http) {
        User user = findUser(email);
        LocalDate today = TimeUtil.today();
        AttendanceRecord record = attendanceRecordRepository.findByUserAndAttendanceDate(user, today).orElse(null);
        if (record != null && record.getClockInAt() != null) {
            throw new ConflictException("ALREADY_CLOCKED_IN", "You have already clocked in today.");
        }

        Instant now = Instant.now();
        ArrivalStatus arrivalStatus = statusEngine.arrivalStatusFor(now, false);

        WfhRequest wfhRequest = null;
        if (request.workMode() == WorkMode.WFH) {
            List<WfhRequest> approved = wfhRequestRepository.findApprovedCoveringForUser(user, today);
            if (approved.isEmpty()) {
                throw new ForbiddenException("WFH_NOT_APPROVED",
                        "You need an approved WFH request to clock in from home today.");
            }
            wfhRequest = approved.get(0);
        }

        // On-Site passes when the IP is whitelisted OR the device is within the campus radius.
        String clientIp = ipWhitelistService.extractClientIp(http);
        Boolean ipVerified = null;
        Boolean geoVerified = null;
        Double distanceM = null;
        if (request.workMode() == WorkMode.ON_SITE) {
            CampusHub campus = user.getCampus();
            if (campus == null) {
                throw new ForbiddenException("NO_CAMPUS",
                        "No campus is assigned to your profile. Contact your administrator.");
            }
            ipVerified = ipWhitelistService.isWhitelisted(clientIp, campus.getWhitelistedCidrs());
            distanceM = locationVerificationService.distanceToCampus(campus, request.latitude(), request.longitude());
            geoVerified = locationVerificationService.isWithinRadius(campus, distanceM);
            if (!ipVerified && !geoVerified) {
                throw new ForbiddenException("LOCATION_NOT_VERIFIED",
                        "You must be on the campus network or within " + campus.getRadiusM()
                                + " m of " + campus.getName() + " to clock in on-site.");
            }
        }

        QualityResult quality = null;
        if (statusEngine.requiresLateReason(arrivalStatus)) {
            if (Helper.isNullOrEmpty(request.lateReason())) {
                return new AttendanceActionResponse(null, true, null);
            }
            quality = qualityGateService.check(user, QualityContext.LATE_REASON,
                    contextRef(request.draftKey(), "late-reason", today), request.lateReason());
            if (!quality.accepted()) {
                return new AttendanceActionResponse(null, true, quality);
            }
        }

        // A record may already exist when the 10:00 job marked the candidate absent.
        if (record == null) {
            record = AttendanceRecord.builder().user(user).attendanceDate(today).build();
        }
        record.setWorkMode(request.workMode());
        record.setWfhRequest(wfhRequest);
        record.setClockInAt(now);
        record.setArrivalStatus(arrivalStatus);
        record.setLateReason(quality == null ? null : request.lateReason().trim());
        record.setClientIp(clientIp);
        record.setIpVerified(ipVerified);
        record.setGeoVerified(geoVerified);
        record.setLatitude(request.latitude());
        record.setLongitude(request.longitude());
        record.setAccuracyM(request.accuracyM());
        record.setDistanceM(distanceM);
        record.setAiQualityFlag(quality != null && quality.flagged());

        AttendanceRecord saved;
        try {
            saved = attendanceRecordRepository.saveAndFlush(record);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("ALREADY_CLOCKED_IN", "You have already clocked in today.");
        }

        Map<String, Object> details = new HashMap<>();
        details.put("workMode", saved.getWorkMode().name());
        details.put("arrivalStatus", saved.getArrivalStatus().name());
        details.put("ipVerified", ipVerified);
        details.put("geoVerified", geoVerified);
        auditService.log(user, "CLOCK_IN", "AttendanceRecord", saved.getId().toString(), details);
        // The morning task form opens straight after clock-in.
        promptGeneratorService.generateOnClockIn(saved);
        return new AttendanceActionResponse(attendanceMapper.toDto(saved), false, quality);
    }

    @Override
    @Transactional
    public AttendanceActionResponse clockOut(String email, ClockOutRequest request) {
        User user = findUser(email);
        LocalDate today = TimeUtil.today();
        AttendanceRecord record = attendanceRecordRepository.findByUserAndAttendanceDate(user, today)
                .filter(found -> found.getClockInAt() != null)
                .orElseThrow(() -> new ConflictException("NOT_CLOCKED_IN", "You have not clocked in today."));
        if (record.getClockOutAt() != null) {
            throw new ConflictException("ALREADY_CLOCKED_OUT", "You have already clocked out today.");
        }

        Instant now = Instant.now();
        DepartureStatus departureStatus = statusEngine.departureStatusFor(now);

        QualityResult quality = null;
        if (statusEngine.requiresClockOutText(departureStatus)) {
            boolean early = departureStatus == DepartureStatus.PARTIAL_DAY;
            String text = early ? request.earlyClockoutReason() : request.lateClockoutNote();
            if (Helper.isNullOrEmpty(text)) {
                return new AttendanceActionResponse(attendanceMapper.toDto(record), true, null);
            }
            QualityContext context = early ? QualityContext.EARLY_CLOCKOUT : QualityContext.CLOCKOUT_NOTE;
            quality = qualityGateService.check(user, context,
                    contextRef(request.draftKey(), context.name().toLowerCase(), today), text);
            if (!quality.accepted()) {
                return new AttendanceActionResponse(attendanceMapper.toDto(record), true, quality);
            }
            if (early) {
                record.setEarlyClockoutReason(text.trim());
            } else {
                record.setLateClockoutNote(text.trim());
            }
            if (quality.flagged()) {
                record.setAiQualityFlag(true);
            }
        }

        record.setClockOutAt(now);
        record.setDepartureStatus(departureStatus);
        if (!Helper.isNullOrEmpty(request.deliverableLink())) {
            record.setDeliverableLink(request.deliverableLink().trim());
        }
        AttendanceRecord saved = attendanceRecordRepository.save(record);
        promptService.closeForClockOut(user, today);
        auditService.log(user, "CLOCK_OUT", "AttendanceRecord", saved.getId().toString(),
                Map.of("departureStatus", departureStatus.name()));
        return new AttendanceActionResponse(attendanceMapper.toDto(saved), false, quality);
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceDto today(String email) {
        User user = findUser(email);
        return attendanceRecordRepository.findByUserAndAttendanceDate(user, TimeUtil.today())
                .map(attendanceMapper::toDto)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AttendanceDto> mine(String email, Pageable pageable) {
        User user = findUser(email);
        return attendanceRecordRepository.findByUserOrderByAttendanceDateDesc(user, pageable)
                .map(attendanceMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AttendanceDto> search(UUID userId, LocalDate from, LocalDate to, WorkMode workMode,
                                      ArrivalStatus arrivalStatus, Pageable pageable) {
        return attendanceRecordRepository.searchAttendanceRecords(userId, from, to, workMode, arrivalStatus, pageable)
                .map(attendanceMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceDto getById(UUID id) {
        return attendanceRecordRepository.findById(id)
                .map(attendanceMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found: " + id));
    }

    @Override
    @Transactional
    public AttendanceDto excuse(UUID id, ExcuseRequest request, String actorEmail) {
        User actor = findUser(actorEmail);
        AttendanceRecord record = attendanceRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found: " + id));
        if (record.getArrivalStatus() != ArrivalStatus.LATE_UNEXCUSED) {
            throw new ConflictException("NOT_EXCUSABLE", "Only an unexcused late arrival can be excused.");
        }
        record.setArrivalStatus(ArrivalStatus.LATE_EXCUSED);
        AttendanceRecord saved = attendanceRecordRepository.save(record);
        auditService.log(actor, "ATTENDANCE_EXCUSED", "AttendanceRecord", saved.getId().toString(),
                Map.of("reason", request.reason().trim()));
        return attendanceMapper.toDto(saved);
    }

    @Override
    @Transactional
    public int markAbsentForDate(LocalDate date) {
        if (!TimeUtil.isWeekday(date)) {
            return 0;
        }
        List<User> candidates = attendanceRecordRepository.findActiveCandidatesWithoutRecordOn(date);
        for (User candidate : candidates) {
            WfhRequest wfhRequest = wfhRequestRepository.findApprovedCoveringForUser(candidate, date)
                    .stream().findFirst().orElse(null);
            AttendanceRecord record = AttendanceRecord.builder()
                    .user(candidate)
                    .attendanceDate(date)
                    .workMode(wfhRequest != null ? WorkMode.WFH : candidate.getWorkMode())
                    .wfhRequest(wfhRequest)
                    .arrivalStatus(ArrivalStatus.ABSENT_UNEXCUSED)
                    .build();
            attendanceRecordRepository.save(record);
        }
        return candidates.size();
    }

    @Override
    @Transactional
    public int notifyMissingClockOuts(LocalDate date) {
        List<AttendanceRecord> records =
                attendanceRecordRepository.findByAttendanceDateAndClockInAtIsNotNullAndClockOutAtIsNull(date);
        List<Notification> notifications = new ArrayList<>();
        for (AttendanceRecord record : records) {
            User candidate = record.getUser();
            notifications.add(new Notification(candidate, null, "Clock-out missing",
                    "You clocked in on " + date + " but did not clock out.", MISSING_CLOCK_OUT));
        }
        notificationRepository.saveAll(notifications);
        return records.size();
    }

    private User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private String contextRef(String draftKey, String purpose, LocalDate date) {
        return Helper.isNullOrEmpty(draftKey) ? purpose + ":" + date : draftKey;
    }
}
