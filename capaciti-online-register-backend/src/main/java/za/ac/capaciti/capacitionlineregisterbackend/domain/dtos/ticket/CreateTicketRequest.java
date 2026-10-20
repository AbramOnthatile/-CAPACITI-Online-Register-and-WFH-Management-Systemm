package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketType;

public record CreateTicketRequest(
        @NotBlank @Size(max = 64) String draftKey,
        @NotNull TicketType type,
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 2000) String description,
        @Size(max = 500) String attachmentUrl
) {
}
