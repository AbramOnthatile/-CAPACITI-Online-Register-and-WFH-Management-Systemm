package za.ac.capaciti.capacitionlineregisterbackend.client;

import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Component
public class TeamsWebhookClient {

    private static final Logger log = LoggerFactory.getLogger(TeamsWebhookClient.class);
    private static final String ADAPTIVE_CARD_CONTENT_TYPE = "application/vnd.microsoft.card.adaptive";
    private static final String ADAPTIVE_CARD_SCHEMA = "http://adaptivecards.io/schemas/adaptive-card.json";

    private final WebClient webClient;
    private final String webhookUrl;
    private final long timeoutSeconds;

    public TeamsWebhookClient(
            WebClient.Builder webClientBuilder,
            @Value("${teams.webhook-url:}") String webhookUrl,
            @Value("${teams.timeout-seconds:5}") long timeoutSeconds) {
        this.webClient = webClientBuilder.build();
        this.webhookUrl = webhookUrl;
        this.timeoutSeconds = timeoutSeconds;
    }

    public boolean sendAlert(String title, String message, Map<String, String> facts) {
        if (webhookUrl.isBlank()) {
            log.info("Teams webhook not configured, alert skipped: {}", title);
            return false;
        }

        try {
            var response = webClient.post()
                    .uri(webhookUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(buildPayload(title, message, facts))
                    .retrieve()
                    .toBodilessEntity()
                    .block(Duration.ofSeconds(timeoutSeconds));

            if (response != null && response.getStatusCode().is2xxSuccessful()) {
                return true;
            }

            log.warn("Teams alert failed: exception={}, HTTP status={}",
                    IllegalStateException.class.getSimpleName(), response == null ? "none" : response.getStatusCode().value());
            return false;
        } catch (Exception exception) {
            String httpStatus = exception instanceof WebClientResponseException responseException
                    ? Integer.toString(responseException.getStatusCode().value())
                    : "none";
            log.warn("Teams alert failed: exception={}, HTTP status={}",
                    exception.getClass().getSimpleName(), httpStatus);
            return false;
        }
    }

    private Map<String, Object> buildPayload(String title, String message, Map<String, String> facts) {
        List<Map<String, Object>> body = new ArrayList<>();
        body.add(Map.of(
                "type", "TextBlock",
                "text", title,
                "weight", "Bolder"));
        body.add(Map.of(
                "type", "TextBlock",
                "text", message,
                "wrap", true));

        if (facts != null && !facts.isEmpty()) {
            List<Map<String, String>> cardFacts = facts.entrySet().stream()
                    .map(entry -> Map.of("title", entry.getKey(), "value", entry.getValue()))
                    .toList();
            body.add(Map.of(
                    "type", "FactSet",
                    "facts", cardFacts));
        }

        Map<String, Object> card = Map.of(
                "$schema", ADAPTIVE_CARD_SCHEMA,
                "type", "AdaptiveCard",
                "version", "1.2",
                "body", body);

        Map<String, Object> attachment = new LinkedHashMap<>();
        attachment.put("contentType", ADAPTIVE_CARD_CONTENT_TYPE);
        attachment.put("contentUrl", null);
        attachment.put("content", card);

        return Map.of(
                "type", "message",
                "attachments", List.of(attachment));
    }
}
