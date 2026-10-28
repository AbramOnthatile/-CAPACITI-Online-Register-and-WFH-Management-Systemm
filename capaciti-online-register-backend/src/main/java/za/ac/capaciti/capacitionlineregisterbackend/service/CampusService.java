package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import za.ac.capaciti.capacitionlineregisterbackend.domain.CampusHub;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.campus.CampusDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.campus.UpdateCampusRequest;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ConflictException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ResourceNotFoundException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.CampusMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.CampusHubRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;

@Service
public class CampusService implements ICampusService {

    private final CampusHubRepository campusHubRepository;
    private final CampusMapper campusMapper;
    private final IpWhitelistService ipWhitelistService;
    private final IAuditService auditService;
    private final UserRepository userRepository;
    private final PasswordConfirmationService passwordConfirmation;

    public CampusService(
            CampusHubRepository campusHubRepository,
            CampusMapper campusMapper,
            IpWhitelistService ipWhitelistService,
            IAuditService auditService,
            UserRepository userRepository,
            PasswordConfirmationService passwordConfirmation) {
        this.campusHubRepository = campusHubRepository;
        this.campusMapper = campusMapper;
        this.ipWhitelistService = ipWhitelistService;
        this.auditService = auditService;
        this.userRepository = userRepository;
        this.passwordConfirmation = passwordConfirmation;
    }

    @Override
    public List<CampusDto> list() {
        return campusHubRepository.findAll().stream()
                .map(campusMapper::toDto)
                .toList();
    }

    @Override
    @Transactional
    public CampusDto update(UUID id, UpdateCampusRequest request, String actorEmail, String confirmPassword) {
        User actor = userRepository.findByEmailIgnoreCase(actorEmail).orElse(null);
        passwordConfirmation.confirm(actor, confirmPassword);
        CampusHub campusHub = findCampus(id);
        campusHubRepository.findByName(request.name())
                .filter(existing -> !id.equals(existing.getId()))
                .ifPresent(existing -> {
                    throw new ConflictException("CAMPUS_NAME_EXISTS", "A campus with that name already exists");
                });

        campusHub.setName(request.name());
        campusHub.setLatitude(request.latitude());
        campusHub.setLongitude(request.longitude());
        if (request.radiusM() != null) {
            campusHub.setRadiusM(request.radiusM());
        }

        CampusHub saved = campusHubRepository.save(campusHub);
        auditService.log(actor, "CAMPUS_UPDATED", "CAMPUS_HUB", saved.getId().toString(), Map.of());
        return campusMapper.toDto(saved);
    }

    @Override
    @Transactional
    public CampusDto addCurrentIp(UUID id, HttpServletRequest request, String actorEmail, String confirmPassword) {
        User actor = userRepository.findByEmailIgnoreCase(actorEmail).orElse(null);
        passwordConfirmation.confirm(actor, confirmPassword);
        CampusHub campusHub = findCampus(id);
        String clientIp = ipWhitelistService.extractClientIp(request);
        String cidr = ipWhitelistService.toCidr(clientIp);
        if (cidr == null) {
            throw new BadRequestException("Client IP address is unavailable");
        }

        List<String> cidrs = campusHub.getWhitelistedCidrs();
        if (cidrs == null) {
            cidrs = new ArrayList<>();
            campusHub.setWhitelistedCidrs(cidrs);
        }
        if (!cidrs.contains(cidr)) {
            cidrs.add(cidr);
            CampusHub saved = campusHubRepository.save(campusHub);
            auditService.log(actor, "WHITELIST_ADDED", "CAMPUS_HUB", saved.getId().toString(), Map.of("cidr", cidr));
            return campusMapper.toDto(saved);
        }

        return campusMapper.toDto(campusHub);
    }

    @Override
    @Transactional
    public CampusDto removeCidr(UUID id, String cidr, String actorEmail, String confirmPassword) {
        User actor = userRepository.findByEmailIgnoreCase(actorEmail).orElse(null);
        passwordConfirmation.confirm(actor, confirmPassword);
        CampusHub campusHub = findCampus(id);
        List<String> cidrs = campusHub.getWhitelistedCidrs();
        if (cidrs == null || !cidrs.remove(cidr)) {
            throw new ResourceNotFoundException("CIDR not found on campus: " + cidr);
        }

        CampusHub saved = campusHubRepository.save(campusHub);
        auditService.log(actor, "WHITELIST_REMOVED", "CAMPUS_HUB", saved.getId().toString(), Map.of("cidr", cidr));
        return campusMapper.toDto(saved);
    }

    private CampusHub findCampus(UUID id) {
        return campusHubRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campus not found: " + id));
    }
}