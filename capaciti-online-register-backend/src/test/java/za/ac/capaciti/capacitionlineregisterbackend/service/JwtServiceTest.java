package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

class JwtServiceTest {

    private static final String SECRET = Base64.getEncoder()
            .encodeToString("01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8));
    private static final String DIFFERENT_SECRET = Base64.getEncoder()
            .encodeToString("abcdefghijklmnopqrstuvwxyz123456".getBytes(StandardCharsets.UTF_8));

    @Test
    void generatedTokenReturnsSameEmail() {
        JwtService service = createService(SECRET, 15);
        UserDetails userDetails = user("candidate@example.com");

        String token = service.generateToken(userDetails);

        assertEquals(userDetails.getUsername(), service.extractEmail(token));
    }

    @Test
    void tokenIsInvalidForDifferentUsername() {
        JwtService service = createService(SECRET, 15);
        String token = service.generateToken(user("candidate@example.com"));

        assertFalse(service.isTokenValid(token, user("another@example.com")));
    }

    @Test
    void tokenIsInvalidForDisabledUser() {
        JwtService service = createService(SECRET, 15);
        String token = service.generateToken(user("candidate@example.com"));
        UserDetails disabledUser = User.withUsername("candidate@example.com")
                .password("password")
                .authorities("ROLE_USER")
                .disabled(true)
                .build();

        assertFalse(service.isTokenValid(token, disabledUser));
    }

    @Test
    void tokenSignedWithDifferentSecretThrowsOnExtractEmail() {
        JwtService signer = createService(SECRET, 15);
        JwtService verifier = createService(DIFFERENT_SECRET, 15);
        String token = signer.generateToken(user("candidate@example.com"));

        assertThrows(JwtException.class, () -> verifier.extractEmail(token));
    }

    @Test
    void expiredTokenThrowsOnExtractEmail() {
        JwtService service = createService(SECRET, 15);
        // A negative lifetime is rejected at startup, so backdate it after initialisation.
        ReflectionTestUtils.setField(service, "expirationMinutes", -1L);
        String token = service.generateToken(user("candidate@example.com"));

        assertThrows(JwtException.class, () -> service.extractEmail(token));
    }

    @Test
    void zeroExpirationThrowsIllegalStateException() {
        assertThrows(IllegalStateException.class, () -> createService(SECRET, 0));
    }

    @Test
    void blankSecretThrowsIllegalStateException() {
        assertThrows(IllegalStateException.class, () -> createService(" ", 15));
    }

    @Test
    void shortSecretThrowsIllegalStateException() {
        String shortSecret = Base64.getEncoder().encodeToString("short-secret".getBytes(StandardCharsets.UTF_8));

        assertThrows(IllegalStateException.class, () -> createService(shortSecret, 15));
    }

    private JwtService createService(String secret, long expirationMinutes) {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "secret", secret);
        ReflectionTestUtils.setField(service, "expirationMinutes", expirationMinutes);
        ReflectionTestUtils.invokeMethod(service, "initializeKey");
        return service;
    }

    private UserDetails user(String username) {
        return User.withUsername(username)
                .password("password")
                .authorities("ROLE_USER")
                .build();
    }
}