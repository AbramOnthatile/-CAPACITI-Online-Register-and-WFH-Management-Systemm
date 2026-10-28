package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import za.ac.capaciti.capacitionlineregisterbackend.domain.DailyPrompt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.PromptDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.PromptListResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.PromptReviewDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.SubmitPromptRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.SubmitPromptRequest.TaskEntry;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.SubmitPromptResponse;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.QualityContext;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ConflictException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ResourceNotFoundException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.PromptMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AttendanceRecordRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.DailyPromptRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;
import za.ac.capaciti.capacitionlineregisterbackend.util.Helper;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Service
public class PromptService implements IPromptService {

    static final int MAX_TASKS = 10;
    static final Set<String> TASK_STATUSES = Set.of("DONE", "ON_TRACK", "DELAYED", "BLOCKED");

    private final DailyPromptRepository dailyPromptRepository;
    private final UserRepository userRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final PromptMapper promptMapper;
    private final IQualityGateService qualityGateService;
    private final PromptSubmissionWriter promptSubmissionWriter;

    public PromptService(
            DailyPromptRepository dailyPromptRepository,
            UserRepository userRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            PromptMapper promptMapper,
            IQualityGateService qualityGateService,
            PromptSubmissionWriter promptSubmissionWriter) {
        this.dailyPromptRepository = dailyPromptRepository;
        this.userRepository = userRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.promptMapper = promptMapper;
        this.qualityGateService = qualityGateService;
        this.promptSubmissionWriter = promptSubmissionWriter;
    }

    // The tasks a midday or end-of-day check works from: the latest earlier list, and the morning plan.
    record TaskPlan(List<String> current, List<String> morning) {
    }

    @Override
    @Transactional(readOnly = true)
    public PromptListResponse active(String email) {
        User user = findUser(email);
        Instant now = TimeUtil.now().toInstant();
        List<PromptDto> prompts = dailyPromptRepository.findOpenForUser(user, now).stream()
                .map(promptMapper::toDto)
                .toList();
        return new PromptListResponse(now, prompts);
    }

    @Override
    @Transactional(readOnly = true)
    public PromptListResponse today(String email) {
        User user = findUser(email);
        Instant now = TimeUtil.now().toInstant();
        List<PromptDto> prompts = dailyPromptRepository
                .findByUserAndPromptDateOrderByScheduledAtAsc(user, TimeUtil.today()).stream()
                .map(promptMapper::toDto)
                .toList();
        return new PromptListResponse(now, prompts);
    }

    @Override
    @Transactional
    public int activateDue() {
        List<DailyPrompt> prompts = dailyPromptRepository.findDueToActivate(TimeUtil.now().toInstant());
        prompts.forEach(prompt -> prompt.setStatus(PromptStatus.ACTIVE));
        dailyPromptRepository.saveAll(prompts);
        return prompts.size();
    }

    @Override
    @Transactional
    public int expireOverdue() {
        List<DailyPrompt> prompts = dailyPromptRepository.findOverdue(TimeUtil.now().toInstant());
        prompts.forEach(prompt -> prompt.setStatus(PromptStatus.EXPIRED));
        dailyPromptRepository.saveAll(prompts);
        return prompts.size();
    }

    // After clock-out only the end-of-day form stays open.
    @Override
    @Transactional
    public int closeForClockOut(User user, LocalDate date) {
        List<DailyPrompt> closed = dailyPromptRepository.findByUserAndPromptDateOrderByScheduledAtAsc(user, date).stream()
                .filter(prompt -> prompt.getStage() != PromptStage.EOD_WRAP_UP)
                .filter(prompt -> prompt.getStatus() == PromptStatus.SCHEDULED || prompt.getStatus() == PromptStatus.ACTIVE)
                .toList();
        closed.forEach(prompt -> prompt.setStatus(PromptStatus.EXPIRED));
        dailyPromptRepository.saveAll(closed);
        return closed.size();
    }

