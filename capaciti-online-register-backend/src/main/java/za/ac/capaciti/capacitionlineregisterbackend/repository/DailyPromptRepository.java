package za.ac.capaciti.capacitionlineregisterbackend.repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import za.ac.capaciti.capacitionlineregisterbackend.domain.DailyPrompt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;

public interface DailyPromptRepository extends JpaRepository<DailyPrompt, UUID> {

    Optional<DailyPrompt> findByUserAndPromptDateAndStage(User user, LocalDate date, PromptStage stage);

    boolean existsByUserAndPromptDateAndStage(User user, LocalDate date, PromptStage stage);

    List<DailyPrompt> findByUserAndPromptDateOrderByScheduledAtAsc(User user, LocalDate date);

    @Query("""
            SELECT p FROM DailyPrompt p
            WHERE p.user = :user
              AND p.status IN (
                  za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus.SCHEDULED,
                  za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus.ACTIVE)
              AND p.scheduledAt <= :now
              AND p.expiresAt > :now
            ORDER BY p.scheduledAt ASC
            """)
    List<DailyPrompt> findOpenForUser(@Param("user") User user, @Param("now") Instant now);

    @Query("""
            SELECT p FROM DailyPrompt p
            WHERE p.status = za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus.SCHEDULED
              AND p.scheduledAt <= :now
              AND p.expiresAt > :now
            """)
    List<DailyPrompt> findDueToActivate(@Param("now") Instant now);

    @Query("""
            SELECT p FROM DailyPrompt p
            WHERE p.status IN (
                  za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus.SCHEDULED,
                  za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus.ACTIVE)
              AND p.expiresAt <= :now
            """)
    List<DailyPrompt> findOverdue(@Param("now") Instant now);
}