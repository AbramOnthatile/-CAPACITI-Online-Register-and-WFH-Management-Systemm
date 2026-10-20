package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt;

import java.util.List;

import jakarta.validation.constraints.Size;

public record SubmitPromptRequest(
        @Size(max = 3) List<@Size(max = 500) String> deliverables,
        Boolean standupConfirmed,
        String powerStatus,
        String ispStatus,
        String progressStatus,
        @Size(max = 1000) String blockerNote,
        @Size(max = 500) String workLink) {
}