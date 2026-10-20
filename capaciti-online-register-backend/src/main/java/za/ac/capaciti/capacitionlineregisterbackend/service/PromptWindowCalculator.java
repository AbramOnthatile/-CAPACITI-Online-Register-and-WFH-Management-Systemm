package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Component;

import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Component
public class PromptWindowCalculator {

    private static final LocalTime MORNING_START = LocalTime.of(9, 0);
    private static final LocalTime MORNING_END = LocalTime.of(9, 15);
    private static final int MORNING_VALID_MINUTES = 15;

    private static final LocalTime MIDDAY_START = LocalTime.of(13, 30);
    private static final LocalTime MIDDAY_END = LocalTime.of(14, 0);
    private static final int MIDDAY_VALID_MINUTES = 20;

    private static final LocalTime EOD_START = LocalTime.of(15, 30);
    private static final LocalTime EOD_END = LocalTime.of(16, 0);
    private static final int EOD_VALID_MINUTES = 20;

    public record PromptWindow(Instant scheduledAt, Instant expiresAt) {
    }

    public PromptWindow windowFor(PromptStage stage, LocalDate date, Random random) {
        LocalTime start;
        LocalTime end;
        int validMinutes;

        switch (stage) {
            case MORNING_KICKOFF -> {
                start = MORNING_START;
                end = MORNING_END;
                validMinutes = MORNING_VALID_MINUTES;
            }
            case MIDDAY_PULSE -> {
                start = MIDDAY_START;
                end = MIDDAY_END;
                validMinutes = MIDDAY_VALID_MINUTES;
            }
            case EOD_WRAP_UP -> {
                start = EOD_START;
                end = EOD_END;
                validMinutes = EOD_VALID_MINUTES;
            }
            default -> throw new IllegalArgumentException("Unsupported prompt stage: " + stage);
        }

        Instant startInstant = TimeUtil.toInstant(date, start);
        Instant endInstant = TimeUtil.toInstant(date, end);
        long windowSeconds = Duration.between(startInstant, endInstant).getSeconds();
        Instant scheduledAt = startInstant.plusSeconds(random.nextLong(windowSeconds + 1));
        return new PromptWindow(scheduledAt, scheduledAt.plusSeconds(validMinutes * 60L));
    }

    public PromptWindow windowFor(PromptStage stage, LocalDate date) {
        return windowFor(stage, date, ThreadLocalRandom.current());
    }
}