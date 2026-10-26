package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAnnouncementRequest(
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 2000) String message
) {
}
