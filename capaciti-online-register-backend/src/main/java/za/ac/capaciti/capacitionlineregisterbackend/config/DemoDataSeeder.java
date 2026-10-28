package za.ac.capaciti.capacitionlineregisterbackend.config;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import za.ac.capaciti.capacitionlineregisterbackend.domain.CampusHub;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.enums.UserRole;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import za.ac.capaciti.capacitionlineregisterbackend.repository.CampusHubRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;

// Creates the demo campus and users when SEED_ENABLED=true. Existing rows are never changed.
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    static final String CAMPUS_NAME = "CAPACITI Cape Town";
    static final int CANDIDATE_COUNT = 5;

    private final UserRepository userRepository;
    private final CampusHubRepository campusHubRepository;
    private final PasswordEncoder passwordEncoder;
    private final String seedPassword;

    public DemoDataSeeder(
            UserRepository userRepository,
            CampusHubRepository campusHubRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed.password:}") String seedPassword) {
        this.userRepository = userRepository;
        this.campusHubRepository = campusHubRepository;
        this.passwordEncoder = passwordEncoder;
        this.seedPassword = seedPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (seedPassword == null || seedPassword.length() < 8) {
            log.warn("Seeder skipped: SEED_PASSWORD is not set or shorter than 8 characters");
            return;
        }

        CampusHub campus = campusHubRepository.findByName(CAMPUS_NAME).orElseGet(() -> {
            log.warn("Seeder created campus '{}' with placeholder coordinates; set the real ones with PUT /api/v1/campuses/{{id}}",
                    CAMPUS_NAME);
            return campusHubRepository.save(CampusHub.builder()
                    .name(CAMPUS_NAME)
                    .latitude(-33.9249)
                    .longitude(18.4241)
                    .radiusM(300)
                    .whitelistedCidrs(new ArrayList<>())
                    .build());
        });

        String encoded = passwordEncoder.encode(seedPassword);
        List<String> created = new ArrayList<>();
        seedUser("admin@example.com", "Demo", "Admin", UserRole.ADMIN, campus, null, encoded, created);
        User champion = seedUser("champ@example.com", "Demo", "Champion", UserRole.TECH_CHAMP, campus, null, encoded, created);
        for (int index = 1; index <= CANDIDATE_COUNT; index++) {
            seedUser("candidate" + index + "@example.com", "Candidate", String.valueOf(index),
                    UserRole.CANDIDATE, campus, champion, encoded, created);
        }

        log.info("Seeder finished: {} demo users created, {} already existed",
                created.size(), CANDIDATE_COUNT + 2 - created.size());
    }

    private User seedUser(String email, String firstName, String lastName, UserRole role,
                          CampusHub campus, User champion, String passwordHash, List<String> created) {
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User user = new User();
            user.setEmail(email);
            user.setPasswordHash(passwordHash);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setRole(role.name());
            user.setWorkMode(WorkMode.ON_SITE);
            user.setCampus(campus);
            user.setChampion(champion);
            user.setActive(true);
            created.add(email);
            return userRepository.save(user);
        });
    }
}
