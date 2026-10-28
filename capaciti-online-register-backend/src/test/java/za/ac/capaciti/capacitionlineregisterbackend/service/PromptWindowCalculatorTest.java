package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Random;
import org.junit.jupiter.api.Test;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

class PromptWindowCalculatorTest {

    private final PromptWindowCalculator calculator = new PromptWindowCalculator();
    private final LocalDate weekday = LocalDate.of(2026, 10, 26);

    @Test
    void randomizesWithinEachStageTriggerWindowAndAppliesValidityDuration() {
        assertWindow(PromptStage.MORNING_KICKOFF, LocalTime.of(9, 0), LocalTime.of(9, 15), 15);
        assertWindow(PromptStage.MIDDAY_PULSE, LocalTime.of(13, 30), LocalTime.of(14, 0), 20);
        assertWindow(PromptStage.EOD_WRAP_UP, LocalTime.of(15, 30), LocalTime.of(16, 0), 20);
    }

    @Test
    void latestEndOfDayTriggerExpiresAtSixteenTwenty() {
        Instant latestTrigger = TimeUtil.toInstant(weekday, LocalTime.of(16, 0));
        Instant latestExpiry = latestTrigger.plus(Duration.ofMinutes(20));

        assertEquals(TimeUtil.toInstant(weekday, LocalTime.of(16, 20)), latestExpiry);
    }

    private void assertWindow(
            PromptStage stage,
            LocalTime triggerStart,
            LocalTime triggerEnd,
            int validMinutes) {
        PromptWindowCalculator.PromptWindow window = calculator.windowFor(stage, weekday, new Random(17));
        Instant earliest = TimeUtil.toInstant(weekday, triggerStart);
        Instant latest = TimeUtil.toInstant(weekday, triggerEnd);

        assertFalse(window.scheduledAt().isBefore(earliest));
        assertFalse(window.scheduledAt().isAfter(latest));
        assertEquals(Duration.ofMinutes(validMinutes), Duration.between(window.scheduledAt(), window.expiresAt()));
        assertTrue(window.expiresAt().isAfter(window.scheduledAt()));
    }
}
