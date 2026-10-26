package za.ac.capaciti.capacitionlineregisterbackend.exception;

import java.util.Map;
import org.springframework.http.HttpStatus;

// Base type for API errors with an HTTP status and error code.
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final Map<String, String> fieldErrors;

    protected ApiException(HttpStatus status, String code, String message) {
        this(status, code, message, Map.of());
    }

    protected ApiException(
            HttpStatus status, String code, String message, Map<String, String> fieldErrors) {
        super(message);
        this.status = status;
        this.code = code;
        this.fieldErrors = Map.copyOf(fieldErrors);
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}