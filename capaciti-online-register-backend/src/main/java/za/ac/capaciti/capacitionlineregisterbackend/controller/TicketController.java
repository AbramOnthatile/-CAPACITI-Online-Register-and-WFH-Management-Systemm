package za.ac.capaciti.capacitionlineregisterbackend.controller;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.CreateTicketRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.ResolveTicketRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.TicketActionResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.TicketDto;
import za.ac.capaciti.capacitionlineregisterbackend.enums.TicketStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.TicketType;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import za.ac.capaciti.capacitionlineregisterbackend.service.ITicketService;

@RestController
@RequestMapping("/api/v1")
public class TicketController {
    private final ITicketService ticketService;

    public TicketController(ITicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping("/tickets")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<TicketActionResponse> create(Authentication authentication,
                                                     @Valid @RequestBody CreateTicketRequest request) {
        return ResponseEntity.ok(ticketService.create(authentication.getName(), request));
    }

    @GetMapping("/tickets/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    public Page<TicketDto> mine(Authentication authentication,
                               @PageableDefault(size = 20) Pageable pageable) {
        return ticketService.mine(authentication.getName(), pageable);
    }

    @GetMapping("/tickets")
    @PreAuthorize("hasRole('TECH_CHAMP') or hasRole('ADMIN')")
    public Page<TicketDto> search(@RequestParam(required = false) TicketStatus status,
                                 @RequestParam(required = false) TicketType type,
                                 @RequestParam(required = false) WorkMode workMode,
                                 @RequestParam(required = false) Boolean prolonged,
                                 @PageableDefault(size = 20) Pageable pageable) {
        return ticketService.search(status, type, workMode, prolonged, pageable);
    }

    @PatchMapping("/tickets/{id}/resolve")
    @PreAuthorize("hasRole('TECH_CHAMP') or hasRole('ADMIN')")
    public ResponseEntity<TicketDto> resolve(Authentication authentication,
                                            @PathVariable UUID id,
                                            @Valid @RequestBody ResolveTicketRequest request) {
        return ResponseEntity.ok(ticketService.resolve(id, request, authentication.getName()));
    }
}
