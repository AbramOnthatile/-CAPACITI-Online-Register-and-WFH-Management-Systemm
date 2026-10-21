package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record WfhSummaryDto(
        LocalDate from,
        LocalDate to,
        Map<String, Long> requestCounts,
        long wfhAttendanceDays,
        List<PromptStageStatDto> promptCompletion,
        long ticketsOpened,
        long ticketsResolved,
        long prolongedBlockers) {
}
