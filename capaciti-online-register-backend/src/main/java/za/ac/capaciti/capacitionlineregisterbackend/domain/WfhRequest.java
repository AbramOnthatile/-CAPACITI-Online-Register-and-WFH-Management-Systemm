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
import java.time.LocalDate;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WfhStatus;

@Entity
@Table(name = "wfh_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WfhRequest extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "reason", nullable = false, columnDefinition = "text")
    private String reason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "readiness", nullable = true)
    private Map<String, Object> readiness;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private WfhStatus status = WfhStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by", nullable = true)
    private User reviewedBy;

    @Column(name = "reviewed_at", nullable = true)
    private Instant reviewedAt;

    @Column(name = "review_comment", nullable = true)
    private String reviewComment;

    @Column(name = "ai_quality_flag", nullable = false)
    private boolean aiQualityFlag = false;
}
