package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report;

public record PromptStageStatDto(
        String stage,
        long submitted,
        long expired,
        long other) {
}
