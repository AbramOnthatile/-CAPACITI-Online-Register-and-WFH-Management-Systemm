package za.ac.capaciti.capacitionlineregisterbackend.exception;

import org.springframework.http.HttpStatus;

// Indicates that the requested resource does not exist.
public class ResourceNotFoundException extends ApiException {

    public ResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, "NOT_FOUND", message);
    }
}
