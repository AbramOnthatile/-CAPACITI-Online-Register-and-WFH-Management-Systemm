package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance;

import jakarta.validation.constraints.NotNull;

import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;

public record ClockInRequest(
        String draftKey,
        @NotNull WorkMode workMode,
        String lateReason,
        Double latitude,
        Double longitude,
        Double accuracyM) {
}
