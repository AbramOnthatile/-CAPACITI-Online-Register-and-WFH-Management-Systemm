package za.ac.capaciti.capacitionlineregisterbackend.exception;

import java.util.Map;

// Standard response body for API errors.
public record ApiError(String code, String message, Map<String, String> fieldErrors) {

    public static ApiError of(String code, String message) {
        return new ApiError(code, message, Map.of());
    }
}