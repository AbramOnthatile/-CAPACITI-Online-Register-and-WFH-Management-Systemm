package za.ac.capaciti.capacitionlineregisterbackend.exception;

import java.util.Map;
import org.springframework.http.HttpStatus;

// Indicates that a request is invalid.
public class BadRequestException extends ApiException {

    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, "BAD_REQUEST", message);
    }

    public BadRequestException(String code, String message, Map<String, String> fieldErrors) {
        super(HttpStatus.BAD_REQUEST, code, message, fieldErrors);
    }
}
