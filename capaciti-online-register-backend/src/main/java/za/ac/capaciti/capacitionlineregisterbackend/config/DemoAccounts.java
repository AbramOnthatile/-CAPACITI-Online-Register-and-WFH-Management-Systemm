package za.ac.capaciti.capacitionlineregisterbackend.config;

import java.util.Locale;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import za.ac.capaciti.capacitionlineregisterbackend.domain.User;

// The seeded presentation accounts (see DemoDataSeeder). With DEMO_RELAXED_RULES on (the default)
// they can clock in and out at any hour and from anywhere, without approvals or reasons,
// so the full flow can be shown live. Real accounts always get the normal rules.
@Component
public class DemoAccounts {

    static final Set<String> EMAILS = Set.of(
            "admin@capaciti.com",
            "champ@capaciti.com",
            "candidate1@capaciti.com",
            "candidate2@capaciti.com",
            "candidate3@capaciti.com",
            "candidate4@capaciti.com",
            "candidate5@capaciti.com");

    private final boolean relaxedRules;

    public DemoAccounts(@Value("${app.demo.relaxed-rules:true}") boolean relaxedRules) {
        this.relaxedRules = relaxedRules;
    }

    public boolean hasRelaxedRules(User user) {
        return relaxedRules && user != null && user.getEmail() != null
                && EMAILS.contains(user.getEmail().toLowerCase(Locale.ROOT));
    }
}
