package za.ac.capaciti.capacitionlineregisterbackend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Entity
@Table(
        name = "scorecard_entries",
        uniqueConstraints = @UniqueConstraint(columnNames = {"assessment_id", "candidate_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScorecardEntry extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private User candidate;

    @Column(name = "attendance_score")
    private Integer attendanceScore;

    @Column(name = "communication_score")
    private Integer communicationScore;

    @Column(name = "accountability_score")
    private Integer accountabilityScore;

    @Column(name = "creativity_score")
    private Integer creativityScore;

    @Column(name = "delivery_score")
    private Integer deliveryScore;

    @Column(name = "tech_skills_score")
    private Integer techSkillsScore;

    @Column(name = "overall_percent")
    private Integer overallPercent;

    @Column(name = "feedback", columnDefinition = "text")
    private String feedback;

    @Column(name = "feedback_strengths", columnDefinition = "text")
    private String feedbackStrengths;

    @Column(name = "feedback_improvements", columnDefinition = "text")
    private String feedbackImprovements;
}
