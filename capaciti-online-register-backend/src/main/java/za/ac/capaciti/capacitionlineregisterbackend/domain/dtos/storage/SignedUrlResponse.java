package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.storage;

public record SignedUrlResponse(String url, int expiresInSeconds) {
}
