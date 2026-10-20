package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common;

import com.fasterxml.jackson.annotation.JsonProperty;

public record QualityResult(
        boolean accepted,
        @JsonProperty("isValid") boolean isValid,
        String feedbackMessage,
        int attempt,
        boolean flagged) {
}