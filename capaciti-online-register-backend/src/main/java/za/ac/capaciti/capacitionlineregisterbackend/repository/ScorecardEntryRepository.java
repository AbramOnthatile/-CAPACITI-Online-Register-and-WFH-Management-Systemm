package za.ac.capaciti.capacitionlineregisterbackend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.capaciti.capacitionlineregisterbackend.domain.ScorecardEntry;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentStatus;

public interface ScorecardEntryRepository extends JpaRepository<ScorecardEntry, UUID> {

    @EntityGraph(attributePaths = "candidate")
    List<ScorecardEntry> findByAssessmentId(UUID id);

    @EntityGraph(attributePaths = "assessment")
    List<ScorecardEntry> findByCandidateIdAndAssessmentStatusOrderByAssessmentAssessmentDateDescAssessmentSubmittedAtDesc(
            UUID candidateId, AssessmentStatus status);

    @EntityGraph(attributePaths = "assessment")
    Optional<ScorecardEntry> findByAssessmentIdAndCandidateId(UUID assessmentId, UUID candidateId);

    long countByAssessmentId(UUID assessmentId);

    @Query("select avg(entry.overallPercent) from ScorecardEntry entry where entry.assessment.id = :assessmentId")
    Double averageOverallByAssessmentId(@Param("assessmentId") UUID assessmentId);
}
