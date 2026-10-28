package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.Test;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

class PromptWindowCalculatorTest {

    private final PromptWindowCalculator calculator = new PromptWindowCalculator();
    private final LocalDate weekday = LocalDate.of(2026, 10, 26);
    private final Instant endOfDay = TimeUtil.toInstant(weekday, LocalTime.of(23, 59));

    @Test
    void morningAndEndOfDayOpenAtClockIn() {
        Instant clockIn = TimeUtil.toInstant(weekday, LocalTime.of(8, 52));

        assertWindow(PromptStage.MORNING_KICKOFF, clockIn, clockIn);
        assertWindow(PromptStage.EOD_WRAP_UP, clockIn, clockIn);
    }

    @Test
    void middayOpensAtHalfPastOneEveryTime() {
        Instant clockIn = TimeUtil.toInstant(weekday, LocalTime.of(8, 52));

        assertWindow(PromptStage.MIDDAY_PULSE, clockIn, TimeUtil.toInstant(weekday, LocalTime.of(13, 30)));
        assertWindow(PromptStage.MIDDAY_PULSE, clockIn, TimeUtil.toInstant(weekday, LocalTime.of(13, 30)));
    }

    @Test
    void middayOpensAtClockInWhenTheCandidateArrivesAfterHalfPastOne() {
        Instant clockIn = TimeUtil.toInstant(weekday, LocalTime.of(14, 10));

        assertWindow(PromptStage.MIDDAY_PULSE, clockIn, clockIn);
    }

    private void assertWindow(PromptStage stage, Instant clockIn, Instant expectedStart) {
        PromptWindowCalculator.PromptWindow window = calculator.windowFor(stage, weekday, clockIn);

        assertEquals(expectedStart, window.scheduledAt());
        assertEquals(endOfDay, window.expiresAt());
    }
}
