package za.ac.capaciti.capacitionlineregisterbackend.exception;

import org.springframework.http.HttpStatus;

// Indicates that a business rule forbids the request for this user.
public class ForbiddenException extends ApiException {

    public ForbiddenException(String code, String message) {
        super(HttpStatus.FORBIDDEN, code, message);
    }
}
