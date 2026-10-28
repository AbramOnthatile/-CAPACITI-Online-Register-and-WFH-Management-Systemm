package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

import org.springframework.stereotype.Component;

import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

// Fixed, predictable windows: the morning and end-of-day forms open at clock-in,
// the midday check opens at 13:30 (or at clock-in when that is later), and all
// three stay open until the end of the day.
@Component
public class PromptWindowCalculator {

    static final LocalTime MIDDAY_START = LocalTime.of(13, 30);
    static final LocalTime END_OF_DAY = LocalTime.of(23, 59);

    public record PromptWindow(Instant scheduledAt, Instant expiresAt) {
    }

    public PromptWindow windowFor(PromptStage stage, LocalDate date, Instant clockIn) {
        Instant expiresAt = TimeUtil.toInstant(date, END_OF_DAY);
        Instant scheduledAt = switch (stage) {
            case MORNING_KICKOFF, EOD_WRAP_UP -> clockIn;
            case MIDDAY_PULSE -> later(TimeUtil.toInstant(date, MIDDAY_START), clockIn);
        };
        return new PromptWindow(scheduledAt, expiresAt);
    }

    private static Instant later(Instant first, Instant second) {
        return first.isAfter(second) ? first : second;
    }
}
