package za.ac.capaciti.capacitionlineregisterbackend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import za.ac.capaciti.capacitionlineregisterbackend.domain.CampusHub;

public interface CampusHubRepository extends JpaRepository<CampusHub, UUID> {

    Optional<CampusHub> findByName(String name);
}