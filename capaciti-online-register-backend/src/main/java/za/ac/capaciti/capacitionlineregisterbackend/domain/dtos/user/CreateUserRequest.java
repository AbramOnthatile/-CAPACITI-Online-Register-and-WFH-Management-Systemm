package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user;

import java.util.UUID;

import za.ac.capaciti.capacitionlineregisterbackend.enums.Role;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank @Email String email,
        @NotBlank String fullName,
        @NotBlank @Size(min = 8) String temporaryPassword,
        @NotNull Role role,
        @NotNull WorkMode defaultMode,
        UUID campusId,
        UUID championId) {
}