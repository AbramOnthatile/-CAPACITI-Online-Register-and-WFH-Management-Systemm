package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import za.ac.capaciti.capacitionlineregisterbackend.domain.DailyPrompt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus;
import za.ac.capaciti.capacitionlineregisterbackend.repository.DailyPromptRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Service
public class PromptGeneratorService implements IPromptGeneratorService {

    private final DailyPromptRepository dailyPromptRepository;
    private final PromptWindowCalculator promptWindowCalculator;
    private final UserRepository userRepository;

    public PromptGeneratorService(
            DailyPromptRepository dailyPromptRepository,
            PromptWindowCalculator promptWindowCalculator,
            UserRepository userRepository) {
        this.dailyPromptRepository = dailyPromptRepository;
        this.promptWindowCalculator = promptWindowCalculator;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public int generateForDate(LocalDate date) {
        if (!TimeUtil.isWeekday(date)) {
            return 0;
        }

        // TODO Member 4: query approved WFH requests covering date, then resolve their users with UserRepository.
        return 0;
    }

    @Override
    @Transactional
    public int generateForUser(User user, LocalDate date) {
        int created = 0;
        for (PromptStage stage : PromptStage.values()) {
            if (dailyPromptRepository.existsByUserAndPromptDateAndStage(user, date, stage)) {
                continue;
            }

            PromptWindowCalculator.PromptWindow window = promptWindowCalculator.windowFor(stage, date);
            if (date.equals(TimeUtil.today()) && !window.expiresAt().isAfter(TimeUtil.now().toInstant())) {
                continue;
            }

            // TODO Member 2: set attendance from AttendanceRecordRepository.findByUserAndAttendanceDate(user, date).
            dailyPromptRepository.save(DailyPrompt.builder()
                    .user(user)
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
}