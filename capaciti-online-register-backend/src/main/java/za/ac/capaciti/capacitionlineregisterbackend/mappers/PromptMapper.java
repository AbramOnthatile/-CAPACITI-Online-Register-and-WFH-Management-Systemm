package za.ac.capaciti.capacitionlineregisterbackend.mappers;

import org.springframework.stereotype.Component;

import za.ac.capaciti.capacitionlineregisterbackend.domain.DailyPrompt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.PromptDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.PromptReviewDto;

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

    public PromptReviewDto toReviewDto(DailyPrompt prompt) {
        return new PromptReviewDto(
                prompt.getId(),
                prompt.getUser().getId(),
                prompt.getUser().getFullName(),
                prompt.getStage(),
                prompt.getPromptDate(),
                prompt.getStatus(),
                prompt.getSubmittedAt(),
                prompt.isAiQualityFlag(),
                prompt.getResponse());
    }
}