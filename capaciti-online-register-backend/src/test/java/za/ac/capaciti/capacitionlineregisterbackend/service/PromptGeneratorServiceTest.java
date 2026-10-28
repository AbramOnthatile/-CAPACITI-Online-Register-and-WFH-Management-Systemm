package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import za.ac.capaciti.capacitionlineregisterbackend.domain.AttendanceRecord;
import za.ac.capaciti.capacitionlineregisterbackend.domain.DailyPrompt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AttendanceRecordRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.DailyPromptRepository;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@ExtendWith(MockitoExtension.class)
class PromptGeneratorServiceTest {

    @Mock
    private DailyPromptRepository dailyPromptRepository;

    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;

    private PromptGeneratorService service() {
        return new PromptGeneratorService(dailyPromptRepository, new PromptWindowCalculator(), attendanceRecordRepository);
    }

    private AttendanceRecord clockedIn(User user, LocalDate date, Instant clockIn) {
        return AttendanceRecord.builder().user(user).attendanceDate(date).clockInAt(clockIn).build();
    }

    private User user(String role) {
        User user = new User();
        user.setRole(role);
        user.setActive(true);
        return user;
    }

    @Test
    void clockingInCreatesTheThreeCheckInsOnceWithTheMorningOneOpen() {
        LocalDate date = LocalDate.of(2030, 1, 7); // future, so midday has not opened yet
        User candidate = user("CANDIDATE");
        Map<PromptStage, DailyPrompt> saved = new EnumMap<>(PromptStage.class);
        when(dailyPromptRepository.existsByUserAndPromptDateAndStage(eq(candidate), eq(date), any()))
                .thenAnswer(invocation -> saved.containsKey(invocation.getArgument(2)));
        when(dailyPromptRepository.save(any(DailyPrompt.class))).thenAnswer(invocation -> {
            DailyPrompt prompt = invocation.getArgument(0);
            saved.put(prompt.getStage(), prompt);
            return prompt;
        });
        AttendanceRecord attendance = clockedIn(candidate, date, TimeUtil.now().toInstant());

        assertEquals(3, service().generateOnClockIn(attendance));
        assertEquals(0, service().generateOnClockIn(attendance));
        assertEquals(EnumSet.allOf(PromptStage.class), saved.keySet());
        assertEquals(PromptStatus.ACTIVE, saved.get(PromptStage.MORNING_KICKOFF).getStatus());
        assertEquals(PromptStatus.ACTIVE, saved.get(PromptStage.EOD_WRAP_UP).getStatus());
        assertEquals(PromptStatus.SCHEDULED, saved.get(PromptStage.MIDDAY_PULSE).getStatus());
        assertEquals(TimeUtil.toInstant(date, LocalTime.of(13, 30)), saved.get(PromptStage.MIDDAY_PULSE).getScheduledAt());
    }

    @Test
    void nonCandidatesGetNoCheckIns() {
        AttendanceRecord attendance = clockedIn(user("TECH_CHAMP"), LocalDate.of(2030, 1, 7), Instant.now());

        assertEquals(0, service().generateOnClockIn(attendance));
        verify(dailyPromptRepository, never()).save(any(DailyPrompt.class));
    }

    @Test
    void catchUpCoversCandidatesAlreadyClockedIn() {
        LocalDate date = LocalDate.of(2030, 1, 7);
        User candidate = user("CANDIDATE");
        when(attendanceRecordRepository.findByAttendanceDateAndClockInAtIsNotNullAndClockOutAtIsNull(date))
                .thenReturn(List.of(clockedIn(candidate, date, Instant.now())));
        when(dailyPromptRepository.save(any(DailyPrompt.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals(3, service().generateForClockedIn(date));
    }
}
