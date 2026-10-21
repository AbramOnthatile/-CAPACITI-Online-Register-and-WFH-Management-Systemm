package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.dashboard;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ChampionDashboardDto(
        LocalDate date,
        Instant serverTime,
        long expectedCandidates,
        long clockedIn,
        long onTime,
        long late,
        long absent,
        long notYetClockedIn,
        long onSite,
        long wfh,
        long wfhApprovedToday,
        long pendingWfhRequests,
        long openTickets,
        long prolongedBlockers,
        long promptsSubmitted,
        long promptsMissed,
        long aiFlaggedToday,
        List<AttentionItemDto> needsAttention) {
}
