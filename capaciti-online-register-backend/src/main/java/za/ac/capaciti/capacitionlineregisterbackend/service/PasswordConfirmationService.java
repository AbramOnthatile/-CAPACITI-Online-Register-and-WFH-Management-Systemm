package za.ac.capaciti.capacitionlineregisterbackend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ForbiddenException;
import za.ac.capaciti.capacitionlineregisterbackend.util.Helper;

// Critical changes (the campus location, clock-in radius and trusted networks) need the
// signed-in user's password again, sent in the X-Confirm-Password header. A wrong password
// is a 403, not a 401, so it never signs the user out.
@Service
public class PasswordConfirmationService {

    public static final String HEADER = "X-Confirm-Password";

    private final PasswordEncoder passwordEncoder;

    public PasswordConfirmationService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public void confirm(User actor, String password) {
        if (Helper.isNullOrEmpty(password)) {
            throw new ForbiddenException("PASSWORD_CONFIRMATION_REQUIRED", "Enter your password to confirm this change.");
        }
        if (actor == null || actor.getPasswordHash() == null || !passwordEncoder.matches(password, actor.getPasswordHash())) {
            throw new ForbiddenException("PASSWORD_CONFIRMATION_FAILED", "That password is incorrect. The change was not saved.");
        }
    }
}
