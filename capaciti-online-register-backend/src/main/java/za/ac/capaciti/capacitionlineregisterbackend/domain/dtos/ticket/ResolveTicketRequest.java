package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResolveTicketRequest(@NotBlank @Size(max = 1000) String resolutionNote) {
}
