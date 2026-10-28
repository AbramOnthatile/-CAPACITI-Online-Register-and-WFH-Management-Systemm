package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.ac.capaciti.capacitionlineregisterbackend.domain.AuditLog;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.audit.AuditLogDto;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.AuditMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AuditLogRepository;

@Service
public class AuditService implements IAuditService {
    private final AuditLogRepository auditLogRepository;
    private final AuditMapper auditMapper;

    public AuditService(AuditLogRepository auditLogRepository, AuditMapper auditMapper) {
        this.auditLogRepository = auditLogRepository;
        this.auditMapper = auditMapper;
    }

    @Transactional
    public void log(String event, UUID targetId, String targetType, Map<String, Object> details) {
        log(null, event, targetType, targetId == null ? null : targetId.toString(), details);
    }

    @Override
    @Transactional
    public void log(
            User actor, String event, String targetType, String targetId, Map<String, Object> details) {
        auditLogRepository.save(new AuditLog(actor, event, targetType, targetId, details));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogDto> list(UUID actorId, String action, Instant from, Instant to, Pageable pageable) {
        return auditLogRepository.searchAuditLogs(actorId, action, from, to, pageable)
                .map(auditMapper::toDto);
    }
}
