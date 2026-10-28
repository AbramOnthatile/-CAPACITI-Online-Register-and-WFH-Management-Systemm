package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.ac.capaciti.capacitionlineregisterbackend.client.TeamsWebhookClient;
import za.ac.capaciti.capacitionlineregisterbackend.domain.SupportTicket;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.WfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.CreateTicketRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.ResolveTicketRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.TicketActionResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.ticket.TicketDto;
import za.ac.capaciti.capacitionlineregisterbackend.enums.QualityContext;
import za.ac.capaciti.capacitionlineregisterbackend.enums.TicketStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.TicketType;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ConflictException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ResourceNotFoundException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.TicketMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.SupportTicketRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.WfhRequestRepository;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Service
public class TicketService implements ITicketService {
    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;
    private final WfhRequestRepository wfhRequestRepository;
    private final TicketMapper ticketMapper;
    private final IQualityGateService qualityGateService;
    private final AuditService auditService;
    private final TeamsWebhookClient teamsWebhookClient;

    public TicketService(SupportTicketRepository supportTicketRepository,
                        UserRepository userRepository,
                        WfhRequestRepository wfhRequestRepository,
                        TicketMapper ticketMapper,
                        IQualityGateService qualityGateService,
                        AuditService auditService,
                        TeamsWebhookClient teamsWebhookClient) {
        this.supportTicketRepository = supportTicketRepository;
        this.userRepository = userRepository;
        this.wfhRequestRepository = wfhRequestRepository;
        this.ticketMapper = ticketMapper;
        this.qualityGateService = qualityGateService;
        this.auditService = auditService;
        this.teamsWebhookClient = teamsWebhookClient;
    }

    @Override
    public TicketActionResponse create(String email, CreateTicketRequest request) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (request.attachmentUrl() != null && !request.attachmentUrl().startsWith("https://")) {
            throw new BadRequestException("Attachment link must start with https://");
        }

        WorkMode workMode = wfhRequestRepository.findApprovedCoveringForUser(user, TimeUtil.today()).isEmpty()
                ? WorkMode.ON_SITE
                : WorkMode.WFH;

        QualityResult quality = qualityGateService.check(user, QualityContext.TICKET, request.draftKey(), request.description());
        if (!quality.accepted()) {
            return new TicketActionResponse(null, quality);
        }

        SupportTicket ticket = SupportTicket.builder()
                .user(user)
                .type(request.type())
                .workMode(workMode)
                .title(request.title())
                .description(request.description())
                .attachmentUrl(request.attachmentUrl())
                .status(TicketStatus.OPEN)
                .prolonged(false)
                .aiQualityFlag(quality.flagged())
                .build();

        SupportTicket saved = supportTicketRepository.save(ticket);

        // Only an on-site IT issue alerts Teams on creation; a new BLOCKER never does.
        if (saved.getType() == TicketType.IT_ISSUE && saved.getWorkMode() == WorkMode.ON_SITE) {
            teamsWebhookClient.sendAlert("On-site IT issue", saved.getTitle(), Map.of(
                    "Candidate", candidateName(user),
                    "Ticket", String.valueOf(saved.getId())));
        }

        return new TicketActionResponse(ticketMapper.toDto(saved), quality);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketDto> mine(String email, Pageable pageable) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return supportTicketRepository.findByUserOrderByCreatedAtDesc(user, pageable)
                .map(ticketMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketDto> search(TicketStatus status, TicketType type, WorkMode workMode, Boolean prolonged, Pageable pageable) {
        return supportTicketRepository.search(status, type, workMode, prolonged, pageable)
                .map(ticketMapper::toDto);
    }

    @Override
    @Transactional
    public TicketDto resolve(UUID id, ResolveTicketRequest request, String actorEmail) {
        User actor = userRepository.findByEmailIgnoreCase(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + actorEmail));
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found: " + id));

        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new ConflictException("TICKET_ALREADY_RESOLVED", "Ticket has already been resolved.");
        }

        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolvedBy(actor);
        ticket.setResolvedAt(Instant.now());
        ticket.setResolutionNote(request.resolutionNote());

        SupportTicket saved = supportTicketRepository.save(ticket);
        auditService.log("TICKET_RESOLVED", saved.getId(), "SupportTicket", Map.of(
                "type", saved.getType(),
                "workMode", saved.getWorkMode(),
                "prolonged", saved.isProlonged()
        ));
        return ticketMapper.toDto(saved);
    }

    private String candidateName(User user) {
        return user == null ? "Unknown" : user.getFullName();
    }

    @Override
    @Transactional
    public int flagProlonged() {
        Instant cutoff = Instant.now().minusSeconds(60 * 60L);
        List<SupportTicket> tickets = supportTicketRepository.findOpenBlockersOlderThan(cutoff);
        for (SupportTicket ticket : tickets) {
            ticket.setProlonged(true);
            supportTicketRepository.save(ticket);
            teamsWebhookClient.sendAlert("Blocker open for over 60 minutes", ticket.getTitle(), Map.of(
                    "Candidate", candidateName(ticket.getUser()),
                    "Ticket", String.valueOf(ticket.getId())));
        }
        return tickets.size();
    }
}
