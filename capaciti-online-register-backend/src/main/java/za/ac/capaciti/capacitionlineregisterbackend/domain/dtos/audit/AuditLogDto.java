package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.audit;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLogDto(
        UUID id,
        UUID actorId,
        String actorName,
        String action,
        String targetType,
        String targetId,
        Map<String, Object> details,
        Instant createdAt) {
}