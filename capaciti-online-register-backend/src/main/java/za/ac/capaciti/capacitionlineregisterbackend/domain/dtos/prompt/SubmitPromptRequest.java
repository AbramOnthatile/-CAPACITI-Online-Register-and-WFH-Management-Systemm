package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

// Morning: the day's tasks (titles only), plus stand-up, power and ISP when working from home.
// Midday and end of day: every task with its status, any new tasks, and notes.
public record SubmitPromptRequest(
        @Size(max = 10) List<@Valid TaskEntry> tasks,
        Boolean standupConfirmed,
        String powerStatus,
        String ispStatus,
        @Size(max = 1000) String blockerNote,
        @Size(max = 1000) String note) {

    public record TaskEntry(@Size(max = 500) String title, String status) {
    }
}
