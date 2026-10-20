package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance;

public record AttendanceActionResponse(
        AttendanceDto attendance,
        boolean requiresReason,
        String feedbackMessage,
        boolean flagged) {
}