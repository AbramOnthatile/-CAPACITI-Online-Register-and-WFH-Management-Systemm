package za.ac.capaciti.capacitionlineregisterbackend.exception;

import org.springframework.http.HttpStatus;

// Represents authentication failure without revealing its cause.
public class AuthenticationFailedException extends ApiException {

    public AuthenticationFailedException() {
        super(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_FAILED", "Invalid email or password");
    }
}