package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import za.ac.capaciti.capacitionlineregisterbackend.domain.CampusHub;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.campus.UpdateCampusRequest;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ApiException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.CampusMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.CampusHubRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class CampusServiceTest {

    private static final String EMAIL = "admin@example.com";
    private static final String PASSWORD = "Correct-Horse-1";

    @Mock private CampusHubRepository campusHubRepository;
    @Mock private IAuditService auditService;
    @Mock private UserRepository userRepository;

    private CampusService service;
    private CampusHub campus;
    private final UpdateCampusRequest request = new UpdateCampusRequest("Cape Town", -33.9, 18.4, 250);

    @BeforeEach
    void setUp() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        service = new CampusService(campusHubRepository, new CampusMapper(), new IpWhitelistService(""),
                auditService, userRepository, new PasswordConfirmationService(encoder));
        User admin = new User();
        admin.setEmail(EMAIL);
        admin.setRole("ADMIN");
        admin.setPasswordHash(encoder.encode(PASSWORD));
        campus = CampusHub.builder().name("Cape Town").latitude(-33.93).longitude(18.46).radiusM(300)
                .whitelistedCidrs(new ArrayList<>(List.of("196.0.0.0/24"))).build();
        campus.setId(UUID.randomUUID());
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(admin));
        lenient().when(campusHubRepository.findById(campus.getId())).thenReturn(Optional.of(campus));
        lenient().when(campusHubRepository.findByName(any())).thenReturn(Optional.of(campus));
        lenient().when(campusHubRepository.save(any(CampusHub.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void wrongPasswordChangesNothing() {
        ApiException exception = assertThrows(ApiException.class,
                () -> service.update(campus.getId(), request, EMAIL, "not-my-password"));

        assertEquals("PASSWORD_CONFIRMATION_FAILED", exception.getCode());
        assertEquals(300, campus.getRadiusM());
        verify(campusHubRepository, never()).save(any());
    }

    @Test
    void missingPasswordIsAskedFor() {
        ApiException exception = assertThrows(ApiException.class,
                () -> service.removeCidr(campus.getId(), "196.0.0.0/24", EMAIL, null));

        assertEquals("PASSWORD_CONFIRMATION_REQUIRED", exception.getCode());
        assertEquals(List.of("196.0.0.0/24"), campus.getWhitelistedCidrs());
    }

    @Test
    void correctPasswordSavesTheChange() {
        service.update(campus.getId(), request, EMAIL, PASSWORD);

        assertEquals(250, campus.getRadiusM());
        verify(campusHubRepository).save(campus);
    }
}
