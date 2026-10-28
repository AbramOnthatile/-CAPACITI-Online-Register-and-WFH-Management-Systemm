package za.ac.capaciti.capacitionlineregisterbackend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.WfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WfhStatus;

public interface WfhRequestRepository extends JpaRepository<WfhRequest, UUID> {

    @Query("select w from WfhRequest w where w.status = za.ac.capaciti.capacitionlineregisterbackend.enums.WfhStatus.APPROVED and w.startDate <= :date and w.endDate >= :date and w.user = :user")
    List<WfhRequest> findApprovedCoveringForUser(@Param("user") User user, @Param("date") LocalDate date);

    @Query("select w from WfhRequest w join fetch w.user where w.status = za.ac.capaciti.capacitionlineregisterbackend.enums.WfhStatus.APPROVED and w.startDate <= :date and w.endDate >= :date")
    List<WfhRequest> findApprovedCovering(@Param("date") LocalDate date);

    @Query("select case when count(w) > 0 then true else false end from WfhRequest w where w.user = :user and w.startDate <= :end and w.endDate >= :start and (w.status = za.ac.capaciti.capacitionlineregisterbackend.enums.WfhStatus.PENDING or w.status = za.ac.capaciti.capacitionlineregisterbackend.enums.WfhStatus.APPROVED)")
    boolean existsOverlapping(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end);

    Page<WfhRequest> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    @Query("select r from WfhRequest r " +
            "where (:status is null or r.status = :status) " +
            "and (:userId is null or r.user.id = :userId) " +
            "and (cast(:from as LocalDate) is null or r.startDate >= :from) " +
            "and (cast(:to as LocalDate) is null or r.endDate <= :to) " +
            "order by r.createdAt desc")
    @EntityGraph(attributePaths = {"user", "reviewedBy"})
    Page<WfhRequest> search(@Param("status") WfhStatus status,
                           @Param("userId") UUID userId,
                           @Param("from") LocalDate from,
                           @Param("to") LocalDate to,
                           Pageable pageable);

    @EntityGraph(attributePaths = {"user", "reviewedBy"})
    Optional<WfhRequest> findWithUsersById(UUID id);
}
