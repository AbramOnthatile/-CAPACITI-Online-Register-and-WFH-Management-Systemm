package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common;

public record QualityResult(
        boolean accepted,
        boolean isValid,
        String feedbackMessage,
        int attempt,
        boolean flagged) {

    public QualityResult(boolean accepted, boolean flagged, String message) {
        this(accepted, accepted && !flagged, message, 0, flagged);
    }
}
