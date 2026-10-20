package za.ac.capaciti.capacitionlineregisterbackend.client;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GeminiVerdict(
        @JsonProperty("isValid") boolean isValid,
        String feedbackMessage) {
}