package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import za.ac.capaciti.capacitionlineregisterbackend.domain.AttendanceRecord;
import za.ac.capaciti.capacitionlineregisterbackend.domain.DailyPrompt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.SubmitPromptRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.SubmitPromptRequest.TaskEntry;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ApiException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.PromptMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AttendanceRecordRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.DailyPromptRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@ExtendWith(MockitoExtension.class)
class PromptServiceTest {

    private static final String EMAIL = "candidate@test.com";

    @Mock private DailyPromptRepository dailyPromptRepository;
    @Mock private UserRepository userRepository;
    @Mock private AttendanceRecordRepository attendanceRecordRepository;
    @Mock private IQualityGateService qualityGateService;
    @Mock private PromptSubmissionWriter promptSubmissionWriter;

    private PromptService service;
    private User user;
    private LocalDate today;
    private final List<DailyPrompt> todaysPrompts = new ArrayList<>();

    @BeforeEach
    void setUp() {
        service = new PromptService(dailyPromptRepository, userRepository, attendanceRecordRepository,
                new PromptMapper(), qualityGateService, promptSubmissionWriter);
        user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(EMAIL);
        user.setRole("CANDIDATE");
        today = TimeUtil.today();
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user));
        lenient().when(dailyPromptRepository.findByUserAndPromptDateOrderByScheduledAtAsc(user, today)).thenReturn(todaysPrompts);
        lenient().when(qualityGateService.check(any(), any(), any(), any())).thenReturn(new QualityResult(true, false, null));
    }

    private DailyPrompt open(PromptStage stage) {
        DailyPrompt prompt = DailyPrompt.builder().user(user).stage(stage).promptDate(today)
                .status(PromptStatus.ACTIVE)
                .scheduledAt(Instant.now().minusSeconds(60))
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        prompt.setId(UUID.randomUUID());
        when(dailyPromptRepository.findById(prompt.getId())).thenReturn(Optional.of(prompt));
        return prompt;
    }

    private void submittedMorning(String... titles) {
        DailyPrompt morning = DailyPrompt.builder().user(user).stage(PromptStage.MORNING_KICKOFF).promptDate(today)
                .status(PromptStatus.SUBMITTED)
                .response(Map.of("tasks", List.of(titles).stream().map(title -> Map.of("title", title)).toList()))
                .build();
        todaysPrompts.add(morning);
    }

    private SubmitPromptRequest tasks(String note, TaskEntry... tasks) {
        return new SubmitPromptRequest(List.of(tasks), null, null, null, note, null);
    }

    private TaskEntry task(String title, String status) {
        return new TaskEntry(title, status);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> savedResponse(DailyPrompt prompt) {
        ArgumentCaptor<Map<String, Object>> response = ArgumentCaptor.forClass(Map.class);
        verify(promptSubmissionWriter).complete(eq(prompt.getId()), eq(user), any(Instant.class), response.capture(), any());
        return response.getValue();
    }

    @Test
    void morningNeedsAtLeastOneTask() {
        DailyPrompt morning = open(PromptStage.MORNING_KICKOFF);

        assertThrows(BadRequestException.class, () -> service.submit(EMAIL, morning.getId(), tasks(null, task("  ", null))));
    }

    @Test
    void onSiteMorningOnlyNeedsTasks() {
        DailyPrompt morning = open(PromptStage.MORNING_KICKOFF);
        when(attendanceRecordRepository.findByUserAndAttendanceDate(user, today))
                .thenReturn(Optional.of(AttendanceRecord.builder().workMode(WorkMode.ON_SITE).build()));

        service.submit(EMAIL, morning.getId(), tasks(null, task("Build login page", null)));

        assertEquals(List.of(Map.of("title", "Build login page")), savedResponse(morning).get("tasks"));
    }

    @Test
    void wfhMorningStillAsksForPowerAndInternet() {
        DailyPrompt morning = open(PromptStage.MORNING_KICKOFF);
        when(attendanceRecordRepository.findByUserAndAttendanceDate(user, today))
                .thenReturn(Optional.of(AttendanceRecord.builder().workMode(WorkMode.WFH).build()));

        assertThrows(BadRequestException.class, () -> service.submit(EMAIL, morning.getId(), tasks(null, task("Build login page", null))));
    }

    @Test
    void middayNeedsTheMorningTasksFirst() {
        DailyPrompt midday = open(PromptStage.MIDDAY_PULSE);

        ApiException exception = assertThrows(ApiException.class,
                () -> service.submit(EMAIL, midday.getId(), tasks(null, task("Build login page", "ON_TRACK"))));
        assertEquals("MORNING_TASKS_REQUIRED", exception.getCode());
    }

    @Test
    void newTasksWaitUntilAMorningTaskIsDone() {
        submittedMorning("Build login page", "Write tests");
        DailyPrompt midday = open(PromptStage.MIDDAY_PULSE);

        assertThrows(BadRequestException.class, () -> service.submit(EMAIL, midday.getId(), tasks(null,
                task("Build login page", "ON_TRACK"), task("Write tests", "ON_TRACK"), task("Fix navbar", "ON_TRACK"))));
    }

    @Test
    @SuppressWarnings("unchecked")
    void finishingAMorningTaskUnlocksNewOnes() {
        submittedMorning("Build login page", "Write tests");
        DailyPrompt midday = open(PromptStage.MIDDAY_PULSE);

        service.submit(EMAIL, midday.getId(), tasks(null,
                task("Build login page", "DONE"), task("Write tests", "ON_TRACK"), task("Fix navbar", "ON_TRACK")));

        Map<String, Object> response = savedResponse(midday);
        List<Map<String, Object>> saved = (List<Map<String, Object>>) response.get("tasks");
        assertEquals(List.of(false, false, true), saved.stream().map(entry -> entry.get("added")).toList());
        assertEquals("ON_TRACK", response.get("progressStatus"));
    }

    @Test
    void tasksCannotBeDroppedFromTheList() {
        submittedMorning("Build login page", "Write tests");
        DailyPrompt midday = open(PromptStage.MIDDAY_PULSE);

        assertThrows(BadRequestException.class,
                () -> service.submit(EMAIL, midday.getId(), tasks(null, task("Build login page", "DONE"))));
    }

    @Test
    void delayedOrBlockedTasksNeedANote() {
        submittedMorning("Build login page");
        DailyPrompt midday = open(PromptStage.MIDDAY_PULSE);

        assertThrows(BadRequestException.class,
                () -> service.submit(EMAIL, midday.getId(), tasks(null, task("Build login page", "BLOCKED"))));

        service.submit(EMAIL, midday.getId(), tasks("Waiting on API access", task("Build login page", "BLOCKED")));
        assertEquals("BLOCKED", savedResponse(midday).get("progressStatus"));
    }

    @Test
    void endOfDayNeedsNoLink() {
        submittedMorning("Build login page");
        DailyPrompt eod = open(PromptStage.EOD_WRAP_UP);

        service.submit(EMAIL, eod.getId(), tasks(null, task("Build login page", "DONE")));

        verify(promptSubmissionWriter).complete(eq(eod.getId()), eq(user), any(Instant.class), anyMap(), any());
    }
}
