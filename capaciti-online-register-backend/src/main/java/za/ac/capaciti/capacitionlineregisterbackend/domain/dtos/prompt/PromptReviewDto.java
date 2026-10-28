package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus;

public record PromptReviewDto(
        UUID id,
        UUID userId,
        String userName,
        PromptStage stage,
        LocalDate promptDate,
        PromptStatus status,
        Instant submittedAt,
        boolean aiQualityFlag,
        Map<String, Object> response) {
}
