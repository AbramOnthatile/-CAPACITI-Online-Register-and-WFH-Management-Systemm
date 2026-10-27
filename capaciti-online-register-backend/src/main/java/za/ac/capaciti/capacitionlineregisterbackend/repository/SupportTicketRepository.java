package za.ac.capaciti.capacitionlineregisterbackend.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.capaciti.capacitionlineregisterbackend.domain.SupportTicket;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketStatus;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketType;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.WorkMode;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {

    Page<SupportTicket> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    long countByUserAndStatus(User user, TicketStatus status);

    long countByUserAndTypeAndStatusAndProlongedTrue(User user, TicketType type, TicketStatus status);

    @Query("select t from SupportTicket t " +
            "where (:status is null or t.status = :status) " +
            "and (:type is null or t.type = :type) " +
            "and (:workMode is null or t.workMode = :workMode) " +
            "and (:prolonged is null or t.prolonged = :prolonged) " +
            "order by t.prolonged desc, t.createdAt asc")
    @EntityGraph(attributePaths = {"user", "resolvedBy"})
    Page<SupportTicket> search(@Param("status") TicketStatus status,
                              @Param("type") TicketType type,
                              @Param("workMode") WorkMode workMode,
                              @Param("prolonged") Boolean prolonged,
                              Pageable pageable);

    @EntityGraph(attributePaths = {"user", "resolvedBy"})
    Optional<SupportTicket> findWithUsersById(UUID id);

    @Query("select t from SupportTicket t where t.type = za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketType.BLOCKER and t.status = za.ac.capaciti.capacitionlineregisterbackend.domain.enums.TicketStatus.OPEN and t.prolonged = false and t.createdAt < :cutoff")
    List<SupportTicket> findOpenBlockersOlderThan(@Param("cutoff") Instant cutoff);
}
