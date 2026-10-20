package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.auth;

import java.time.Instant;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.UserDto;

public record LoginResponse(String token, Instant expiresAt, UserDto user) {
}