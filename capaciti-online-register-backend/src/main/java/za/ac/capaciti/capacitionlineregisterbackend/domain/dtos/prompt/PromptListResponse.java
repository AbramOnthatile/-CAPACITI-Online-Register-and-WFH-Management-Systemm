package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt;

import java.time.Instant;
import java.util.List;

public record PromptListResponse(Instant serverTime, List<PromptDto> prompts) {
}