    @Override
    public SubmitPromptResponse submit(String email, UUID promptId, SubmitPromptRequest request) {
        User user = findUser(email);
        DailyPrompt prompt = dailyPromptRepository.findById(promptId)
                .filter(candidate -> user.getId().equals(candidate.getUser().getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Prompt not found"));

        Instant now = TimeUtil.now().toInstant();
        if (prompt.getStatus() == PromptStatus.SUBMITTED) {
            throw new ConflictException("PROMPT_ALREADY_SUBMITTED", "Prompt has already been submitted");
        }
        if (prompt.getStatus() == PromptStatus.EXPIRED || !now.isBefore(prompt.getExpiresAt())) {
            throw new ConflictException("PROMPT_EXPIRED", "Prompt has expired");
        }
        if (now.isBefore(prompt.getScheduledAt())) {
            throw new ConflictException("PROMPT_NOT_OPEN", "Prompt is not open yet");
        }
        if (request == null) {
            throw new BadRequestException("Submission is required");
        }

        Map<String, Object> response;
        String freeText;
        if (prompt.getStage() == PromptStage.MORNING_KICKOFF) {
            List<String> tasks = validateMorning(request, workingFromHome(user, prompt.getPromptDate()));
            response = morningResponse(tasks, request);
            freeText = numbered(tasks);
        } else {
            TaskPlan plan = planBefore(user, prompt);
            response = progressResponse(validateProgress(request, plan), plan, request);
            freeText = Helper.isNullOrEmpty(request.blockerNote()) ? null : request.blockerNote().trim();
        }

        QualityResult quality = freeText == null
                ? new QualityResult(true, true, null, 0, false)
                : qualityGateService.check(user, QualityContext.PROMPT, promptId.toString(), freeText);
        if (!quality.accepted()) {
            return promptSubmissionWriter.recordRetry(promptId, user, now, quality);
        }
        return promptSubmissionWriter.complete(promptId, user, now, response, quality);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromptReviewDto> review(String email, LocalDate date) {
        User viewer = findUser(email);
        LocalDate day = date == null ? TimeUtil.today() : date;
        List<DailyPrompt> prompts = "TECH_CHAMP".equals(viewer.getRole())
                ? dailyPromptRepository.findForReviewByChampion(day, viewer)
                : dailyPromptRepository.findForReview(day);
        return prompts.stream().map(promptMapper::toReviewDto).toList();
    }

    private User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private boolean workingFromHome(User user, LocalDate date) {
        return attendanceRecordRepository.findByUserAndAttendanceDate(user, date)
                .map(attendance -> attendance.getWorkMode() == WorkMode.WFH)
                .orElse(false);
    }

    private List<String> validateMorning(SubmitPromptRequest request, boolean workingFromHome) {
        List<String> tasks = new ArrayList<>();
        if (request.tasks() != null) {
            for (TaskEntry task : request.tasks()) {
                if (task != null && !Helper.isNullOrEmpty(task.title())) {
                    tasks.add(task.title().trim());
                }
            }
        }
        if (tasks.isEmpty() || tasks.size() > MAX_TASKS) {
            throw new BadRequestException("Add between 1 and " + MAX_TASKS + " tasks for today");
        }
        requireUniqueTitles(tasks);
        if (workingFromHome) {
            if (request.standupConfirmed() == null) {
                throw new BadRequestException("standupConfirmed is required");
            }
            if (!isOneOf(request.powerStatus(), "STABLE", "UNSTABLE", "DOWN")) {
                throw new BadRequestException("powerStatus must be STABLE, UNSTABLE, or DOWN");
            }
            if (!isOneOf(request.ispStatus(), "STABLE", "UNSTABLE", "DOWN")) {
                throw new BadRequestException("ispStatus must be STABLE, UNSTABLE, or DOWN");
            }
        }
        return tasks;
    }

    private List<TaskEntry> validateProgress(SubmitPromptRequest request, TaskPlan plan) {
        List<TaskEntry> tasks = new ArrayList<>();
        if (request.tasks() != null) {
            for (TaskEntry task : request.tasks()) {
                if (task == null || Helper.isNullOrEmpty(task.title())) {
                    throw new BadRequestException("Every task needs a title");
                }
                if (!TASK_STATUSES.contains(task.status())) {
                    throw new BadRequestException("Give every task a status: DONE, ON_TRACK, DELAYED, or BLOCKED");
                }
                tasks.add(new TaskEntry(task.title().trim(), task.status()));
            }
        }
        if (tasks.isEmpty() || tasks.size() > MAX_TASKS) {
            throw new BadRequestException("List between 1 and " + MAX_TASKS + " tasks");
        }
        List<String> titles = tasks.stream().map(TaskEntry::title).toList();
        requireUniqueTitles(titles);

        Set<String> submitted = keys(titles);
        for (String existing : plan.current()) {
            if (!submitted.contains(key(existing))) {
                throw new BadRequestException("Keep all of your tasks in the list and update their status: missing \"" + existing + "\"");
            }
        }

        // New tasks are allowed once a task from the morning plan is done (or freely when there was no plan).
        Set<String> current = keys(plan.current());
        boolean addsTasks = titles.stream().anyMatch(title -> !current.contains(key(title)));
        if (addsTasks && !plan.morning().isEmpty()) {
            Set<String> morning = keys(plan.morning());
            boolean morningTaskDone = tasks.stream()
                    .anyMatch(task -> "DONE".equals(task.status()) && morning.contains(key(task.title())));
            if (!morningTaskDone) {
                throw new BadRequestException("Complete at least one of your morning tasks before adding new ones");
            }
        }

        boolean behind = tasks.stream().anyMatch(task -> "DELAYED".equals(task.status()) || "BLOCKED".equals(task.status()));
        if (behind && Helper.isNullOrEmpty(request.blockerNote())) {
            throw new BadRequestException("Add a note on what is delaying or blocking you");
        }
        return tasks;
    }

    private TaskPlan planBefore(User user, DailyPrompt prompt) {
        List<String> morning = null;
        List<String> latest = null;
        int latestStage = -1;
        for (DailyPrompt earlier : dailyPromptRepository.findByUserAndPromptDateOrderByScheduledAtAsc(user, prompt.getPromptDate())) {
            if (earlier.getStatus() != PromptStatus.SUBMITTED || earlier.getStage().ordinal() >= prompt.getStage().ordinal()) {
                continue;
            }
            List<String> titles = taskTitles(earlier.getResponse());
            if (earlier.getStage() == PromptStage.MORNING_KICKOFF) {
                morning = titles;
            }
            if (earlier.getStage().ordinal() > latestStage) {
                latestStage = earlier.getStage().ordinal();
                latest = titles;
            }
        }
        if (morning == null && prompt.getStage() == PromptStage.MIDDAY_PULSE) {
            throw new ConflictException("MORNING_TASKS_REQUIRED", "Submit your morning tasks first");
        }
        return new TaskPlan(latest == null ? List.of() : latest, morning == null ? List.of() : morning);
    }

    // Reads task titles from a stored response; older responses kept a plain "deliverables" list.
    static List<String> taskTitles(Map<String, Object> response) {
        List<String> titles = new ArrayList<>();
        if (response == null) {
            return titles;
        }
        if (response.get("tasks") instanceof List<?> tasks) {
            for (Object task : tasks) {
                if (task instanceof Map<?, ?> entry && entry.get("title") instanceof String title) {
                    titles.add(title);
                }
            }
        } else if (response.get("deliverables") instanceof List<?> deliverables) {
            for (Object deliverable : deliverables) {
                if (deliverable instanceof String title) {
                    titles.add(title);
                }
            }
        }
        return titles;
    }

    private Map<String, Object> morningResponse(List<String> tasks, SubmitPromptRequest request) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("tasks", tasks.stream().map(title -> Map.of("title", title)).toList());
        if (request.standupConfirmed() != null) {
            response.put("standupConfirmed", request.standupConfirmed());
        }
        if (!Helper.isNullOrEmpty(request.powerStatus())) {
            response.put("powerStatus", request.powerStatus());
        }
        if (!Helper.isNullOrEmpty(request.ispStatus())) {
            response.put("ispStatus", request.ispStatus());
        }
        return response;
    }

    private Map<String, Object> progressResponse(List<TaskEntry> tasks, TaskPlan plan, SubmitPromptRequest request) {
        Set<String> current = keys(plan.current());
        List<Map<String, Object>> entries = new ArrayList<>();
        for (TaskEntry task : tasks) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("title", task.title());
            entry.put("status", task.status());
            entry.put("added", !current.contains(key(task.title())));
            entries.add(entry);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("tasks", entries);
        response.put("progressStatus", overallStatus(tasks));
        if (!Helper.isNullOrEmpty(request.blockerNote())) {
            response.put("blockerNote", request.blockerNote().trim());
        }
        if (!Helper.isNullOrEmpty(request.note())) {
            response.put("note", request.note().trim());
        }
        return response;
    }

    // BLOCKED outranks DELAYED, which outranks being on track; kept for reports and blocker tickets.
    private String overallStatus(List<TaskEntry> tasks) {
        if (tasks.stream().anyMatch(task -> "BLOCKED".equals(task.status()))) {
            return "BLOCKED";
        }
        if (tasks.stream().anyMatch(task -> "DELAYED".equals(task.status()))) {
            return "DELAYED";
        }
        return "ON_TRACK";
    }

    private void requireUniqueTitles(List<String> titles) {
        if (keys(titles).size() != titles.size()) {
            throw new BadRequestException("Each task must have a different title");
        }
    }

    private static Set<String> keys(List<String> titles) {
        Set<String> keys = new HashSet<>();
        titles.forEach(title -> keys.add(key(title)));
        return keys;
    }

    private static String key(String title) {
        return title.trim().toLowerCase(Locale.ROOT);
    }

    private String numbered(List<String> tasks) {
        List<String> lines = new ArrayList<>();
        for (String task : tasks) {
            lines.add((lines.size() + 1) + ". " + task);
        }
        return String.join("\n", lines);
    }

    private boolean isOneOf(String value, String... options) {
        if (value == null) {
            return false;
        }
        for (String option : options) {
            if (option.equals(value)) {
                return true;
            }
        }
        return false;
    }
}
