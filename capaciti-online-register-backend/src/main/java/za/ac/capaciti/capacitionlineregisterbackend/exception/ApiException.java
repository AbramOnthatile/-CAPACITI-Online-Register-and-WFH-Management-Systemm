package za.ac.capaciti.capacitionlineregisterbackend.exception;

import org.springframework.http.HttpStatus;

// Base type for API errors with an HTTP status and error code.
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    protected ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}