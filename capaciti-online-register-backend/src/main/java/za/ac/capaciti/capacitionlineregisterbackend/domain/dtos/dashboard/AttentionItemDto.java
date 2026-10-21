package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.dashboard;

import java.time.Instant;
import java.util.UUID;

public record AttentionItemDto(
        UUID userId,
        String userName,
        String reason,
        Instant clockInAt) {
}
