package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard;

import java.util.UUID;

public record EntryDto(
        UUID candidateId,
        String candidateName,
        ScorecardScores scores,
        Integer overallPercent,
        String feedback,
        String feedbackStrengths,
        String feedbackImprovements) {
}
