package za.ac.capaciti.capacitionlineregisterbackend.mappers;

import org.springframework.stereotype.Component;

import za.ac.capaciti.capacitionlineregisterbackend.domain.AuditLog;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.audit.AuditLogDto;

@Component
public class AuditMapper {

    public AuditLogDto toDto(AuditLog auditLog) {
        return new AuditLogDto(
                auditLog.getId(),
                auditLog.getActor() == null ? null : auditLog.getActor().getId(),
                auditLog.getActor() == null ? null : auditLog.getActor().getFullName(),
                auditLog.getAction(),
                auditLog.getTargetType(),
                auditLog.getTargetId(),
                auditLog.getDetails(),
                auditLog.getCreatedAt());
    }
}