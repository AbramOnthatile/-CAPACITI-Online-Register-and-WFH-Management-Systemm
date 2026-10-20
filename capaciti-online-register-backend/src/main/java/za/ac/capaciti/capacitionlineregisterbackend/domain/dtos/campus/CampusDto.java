package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.campus;

import java.util.List;
import java.util.UUID;

public record CampusDto(
        UUID id,
        String name,
        double latitude,
        double longitude,
        int radiusM,
        List<String> whitelistedCidrs) {
}