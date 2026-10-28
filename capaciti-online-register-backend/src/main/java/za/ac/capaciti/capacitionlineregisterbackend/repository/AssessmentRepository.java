package za.ac.capaciti.capacitionlineregisterbackend.repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.capaciti.capacitionlineregisterbackend.domain.Assessment;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentType;

public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {

    @Query("""
            select a from Assessment a
            where (:mentorId is null or a.mentor.id = :mentorId)
              and (:type is null or a.type = :type)
              and (:status is null or a.status = :status)
              and (cast(:from as LocalDate) is null or a.assessmentDate >= :from)
              and (cast(:to as LocalDate) is null or a.assessmentDate <= :to)
            """)
    @EntityGraph(attributePaths = "mentor")
    Page<Assessment> search(
            @Param("mentorId") UUID mentorId,
            @Param("type") AssessmentType type,
            @Param("status") AssessmentStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    @Query("""
            select a from Assessment a
            where a.status = za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentStatus.SUBMITTED
              and (:type is null or a.type = :type)
              and (cast(:from as LocalDate) is null or a.assessmentDate >= :from)
              and (cast(:to as LocalDate) is null or a.assessmentDate <= :to)
            """)
    Page<Assessment> searchSubmitted(
            @Param("type") AssessmentType type,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    @EntityGraph(attributePaths = "mentor")
    Optional<Assessment> findWithMentorById(UUID id);
}
