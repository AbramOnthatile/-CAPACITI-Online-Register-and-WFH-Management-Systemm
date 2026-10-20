package za.ac.capaciti.capacitionlineregisterbackend.mappers;

import java.time.Duration;
import java.time.Instant;
import org.springframework.stereotype.Component;
import za.ac.capaciti.capacitionlineregisterbackend.domain.SupportTicket;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.TicketDto;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Component
public class TicketMapper {

    public TicketDto toDto(SupportTicket ticket) {
        if (ticket == null) {
            return null;
        }

        Instant now = TimeUtil.now();
        long ageMinutes = Duration.between(ticket.getCreatedAt(), now).toMinutes();

        return new TicketDto(
                ticket.getId(),
                ticket.getUser() != null ? ticket.getUser().getId() : null,
                ticket.getUser() != null ? ticket.getUser().getFullName() : null,
                ticket.getType(),
                ticket.getWorkMode(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getAttachmentUrl(),
                ticket.getStatus(),
                ticket.isProlonged(),
                ticket.getResolvedBy() != null ? ticket.getResolvedBy().getFullName() : null,
                ticket.getResolvedAt(),
                ticket.getResolutionNote(),
                ticket.isAiQualityFlag(),
                ticket.getCreatedAt(),
                ageMinutes
        );
    }
}
