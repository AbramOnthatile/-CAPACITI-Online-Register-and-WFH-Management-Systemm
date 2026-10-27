package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import za.ac.capaciti.capacitionlineregisterbackend.domain.DailyPrompt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.PromptDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.PromptListResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.SubmitPromptRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.SubmitPromptResponse;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.QualityContext;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ConflictException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ResourceNotFoundException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.PromptMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.DailyPromptRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;
import za.ac.capaciti.capacitionlineregisterbackend.util.Helper;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Service
public class PromptService implements IPromptService {

    private static final Pattern COMMIT_HASH = Pattern.compile("[a-fA-F0-9]{7,40}");

    private final DailyPromptRepository dailyPromptRepository;
    private final UserRepository userRepository;
    private final PromptMapper promptMapper;
    private final IQualityGateService qualityGateService;
    private final PromptSubmissionWriter promptSubmissionWriter;

    public PromptService(
            DailyPromptRepository dailyPromptRepository,
            UserRepository userRepository,
            PromptMapper promptMapper,
            IQualityGateService qualityGateService,
            PromptSubmissionWriter promptSubmissionWriter) {
        this.dailyPromptRepository = dailyPromptRepository;
        this.userRepository = userRepository;
        this.promptMapper = promptMapper;
        this.qualityGateService = qualityGateService;
        this.promptSubmissionWriter = promptSubmissionWriter;
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

        validateSubmission(prompt.getStage(), request);
        String freeText = freeText(prompt.getStage(), request);
        QualityResult quality = freeText == null
                ? new QualityResult(true, true, null, 0, false)
                : qualityGateService.check(user, QualityContext.PROMPT, promptId.toString(), freeText);

        if (!quality.accepted()) {
            return promptSubmissionWriter.recordRetry(promptId, user, now, quality);
        }

        return promptSubmissionWriter.complete(
                promptId, user, now, responseFor(prompt.getStage(), request), quality);
    }

    private User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void validateSubmission(PromptStage stage, SubmitPromptRequest request) {
        if (request == null) {
            throw new BadRequestException("Submission is required");
        }

        switch (stage) {
            case MORNING_KICKOFF -> {
                int deliverableCount = nonBlankDeliverables(request.deliverables()).size();
                if (deliverableCount < 2 || deliverableCount > 3) {
                    throw new BadRequestException("Provide 2 to 3 non-blank deliverables");
                }
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
            case MIDDAY_PULSE -> {
                if (!isOneOf(request.progressStatus(), "ON_TRACK", "DELAYED", "BLOCKED")) {
                    throw new BadRequestException("progressStatus must be ON_TRACK, DELAYED, or BLOCKED");
                }
                if (("DELAYED".equals(request.progressStatus()) || "BLOCKED".equals(request.progressStatus()))
                        && Helper.isNullOrEmpty(request.blockerNote())) {
                    throw new BadRequestException("blockerNote is required when progressStatus is DELAYED or BLOCKED");
                }
                if ("BLOCKED".equals(request.progressStatus())) {
                    // TODO Member 4: create a ticket through its service when available.
                }
            }
            case EOD_WRAP_UP -> {
                if (!isValidWorkLink(request.workLink())) {
                    throw new BadRequestException("workLink must be an http(s) URL or a 7 to 40 character commit hash");
                }
            }
        }
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

    private boolean isValidWorkLink(String value) {
        if (Helper.isNullOrEmpty(value)) {
            return false;
        }
        String trimmedValue = value.trim();
        if (COMMIT_HASH.matcher(trimmedValue).matches()) {
            return true;
        }
        try {
            URI uri = URI.create(trimmedValue);
            String scheme = uri.getScheme();
            return uri.getHost() != null && ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme));
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private String freeText(PromptStage stage, SubmitPromptRequest request) {
        return switch (stage) {
            case MORNING_KICKOFF -> numberedDeliverables(request.deliverables());
            case MIDDAY_PULSE -> Helper.isNullOrEmpty(request.blockerNote()) ? null : request.blockerNote().trim();
            case EOD_WRAP_UP -> null;
        };
    }

    private String numberedDeliverables(List<String> deliverables) {
        List<String> lines = new ArrayList<>();
        for (String deliverable : nonBlankDeliverables(deliverables)) {
            lines.add((lines.size() + 1) + ". " + deliverable);
        }
        return String.join("\n", lines);
    }

    private List<String> nonBlankDeliverables(List<String> deliverables) {
        if (deliverables == null) {
            return List.of();
        }
        return deliverables.stream()
                .filter(deliverable -> !Helper.isNullOrEmpty(deliverable))
                .map(String::trim)
                .toList();
    }

    private Map<String, Object> responseFor(PromptStage stage, SubmitPromptRequest request) {
        Map<String, Object> response = new LinkedHashMap<>();
        switch (stage) {
            case MORNING_KICKOFF -> {
                response.put("deliverables", nonBlankDeliverables(request.deliverables()));
                response.put("standupConfirmed", request.standupConfirmed());
                response.put("powerStatus", request.powerStatus());
                response.put("ispStatus", request.ispStatus());
            }
            case MIDDAY_PULSE -> {
                response.put("progressStatus", request.progressStatus());
                if (!Helper.isNullOrEmpty(request.blockerNote())) {
                    response.put("blockerNote", request.blockerNote().trim());
                }
            }
            case EOD_WRAP_UP -> response.put("workLink", request.workLink().trim());
        }
        return response;
    }
}