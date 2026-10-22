package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import za.ac.capaciti.capacitionlineregisterbackend.client.SupabaseStorageClient;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.storage.SignedUrlResponse;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ResourceNotFoundException;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class StorageServiceTest {

    private static final String EMAIL = "user@example.com";
    private static final String BUCKET = "wfh-proof";

    @Mock
    private SupabaseStorageClient supabaseStorageClient;

    @Mock
    private UserRepository userRepository;

    private StorageService service;

    @BeforeEach
    void setUp() {
        service = new StorageService(supabaseStorageClient, userRepository, 600);
    }

    @Test
    void unknownBucketThrowsBadRequest() {
        assertThrows(BadRequestException.class, () -> service.signedUrl(EMAIL, "unknown", "file.png"));
        verify(userRepository, never()).findByEmailIgnoreCase(EMAIL);
    }

    @Test
    void pathContainingDoubleDotThrowsBadRequest() {
        assertThrows(BadRequestException.class,
                () -> service.signedUrl(EMAIL, BUCKET, "folder/../file.png"));
        verify(userRepository, never()).findByEmailIgnoreCase(EMAIL);
    }

    @Test
    void candidateCannotSignAnotherUsersPath() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user(userId, "CANDIDATE")));

        assertThrows(ResourceNotFoundException.class,
                () -> service.signedUrl(EMAIL, BUCKET, UUID.randomUUID() + "/file.png"));
        verify(supabaseStorageClient, never()).createSignedUrl(BUCKET, userId + "/file.png");
    }

    @Test
    void candidateCanSignOwnPath() {
        UUID userId = UUID.randomUUID();
        String path = userId + "/file.png";
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user(userId, "CANDIDATE")));
        when(supabaseStorageClient.createSignedUrl(BUCKET, path))
                .thenReturn(Optional.of("https://storage.example/signed-file"));

        SignedUrlResponse response = service.signedUrl(EMAIL, BUCKET, path);

        assertEquals(new SignedUrlResponse("https://storage.example/signed-file", 600), response);
        verify(supabaseStorageClient).createSignedUrl(BUCKET, path);
    }

    @Test
    void championCanSignAnyValidPath() {
        String path = "another-user/file.png";
        when(userRepository.findByEmailIgnoreCase(EMAIL))
                .thenReturn(Optional.of(user(UUID.randomUUID(), "TECH_CHAMP")));
        when(supabaseStorageClient.createSignedUrl(BUCKET, path))
                .thenReturn(Optional.of("https://storage.example/signed-file"));

        SignedUrlResponse response = service.signedUrl(EMAIL, BUCKET, path);

        assertEquals("https://storage.example/signed-file", response.url());
        verify(supabaseStorageClient).createSignedUrl(BUCKET, path);
    }

    @Test
    void emptyClientResultThrowsBadRequest() {
        UUID userId = UUID.randomUUID();
        String path = userId + "/file.png";
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user(userId, "CANDIDATE")));
        when(supabaseStorageClient.createSignedUrl(BUCKET, path)).thenReturn(Optional.empty());

        assertThrows(BadRequestException.class, () -> service.signedUrl(EMAIL, BUCKET, path));
    }

    private User user(UUID id, String role) {
        User user = new User();
        user.setId(id);
        user.setEmail(EMAIL);
        user.setRole(role);
        return user;
    }
}
