package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance;

public record ClockInRequest(
        Double latitude,
        Double longitude,
        Double accuracyM) {
}