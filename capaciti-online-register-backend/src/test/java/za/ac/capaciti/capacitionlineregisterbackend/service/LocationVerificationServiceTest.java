package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import za.ac.capaciti.capacitionlineregisterbackend.domain.CampusHub;

class LocationVerificationServiceTest {

    private final LocationVerificationService service = new LocationVerificationService();
    private final CampusHub campus = CampusHub.builder()
            .name("Campus").latitude(-33.9249).longitude(18.4241).radiusM(300).build();

    @Test
    void oneHundredthOfADegreeOfLatitudeIsAboutOneKilometre() {
        assertEquals(1112, LocationVerificationService.haversine(-33.9249, 18.4241, -33.9149, 18.4241), 2);
    }

    @Test
    void pointsInsideAndOutsideTheRadius() {
        assertTrue(service.isWithinRadius(campus, service.distanceToCampus(campus, -33.9240, 18.4241)));
        assertFalse(service.isWithinRadius(campus, service.distanceToCampus(campus, -33.9200, 18.4241)));
    }

    @Test
    void missingOrInvalidCoordinatesAreNotVerified() {
        assertNull(service.distanceToCampus(campus, null, 18.4241));
        assertNull(service.distanceToCampus(campus, 95.0, 18.4241));
        assertFalse(service.isWithinRadius(campus, null));
    }
}
