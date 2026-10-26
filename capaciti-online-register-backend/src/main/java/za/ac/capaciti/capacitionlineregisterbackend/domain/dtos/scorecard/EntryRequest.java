package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record EntryRequest(
        UUID candidateId,
        @Min(1) @Max(5) Integer attendanceScore,
        @Min(1) @Max(5) Integer communicationScore,
        @Min(1) @Max(5) Integer accountabilityScore,
        @Min(1) @Max(5) Integer creativityScore,
        @Min(1) @Max(5) Integer deliveryScore,
        @Min(1) @Max(5) Integer techSkillsScore,
        @Size(max = 2000) String feedback,
        @Size(max = 2000) String feedbackStrengths,
        @Size(max = 2000) String feedbackImprovements) {
}
