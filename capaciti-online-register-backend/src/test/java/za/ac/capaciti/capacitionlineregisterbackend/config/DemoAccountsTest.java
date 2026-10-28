package za.ac.capaciti.capacitionlineregisterbackend.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import za.ac.capaciti.capacitionlineregisterbackend.domain.User;

class DemoAccountsTest {

    private User user(String email) {
        User user = new User();
        user.setEmail(email);
        return user;
    }

    @Test
    void onlySeededAccountsGetRelaxedRules() {
        DemoAccounts demoAccounts = new DemoAccounts(true);

        assertTrue(demoAccounts.hasRelaxedRules(user("Candidate3@CAPACITI.com")));
        assertTrue(demoAccounts.hasRelaxedRules(user("admin@capaciti.com")));
        assertFalse(demoAccounts.hasRelaxedRules(user("real.candidate@capaciti.com")));
    }

    @Test
    void theSettingTurnsRelaxedRulesOff() {
        assertFalse(new DemoAccounts(false).hasRelaxedRules(user("candidate1@capaciti.com")));
    }
}
