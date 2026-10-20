package za.ac.capaciti.capacitionlineregisterbackend.domain;

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
import za.ac.capaciti.capacitionlineregisterbackend.enums.QualityContext;

@Entity
@Table(name = "quality_attempts", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "context_type", "context_ref" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QualityAttempt extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "context_type", nullable = false)
    private QualityContext contextType;

    @Column(name = "context_ref", nullable = false)
    private String contextRef;

    @Builder.Default
    @Column(name = "attempts", nullable = false)
    private int attempts = 0;

    @Column(name = "last_feedback")
    private String lastFeedback;
}