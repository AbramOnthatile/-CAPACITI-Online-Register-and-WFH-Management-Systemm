package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report;

import java.time.LocalDate;

public record OverviewReportDto(
        LocalDate from,
        LocalDate to,
        long totalCandidates,
        double attendanceRatePercent,
        double onTimeRatePercent,
        long lateCount,
        long absentCount,
        long wfhDays,
        long pendingWfh,
        long approvedWfh,
        long rejectedWfh,
        long openTickets,
        long prolongedBlockers,
        long aiFlaggedSubmissions) {
}
