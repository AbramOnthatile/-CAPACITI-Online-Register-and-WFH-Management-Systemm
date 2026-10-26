package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard;

import java.time.LocalDate;
import java.util.UUID;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentType;

public record MyScorecardDto(
        UUID assessmentId,
        String title,
        AssessmentType type,
        LocalDate assessmentDate,
        ScorecardScores scores,
        Integer overallPercent,
        String feedback,
        String feedbackStrengths,
        String feedbackImprovements,
        String groupFeedback) {
}
