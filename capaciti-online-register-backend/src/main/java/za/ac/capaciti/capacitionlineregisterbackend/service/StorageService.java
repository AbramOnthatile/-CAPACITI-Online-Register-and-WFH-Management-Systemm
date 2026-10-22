package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import za.ac.capaciti.capacitionlineregisterbackend.client.SupabaseStorageClient;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.storage.SignedUrlResponse;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ResourceNotFoundException;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;

@Service
public class StorageService implements IStorageService {

    private static final String FILE_NOT_FOUND = "File not found";

    private final SupabaseStorageClient supabaseStorageClient;
    private final UserRepository userRepository;
    private final int signedUrlSeconds;

    public StorageService(
            SupabaseStorageClient supabaseStorageClient,
            UserRepository userRepository,
            @Value("${supabase.signed-url-seconds:600}") int signedUrlSeconds) {
        this.supabaseStorageClient = supabaseStorageClient;
        this.userRepository = userRepository;
        this.signedUrlSeconds = signedUrlSeconds;
    }

    @Override
    public SignedUrlResponse signedUrl(String email, String bucket, String path) {
        if (!"speed-test-screenshots".equals(bucket) && !"wfh-proof".equals(bucket)) {
            throw new BadRequestException("Unknown bucket");
        }
        if (path == null || path.isBlank() || path.contains("..") || path.startsWith("/")) {
            throw new BadRequestException("Invalid file path");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String role = user.getRole();
        if ("CANDIDATE".equals(role)) {
            if (user.getId() == null || !path.startsWith(user.getId() + "/")) {
                throw new ResourceNotFoundException(FILE_NOT_FOUND);
            }
        } else if (!"TECH_CHAMP".equals(role) && !"ADMIN".equals(role)) {
            throw new ResourceNotFoundException(FILE_NOT_FOUND);
        }

        Optional<String> signedUrl = supabaseStorageClient.createSignedUrl(bucket, path);
        if (signedUrl.isEmpty()) {
            throw new BadRequestException("File links are temporarily unavailable");
        }

        return new SignedUrlResponse(signedUrl.get(), signedUrlSeconds);
    }
}
