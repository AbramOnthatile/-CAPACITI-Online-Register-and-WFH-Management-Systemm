package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketStatus;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketType;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.WorkMode;

public record TicketDto(
        UUID id,
        UUID userId,
        String userName,
        TicketType type,
        WorkMode workMode,
        String title,
        String description,
        String attachmentUrl,
        TicketStatus status,
        @JsonProperty("isProlonged") boolean prolonged,
        String resolvedByName,
        Instant resolvedAt,
        String resolutionNote,
        boolean aiQualityFlag,
        Instant createdAt,
        long ageMinutes
) {
}
