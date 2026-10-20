package za.ac.capaciti.capacitionlineregisterbackend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketStatus;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketType;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.WorkMode;

@Entity
@Table(name = "support_tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportTicket extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TicketType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_mode", nullable = false)
    private WorkMode workMode;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "attachment_url", nullable = true)
    private String attachmentUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TicketStatus status = TicketStatus.OPEN;

    @Column(name = "is_prolonged", nullable = false)
    private boolean prolonged = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by", nullable = true)
    private User resolvedBy;

    @Column(name = "resolved_at", nullable = true)
    private Instant resolvedAt;

    @Column(name = "resolution_note", nullable = true)
    private String resolutionNote;

    @Column(name = "ai_quality_flag", nullable = false)
    private boolean aiQualityFlag = false;
}
