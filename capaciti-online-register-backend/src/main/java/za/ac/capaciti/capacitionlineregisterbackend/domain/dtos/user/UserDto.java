package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user;

import java.time.Instant;
import java.util.UUID;

import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;

public record UserDto(
        UUID id,
        String email,
        String fullName,
        String role,
        WorkMode defaultMode,
        UUID campusId,
        String campusName,
        UUID championId,
        boolean active,
        Instant createdAt) {
}