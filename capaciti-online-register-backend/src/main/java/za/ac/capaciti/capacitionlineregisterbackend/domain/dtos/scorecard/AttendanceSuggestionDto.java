package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard;

import java.util.UUID;

public record AttendanceSuggestionDto(
        UUID candidateId,
        int onTime,
        int lateExcused,
        int lateUnexcused,
        int absent,
        int suggestedScore) {
}
