package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import za.ac.capaciti.capacitionlineregisterbackend.domain.SupportTicket;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.WfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.CreateTicketRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.ResolveTicketRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.TicketActionResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.TicketDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketStatus;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketType;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.WorkMode;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ConflictException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.TicketMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.SupportTicketRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.WfhRequestRepository;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {
    @Mock
    private SupportTicketRepository supportTicketRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WfhRequestRepository wfhRequestRepository;

    @Mock
    private TicketMapper ticketMapper;

    @Mock
    private IQualityGateService qualityGateService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private TicketService service;

    @Test
    void workModeIsWfhWhenApprovedRequestCoversToday() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("candidate@test.com");
        when(userRepository.findByEmail("candidate@test.com")).thenReturn(Optional.of(user));
        when(wfhRequestRepository.findApprovedCoveringForUser(user, any())).thenReturn(List.of(new WfhRequest()));
        when(qualityGateService.check(eq(user), eq("TICKET"), eq("draft-1"), eq("issue"))).thenReturn(new QualityResult(true, false, "ok"));
        when(supportTicketRepository.save(any(SupportTicket.class))).thenAnswer(invocation -> {
            SupportTicket saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });
        when(ticketMapper.toDto(any(SupportTicket.class))).thenReturn(new TicketDto(UUID.randomUUID(), user.getId(), "Jane Doe", TicketType.IT_ISSUE, WorkMode.WFH, "title", "issue", null, TicketStatus.OPEN, false, null, null, null, false, Instant.now(), 0));

        TicketActionResponse response = service.create("candidate@test.com", new CreateTicketRequest("draft-1", TicketType.IT_ISSUE, "title", "issue", null));
        assertEquals(WorkMode.WFH, response.ticket().workMode());
    }

    @Test
    void invalidAttachmentLinkThrowsBadRequest() {
        User user = new User();
        user.setEmail("candidate@test.com");
        when(userRepository.findByEmail("candidate@test.com")).thenReturn(Optional.of(user));
        CreateTicketRequest request = new CreateTicketRequest("draft-2", TicketType.ACCOUNT, "title", "issue", "ftp://example.com/file");
        assertThrows(BadRequestException.class, () -> service.create("candidate@test.com", request));
    }

    @Test
    void flagProlongedMarksOnlyReturnedTicketsAndReturnsCount() {
        SupportTicket a = new SupportTicket();
        a.setId(UUID.randomUUID());
        a.setProlonged(false);
        SupportTicket b = new SupportTicket();
        b.setId(UUID.randomUUID());
        b.setProlonged(false);
        when(supportTicketRepository.findOpenBlockersOlderThan(any())).thenReturn(List.of(a, b));
        when(supportTicketRepository.save(any(SupportTicket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        int count = service.flagProlonged();
        assertEquals(2, count);
        assertEquals(true, a.isProlonged());
        assertEquals(true, b.isProlonged());
    }

    @Test
    void resolveOnResolvedTicketThrowsConflict() {
        User actor = new User();
        actor.setEmail("champion@test.com");
        when(userRepository.findByEmail("champion@test.com")).thenReturn(Optional.of(actor));
        SupportTicket ticket = new SupportTicket();
        ticket.setId(UUID.randomUUID());
        ticket.setStatus(TicketStatus.RESOLVED);
        when(supportTicketRepository.findById(any())).thenReturn(Optional.of(ticket));

        assertThrows(ConflictException.class, () -> service.resolve(UUID.randomUUID(), new ResolveTicketRequest("Solved"), "champion@test.com"));
    }
}
