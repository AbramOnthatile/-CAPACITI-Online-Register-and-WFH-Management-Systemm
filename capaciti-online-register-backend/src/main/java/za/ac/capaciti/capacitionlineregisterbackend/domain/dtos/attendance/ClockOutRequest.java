package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance;

public record ClockOutRequest(
        String earlyClockoutReason,
        String lateClockoutNote,
        String deliverableLink) {
}