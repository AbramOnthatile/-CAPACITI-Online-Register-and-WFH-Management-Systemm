package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.notification;

import java.time.Instant;
import java.util.UUID;

public record NotificationDto(
        UUID id,
        String title,
        String message,
        Instant timestamp,
        String type,
        boolean read
) {
}
