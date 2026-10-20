package za.ac.capaciti.capacitionlineregisterbackend.mappers;

import org.springframework.stereotype.Component;

import za.ac.capaciti.capacitionlineregisterbackend.domain.DailyPrompt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.PromptDto;

@Component
public class PromptMapper {

    public PromptDto toDto(DailyPrompt prompt) {
        return new PromptDto(
                prompt.getId(),
                prompt.getStage(),
                prompt.getPromptDate(),
                prompt.getScheduledAt(),
                prompt.getExpiresAt(),
                prompt.getStatus(),
                prompt.getSubmittedAt(),
                prompt.getAttemptCount(),
                prompt.isAiQualityFlag(),
                prompt.getResponse());
    }
}