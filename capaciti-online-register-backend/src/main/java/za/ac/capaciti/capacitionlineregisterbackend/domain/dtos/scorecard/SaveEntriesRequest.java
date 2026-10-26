package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard;

import jakarta.validation.Valid;
import java.util.List;

public record SaveEntriesRequest(
        String groupFeedback,
        @Valid List<EntryRequest> entries) {
}
