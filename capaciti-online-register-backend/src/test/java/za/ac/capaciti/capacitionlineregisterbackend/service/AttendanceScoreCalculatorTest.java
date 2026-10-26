package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class AttendanceScoreCalculatorTest {

    private final AttendanceScoreCalculator calculator = new AttendanceScoreCalculator();

    @Test
    void calculatesSpecifiedOverallPercent() {
        assertEquals(73, calculator.overallPercent(5, 3, 5, 3, 3, 3));
    }

    @Test
    void allFiveScoresGiveOneHundredPercent() {
        assertEquals(100, calculator.overallPercent(5, 5, 5, 5, 5, 5));
    }

    @Test
    void allOneScoresGiveTwentyPercent() {
        assertEquals(20, calculator.overallPercent(1, 1, 1, 1, 1, 1));
    }

    @Test
    void roundsHalfUpAndClampsSuggestionBoundaries() {
        assertEquals(3, calculator.suggestAttendanceScore(1, 0, 0, 1));
        assertEquals(5, calculator.suggestAttendanceScore(8, 0, 2, 0));
        assertEquals(1, calculator.suggestAttendanceScore(0, 0, 0, 4));
    }

    @Test
    void suggestsNeutralScoreWhenNoAttendanceExists() {
        assertEquals(3, calculator.suggestAttendanceScore(0, 0, 0, 0));
    }

    @Test
    void requiresSixScoresForOverallPercent() {
        assertThrows(IllegalArgumentException.class, () -> calculator.overallPercent(4, 4, 4));
    }
}
