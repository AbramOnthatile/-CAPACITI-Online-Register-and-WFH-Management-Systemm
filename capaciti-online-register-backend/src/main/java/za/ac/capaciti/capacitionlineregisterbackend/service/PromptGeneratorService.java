package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.Instant;
import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import za.ac.capaciti.capacitionlineregisterbackend.domain.AttendanceRecord;
import za.ac.capaciti.capacitionlineregisterbackend.domain.DailyPrompt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AttendanceRecordRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.DailyPromptRepository;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

// Every candidate gets the day's three check-ins when they clock in.
@Service
public class PromptGeneratorService implements IPromptGeneratorService {

    private final DailyPromptRepository dailyPromptRepository;
    private final PromptWindowCalculator promptWindowCalculator;
    private final AttendanceRecordRepository attendanceRecordRepository;

    public PromptGeneratorService(
            DailyPromptRepository dailyPromptRepository,
            PromptWindowCalculator promptWindowCalculator,
            AttendanceRecordRepository attendanceRecordRepository) {
        this.dailyPromptRepository = dailyPromptRepository;
        this.promptWindowCalculator = promptWindowCalculator;
        this.attendanceRecordRepository = attendanceRecordRepository;
    }

    @Override
    @Transactional
    public int generateOnClockIn(AttendanceRecord attendance) {
        User user = attendance.getUser();
        if (!isCandidate(user) || attendance.getClockInAt() == null) {
            return 0;
        }

        LocalDate date = attendance.getAttendanceDate();
        Instant now = TimeUtil.now().toInstant();
        int created = 0;
        for (PromptStage stage : PromptStage.values()) {
            if (dailyPromptRepository.existsByUserAndPromptDateAndStage(user, date, stage)) {
                continue;
            }
            PromptWindowCalculator.PromptWindow window =
                    promptWindowCalculator.windowFor(stage, date, attendance.getClockInAt());
            dailyPromptRepository.save(DailyPrompt.builder()
                    .user(user)
                    .attendance(attendance)
                    .promptDate(date)
                    .stage(stage)
                    .scheduledAt(window.scheduledAt())
                    .expiresAt(window.expiresAt())
                    .status(window.scheduledAt().isAfter(now) ? PromptStatus.SCHEDULED : PromptStatus.ACTIVE)
                    .build());
            created++;
        }
        return created;
    }

    // Startup catch-up for candidates who clocked in before their check-ins existed.
    @Override
    @Transactional
    public int generateForClockedIn(LocalDate date) {
        int created = 0;
        for (AttendanceRecord attendance
                : attendanceRecordRepository.findByAttendanceDateAndClockInAtIsNotNullAndClockOutAtIsNull(date)) {
            created += generateOnClockIn(attendance);
        }
        return created;
    }

    private boolean isCandidate(User user) {
        return user != null && user.isActive() && "CANDIDATE".equals(user.getRole());
    }
}
