package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance;

import jakarta.validation.constraints.NotBlank;

public record ExcuseRequest(@NotBlank String reason) {
}
