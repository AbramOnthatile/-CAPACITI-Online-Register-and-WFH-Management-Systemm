package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.dashboard;

import java.time.Instant;
import java.util.List;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.AttendanceDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.PromptDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhRequestDto;

public record CandidateDashboardDto(
        Instant serverTime,
        AttendanceDto today,
        List<AttendanceDto> recentAttendance,
        WfhRequestDto currentWfh,
        List<WfhRequestDto> recentWfhRequests,
        List<PromptDto> promptsToday,
        long openTickets,
        long prolongedTickets) {
}
