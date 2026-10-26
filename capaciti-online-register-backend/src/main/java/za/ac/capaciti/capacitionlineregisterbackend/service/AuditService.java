package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.ac.capaciti.capacitionlineregisterbackend.domain.AuditLog;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AuditLogRepository;

@Service
public class AuditService {
    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void log(String event, UUID targetId, String targetType, Map<String, Object> details) {
        log(null, event, targetType, targetId.toString(), details);
    }

    @Transactional
    public void log(
            User actor, String event, String targetType, String targetId, Map<String, Object> details) {
        auditLogRepository.save(new AuditLog(actor, event, targetType, targetId, details));
    }
}
