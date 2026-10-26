package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentType;

public record AssessmentSummaryDto(
        UUID id,
        String title,
        AssessmentType type,
        AssessmentStatus status,
        LocalDate assessmentDate,
        LocalDate periodStart,
        LocalDate periodEnd,
        long entryCount,
        Integer groupAveragePercent,
        Instant submittedAt) {
}
