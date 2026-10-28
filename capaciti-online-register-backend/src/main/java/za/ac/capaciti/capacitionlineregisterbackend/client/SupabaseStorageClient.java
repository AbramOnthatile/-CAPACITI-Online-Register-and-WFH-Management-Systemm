package za.ac.capaciti.capacitionlineregisterbackend.client;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;

import tools.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.util.UriUtils;

@Component
public class SupabaseStorageClient {

    private static final Logger log = LoggerFactory.getLogger(SupabaseStorageClient.class);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(8);

    private final WebClient webClient;
    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final int signedUrlSeconds;

    public SupabaseStorageClient(
            WebClient.Builder webClientBuilder,
            @Value("${supabase.url:}") String supabaseUrl,
            @Value("${supabase.service-role-key:}") String serviceRoleKey,
            @Value("${supabase.signed-url-seconds:600}") int signedUrlSeconds) {
        this.webClient = webClientBuilder.build();
        this.supabaseUrl = supabaseUrl;
        this.serviceRoleKey = serviceRoleKey;
        this.signedUrlSeconds = signedUrlSeconds;
    }

    public Optional<String> createSignedUrl(String bucket, String path) {
        if (supabaseUrl.isBlank() || serviceRoleKey.isBlank()) {
            log.warn("Supabase storage is not configured");
            return Optional.empty();
        }

        try {
            URI requestUri = URI.create(supabaseUrl.replaceAll("/+$", "")
                    + "/storage/v1/object/sign/"
                    + UriUtils.encodePathSegment(bucket, StandardCharsets.UTF_8)
                    + "/"
                    + UriUtils.encodePath(path, StandardCharsets.UTF_8));

            JsonNode response = webClient.post()
                    .uri(requestUri)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .bodyValue(Map.of("expiresIn", signedUrlSeconds))
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block(REQUEST_TIMEOUT);

            JsonNode signedPathNode = response == null ? null : response.get("signedURL");
            if (signedPathNode == null || !signedPathNode.isString() || signedPathNode.asString().isBlank()) {
                throw new IllegalStateException("Supabase response does not contain a signed path");
            }

            return Optional.of(supabaseUrl.replaceAll("/+$", "")
                    + "/storage/v1"
                    + signedPathNode.asString());
        } catch (Exception exception) {
            String httpStatus = exception instanceof WebClientResponseException responseException
                    ? String.valueOf(responseException.getStatusCode().value())
                    : "none";
            log.warn("Supabase signed URL request failed: exception={}, HTTP status={}",
                    exception.getClass().getSimpleName(), httpStatus);
            return Optional.empty();
        }
    }
}
