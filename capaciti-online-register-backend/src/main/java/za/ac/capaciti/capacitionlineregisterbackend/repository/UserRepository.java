package za.ac.capaciti.capacitionlineregisterbackend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import za.ac.capaciti.capacitionlineregisterbackend.domain.User;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByRoleAndActive(String role, boolean active);

    List<User> findByChampionAndRoleAndActive(User champion, String role, boolean active);

    List<User> findByRole(String role);

    // CAST keeps PostgreSQL from typing a null :text as bytea.
    @Query("""
            SELECT u FROM User u
            WHERE (:role IS NULL OR u.role = :role)
              AND (:active IS NULL OR u.active = :active)
              AND (CAST(:text AS String) IS NULL
                   OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:text AS String), '%'))
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:text AS String), '%')))
            """)
    Page<User> searchUsers(
            @Param("role") String role,
            @Param("active") Boolean active,
            @Param("text") String text,
            Pageable pageable);

    @Query("""
            SELECT u FROM User u
            WHERE u.role = 'CANDIDATE'
              AND u.champion.id = :championId
              AND (:active IS NULL OR u.active = :active)
              AND (CAST(:text AS String) IS NULL
                   OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:text AS String), '%'))
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:text AS String), '%')))
            """)
    Page<User> searchCandidatesOfChampion(
            @Param("championId") UUID championId,
            @Param("active") Boolean active,
            @Param("text") String text,
            Pageable pageable);
}
