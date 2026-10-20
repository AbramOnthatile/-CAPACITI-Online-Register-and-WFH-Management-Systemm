package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;

public record SubmitPromptResponse(PromptDto prompt, QualityResult quality) {
}