package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus;

public record PromptDto(
        UUID id,
        PromptStage stage,
        LocalDate promptDate,
        Instant scheduledAt,
        Instant expiresAt,
        PromptStatus status,
        Instant submittedAt,
        int attemptCount,
        boolean aiQualityFlag,
        Map<String, Object> response) {
}