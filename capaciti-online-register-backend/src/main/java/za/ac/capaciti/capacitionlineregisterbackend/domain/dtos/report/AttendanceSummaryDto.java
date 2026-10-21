package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record AttendanceSummaryDto(
        LocalDate from,
        LocalDate to,
        Map<String, Long> arrivalCounts,
        Map<String, Long> departureCounts,
        Map<String, Long> workModeCounts,
        List<DailyTrendDto> trend,
        List<CandidateAttendanceRowDto> candidates) {
}
