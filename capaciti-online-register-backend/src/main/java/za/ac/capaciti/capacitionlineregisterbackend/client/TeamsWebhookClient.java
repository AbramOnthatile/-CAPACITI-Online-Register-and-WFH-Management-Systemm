package za.ac.capaciti.capacitionlineregisterbackend.client;

import java.time.Duration;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class TeamsWebhookClient {

    private static final Logger log = LoggerFactory.getLogger(TeamsWebhookClient.class);
    private static final String ADAPTIVE_CARD_CONTENT_TYPE = "application/vnd.microsoft.card.adaptive";
    private static final String ADAPTIVE_CARD_SCHEMA = "http://adaptivecards.io/schemas/adaptive-card.json";
    private final HttpClient httpClient;
    private final String webhookUrl;
    private final long timeoutSeconds;

    public TeamsWebhookClient(
            @Value("${teams.webhook-url:}") String webhookUrl,
            @Value("${teams.timeout-seconds:5}") long timeoutSeconds) {
            this.httpClient = HttpClient.newHttpClient();
        this.webhookUrl = webhookUrl;
        this.timeoutSeconds = timeoutSeconds;
    }

    public boolean sendAlert(String title, String message, Map<String, String> facts) {
        if (webhookUrl.isBlank()) {
            log.info("Teams webhook not configured, alert skipped: {}", title);
            return false;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(webhookUrl))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(toJson(buildPayload(title, message, facts))))
                    .build();
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return true;
            }

            log.warn("Teams alert failed: exception={}, HTTP status={}",
                    IllegalStateException.class.getSimpleName(), response.statusCode());
            return false;
        } catch (Exception exception) {
            if (exception instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("Teams alert failed: exception={}, HTTP status={}",
                    exception.getClass().getSimpleName(), "none");
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

    private String toJson(Object value) {
        if (value == null) {
            return "null";
        }
        if (value instanceof String) {
            return quoteJsonString((String) value);
        }
        if (value instanceof Map<?, ?>) {
            List<String> entries = new ArrayList<>();
            ((Map<?, ?>) value).forEach((key, entryValue) -> entries.add(
                    quoteJsonString(String.valueOf(key)) + ":" + toJson(entryValue)));
            return "{" + String.join(",", entries) + "}";
        }
        if (value instanceof Iterable<?>) {
            List<String> entries = new ArrayList<>();
            for (Object entry : (Iterable<?>) value) {
                entries.add(toJson(entry));
            }
            return "[" + String.join(",", entries) + "]";
        }
        if (value instanceof Number || value instanceof Boolean) {
            return value.toString();
        }
        return quoteJsonString(value.toString());
    }

    private String quoteJsonString(String value) {
        StringBuilder result = new StringBuilder("\"");
        for (int i = 0; i < value.length(); i++) {
            char character = value.charAt(i);
            switch (character) {
                case '"': result.append("\\\""); break;
                case '\\': result.append("\\\\"); break;
                case '\b': result.append("\\b"); break;
                case '\f': result.append("\\f"); break;
                case '\n': result.append("\\n"); break;
                case '\r': result.append("\\r"); break;
                case '\t': result.append("\\t"); break;
                default:
                    if (character < 0x20) {
                        result.append(String.format("\\u%04x", (int) character));
                    } else {
                        result.append(character);
                    }
            }
        }
        return result.append('"').toString();
    }
}
