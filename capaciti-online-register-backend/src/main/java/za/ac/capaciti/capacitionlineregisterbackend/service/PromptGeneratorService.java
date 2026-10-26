package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import za.ac.capaciti.capacitionlineregisterbackend.domain.DailyPrompt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.WfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.AttendanceRecord;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AttendanceRecordRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.DailyPromptRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.WfhRequestRepository;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Service
public class PromptGeneratorService implements IPromptGeneratorService {

    private final DailyPromptRepository dailyPromptRepository;
    private final PromptWindowCalculator promptWindowCalculator;
    private final WfhRequestRepository wfhRequestRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

    public PromptGeneratorService(
            DailyPromptRepository dailyPromptRepository,
            PromptWindowCalculator promptWindowCalculator,
            WfhRequestRepository wfhRequestRepository,
            AttendanceRecordRepository attendanceRecordRepository) {
        this.dailyPromptRepository = dailyPromptRepository;
        this.promptWindowCalculator = promptWindowCalculator;
        this.wfhRequestRepository = wfhRequestRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
    }

    @Override
    @Transactional
    public int generateForDate(LocalDate date) {
        if (!TimeUtil.isWeekday(date)) {
            return 0;
        }

        int created = 0;
        for (WfhRequest request : wfhRequestRepository.findApprovedCovering(date)) {
            User user = request.getUser();
            if (isCandidate(user)) {
                created += generateForEligibleUser(user, date);
            }
        }
        return created;
    }

    @Override
    @Transactional
    public int generateForUser(User user, LocalDate date) {
        if (!TimeUtil.isWeekday(date) || !isCandidate(user)
                || wfhRequestRepository.findApprovedCoveringForUser(user, date).isEmpty()) {
            return 0;
        }
        return generateForEligibleUser(user, date);
    }

    private int generateForEligibleUser(User user, LocalDate date) {
        int created = 0;
        for (PromptStage stage : PromptStage.values()) {
            if (dailyPromptRepository.existsByUserAndPromptDateAndStage(user, date, stage)) {
                continue;
            }

            PromptWindowCalculator.PromptWindow window = promptWindowCalculator.windowFor(stage, date);
            if (date.equals(TimeUtil.today()) && !window.expiresAt().isAfter(TimeUtil.now().toInstant())) {
                continue;
            }

            AttendanceRecord attendance = attendanceRecordRepository
                    .findByUserAndAttendanceDate(user, date)
                    .orElse(null);
            dailyPromptRepository.save(DailyPrompt.builder()
                    .user(user)
                    .attendance(attendance)
                    .promptDate(date)
                    .stage(stage)
                    .scheduledAt(window.scheduledAt())
                    .expiresAt(window.expiresAt())
                    .status(PromptStatus.SCHEDULED)
                    .build());
            created++;
        }
        return created;
    }

    private boolean isCandidate(User user) {
        return user != null && user.isActive() && "CANDIDATE".equals(user.getRole());
    }
}