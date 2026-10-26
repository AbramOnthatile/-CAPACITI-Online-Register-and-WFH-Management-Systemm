package za.ac.capaciti.capacitionlineregisterbackend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.capaciti.capacitionlineregisterbackend.domain.Notification;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    @EntityGraph(attributePaths = "recipient")
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    Optional<Notification> findByIdAndRecipient(UUID id, User recipient);
}
