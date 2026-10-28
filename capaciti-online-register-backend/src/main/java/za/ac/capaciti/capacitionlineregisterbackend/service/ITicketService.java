package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.CreateTicketRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.ResolveTicketRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.TicketActionResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.TicketDto;
import za.ac.capaciti.capacitionlineregisterbackend.enums.TicketStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.TicketType;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;

public interface ITicketService {
    TicketActionResponse create(String email, CreateTicketRequest request);
    Page<TicketDto> mine(String email, Pageable pageable);
    Page<TicketDto> search(TicketStatus status, TicketType type, WorkMode workMode, Boolean prolonged, Pageable pageable);
    TicketDto resolve(UUID id, ResolveTicketRequest request, String actorEmail);
    int flagProlonged();
}
