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
import za.ac.capaciti.capacitionlineregisterbackend.enums.Role;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByRole(Role role);

    @Query("""
            SELECT u FROM User u
            WHERE (:role IS NULL OR u.role = :role)
              AND (:active IS NULL OR u.active = :active)
              AND (:text IS NULL
                   OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :text, '%'))
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%', :text, '%')))
            """)
    Page<User> searchUsers(
            @Param("role") Role role,
            @Param("active") Boolean active,
            @Param("text") String text,
            Pageable pageable);
}
