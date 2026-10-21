package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.report;

import java.time.LocalDate;

public record DailyTrendDto(
        LocalDate date,
        long present,
        long late,
        long absent) {
}
