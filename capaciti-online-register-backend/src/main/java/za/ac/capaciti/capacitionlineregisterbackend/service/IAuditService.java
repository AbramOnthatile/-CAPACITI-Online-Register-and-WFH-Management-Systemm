package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.audit.AuditLogDto;

public interface IAuditService {

    void log(User actor, String action, String targetType, String targetId, Map<String, Object> details);

    Page<AuditLogDto> list(UUID actorId, String action, Instant from, Instant to, Pageable pageable);
}