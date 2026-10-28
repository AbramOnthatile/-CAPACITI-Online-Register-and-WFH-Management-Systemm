package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import za.ac.capaciti.capacitionlineregisterbackend.domain.DailyPrompt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.WfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AttendanceRecordRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.DailyPromptRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.WfhRequestRepository;

@ExtendWith(MockitoExtension.class)
class PromptGeneratorServiceTest {

    @Mock
    private DailyPromptRepository dailyPromptRepository;

    @Mock
    private WfhRequestRepository wfhRequestRepository;

    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;

    @Test
    void generatesThreeUniquePromptsForAnApprovedWfhCandidate() {
        LocalDate date = LocalDate.of(2030, 1, 7); // a future Monday, so no window has expired yet
        User candidate = new User();
        candidate.setRole("CANDIDATE");
        WfhRequest approvedRequest = new WfhRequest();
        approvedRequest.setUser(candidate);
        EnumSet<PromptStage> savedStages = EnumSet.noneOf(PromptStage.class);
        when(wfhRequestRepository.findApprovedCovering(date)).thenReturn(List.of(approvedRequest));
        when(dailyPromptRepository.existsByUserAndPromptDateAndStage(eq(candidate), eq(date), any()))
                .thenAnswer(invocation -> savedStages.contains(invocation.getArgument(2)));
        when(attendanceRecordRepository.findByUserAndAttendanceDate(candidate, date)).thenReturn(Optional.empty());
        when(dailyPromptRepository.save(any(DailyPrompt.class))).thenAnswer(invocation -> {
            DailyPrompt prompt = invocation.getArgument(0);
            savedStages.add(prompt.getStage());
            return prompt;
        });
        PromptGeneratorService service = new PromptGeneratorService(
                dailyPromptRepository,
                new PromptWindowCalculator(),
                wfhRequestRepository,
                attendanceRecordRepository);

        assertEquals(3, service.generateForDate(date));
        assertEquals(0, service.generateForDate(date));
        assertEquals(EnumSet.allOf(PromptStage.class), savedStages);
    }

    @Test
    void doesNotGeneratePromptsOnWeekends() {
        LocalDate saturday = LocalDate.of(2026, 10, 31);
        PromptGeneratorService service = new PromptGeneratorService(
                dailyPromptRepository,
                new PromptWindowCalculator(),
                wfhRequestRepository,
                attendanceRecordRepository);

        assertEquals(0, service.generateForDate(saturday));
        verify(wfhRequestRepository, never()).findApprovedCovering(saturday);
        verify(dailyPromptRepository, never()).save(any(DailyPrompt.class));
    }
}
