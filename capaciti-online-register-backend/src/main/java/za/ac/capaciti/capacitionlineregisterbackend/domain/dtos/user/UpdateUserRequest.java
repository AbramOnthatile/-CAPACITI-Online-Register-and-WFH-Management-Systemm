package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user;

import java.util.UUID;

import za.ac.capaciti.capacitionlineregisterbackend.enums.UserRole;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRequest(
        @NotBlank String fullName,
        @NotNull WorkMode defaultMode,
        UUID campusId,
        UUID championId,
        @NotNull UserRole role) {
}