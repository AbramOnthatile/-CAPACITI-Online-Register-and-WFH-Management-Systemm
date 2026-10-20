package za.ac.capaciti.capacitionlineregisterbackend.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus;

@Entity
@Table(name = "daily_prompts", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "prompt_date", "stage" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyPrompt extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_id", nullable = true)
    private AttendanceRecord attendance;

    @Column(name = "prompt_date", nullable = false)
    private LocalDate promptDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", nullable = false)
    private PromptStage stage;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PromptStatus status = PromptStatus.SCHEDULED;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response")
    private Map<String, Object> response;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Builder.Default
    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Builder.Default
    @Column(name = "ai_quality_flag", nullable = false)
    private boolean aiQualityFlag = false;
}