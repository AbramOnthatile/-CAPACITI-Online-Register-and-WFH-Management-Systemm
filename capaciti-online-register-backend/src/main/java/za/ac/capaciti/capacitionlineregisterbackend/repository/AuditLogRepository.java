package za.ac.capaciti.capacitionlineregisterbackend.repository;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import za.ac.capaciti.capacitionlineregisterbackend.domain.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query(value = """
            SELECT a FROM AuditLog a
            WHERE (:actorId IS NULL OR a.actor.id = :actorId)
              AND (:action IS NULL OR a.action = :action)
              AND (:createdFrom IS NULL OR a.createdAt >= :createdFrom)
              AND (:createdTo IS NULL OR a.createdAt <= :createdTo)
            ORDER BY a.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(a) FROM AuditLog a
            WHERE (:actorId IS NULL OR a.actor.id = :actorId)
              AND (:action IS NULL OR a.action = :action)
              AND (:createdFrom IS NULL OR a.createdAt >= :createdFrom)
              AND (:createdTo IS NULL OR a.createdAt <= :createdTo)
            """)
    Page<AuditLog> searchAuditLogs(
            @Param("actorId") UUID actorId,
            @Param("action") String action,
            @Param("createdFrom") Instant createdFrom,
            @Param("createdTo") Instant createdTo,
            Pageable pageable);
}