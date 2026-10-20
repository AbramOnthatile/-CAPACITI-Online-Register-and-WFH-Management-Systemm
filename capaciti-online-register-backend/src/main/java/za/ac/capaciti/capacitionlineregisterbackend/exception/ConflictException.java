package za.ac.capaciti.capacitionlineregisterbackend.exception;

import org.springframework.http.HttpStatus;

// Indicates that a request conflicts with existing state.
public class ConflictException extends ApiException {

    public ConflictException(String code, String message) {
        super(HttpStatus.CONFLICT, code, message);
    }
}
