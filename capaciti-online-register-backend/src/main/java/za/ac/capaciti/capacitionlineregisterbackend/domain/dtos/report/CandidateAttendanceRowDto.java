package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report;

import java.util.UUID;

public record CandidateAttendanceRowDto(
        UUID userId,
        String userName,
        long daysPresent,
        long onTime,
        long late,
        long absent,
        long partialDay,
        long lateClockout) {
}
