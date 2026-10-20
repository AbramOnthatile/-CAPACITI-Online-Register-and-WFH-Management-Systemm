package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.WfhStatus;

public record WfhRequestDto(
        UUID id,
        UUID userId,
        String userName,
        LocalDate startDate,
        LocalDate endDate,
        String reason,
        ReadinessDto readiness,
        WfhStatus status,
        String reviewedByName,
        Instant reviewedAt,
        String reviewComment,
        boolean aiQualityFlag,
        Instant createdAt
) {
}
