package za.ac.capaciti.capacitionlineregisterbackend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import za.ac.capaciti.capacitionlineregisterbackend.domain.QualityAttempt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.enums.QualityContext;

public interface QualityAttemptRepository extends JpaRepository<QualityAttempt, UUID> {

    Optional<QualityAttempt> findByUserAndContextTypeAndContextRef(User user, QualityContext type, String contextRef);
}