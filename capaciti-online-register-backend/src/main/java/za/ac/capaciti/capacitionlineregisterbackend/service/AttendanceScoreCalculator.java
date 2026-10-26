package za.ac.capaciti.capacitionlineregisterbackend.service;

import org.springframework.stereotype.Component;

@Component
public class AttendanceScoreCalculator {

    public int overallPercent(int... scores) {
        if (scores.length != 6) {
            throw new IllegalArgumentException("Exactly six scores are required");
        }
        int sum = 0;
        for (int score : scores) {
            sum += score;
        }
        return (int) Math.round(sum / 30.0 * 100);
    }

    public int suggestAttendanceScore(
            int onTime, int lateExcused, int lateUnexcused, int absent) {
        int total = onTime + lateExcused + lateUnexcused + absent;
        if (total == 0) {
            return 3;
        }

        double rate = (onTime + lateExcused + 0.5 * lateUnexcused) / total;
        return Math.max(1, Math.min(5, (int) Math.round(rate * 5)));
    }
}
