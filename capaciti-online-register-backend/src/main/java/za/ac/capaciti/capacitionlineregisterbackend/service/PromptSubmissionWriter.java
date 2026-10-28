package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.ac.capaciti.capacitionlineregisterbackend.domain.DailyPrompt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.SupportTicket;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.prompt.SubmitPromptResponse;
import za.ac.capaciti.capacitionlineregisterbackend.enums.TicketStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.TicketType;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStage;
import za.ac.capaciti.capacitionlineregisterbackend.enums.PromptStatus;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ConflictException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.PromptMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.DailyPromptRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.SupportTicketRepository;

@Service
public class PromptSubmissionWriter {

    private final DailyPromptRepository dailyPromptRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final PromptMapper promptMapper;

    public PromptSubmissionWriter(
            DailyPromptRepository dailyPromptRepository,
            SupportTicketRepository supportTicketRepository,
            PromptMapper promptMapper) {
        this.dailyPromptRepository = dailyPromptRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.promptMapper = promptMapper;
    }

    @Transactional
    public SubmitPromptResponse recordRetry(UUID promptId, User user, Instant now, QualityResult quality) {
        DailyPrompt prompt = findOpenPrompt(promptId, user, now);
        prompt.setAttemptCount(quality.attempt());
        DailyPrompt saved = dailyPromptRepository.save(prompt);
        return new SubmitPromptResponse(promptMapper.toDto(saved), quality);
    }

    @Transactional
    public SubmitPromptResponse complete(
            UUID promptId,
            User user,
            Instant now,
            Map<String, Object> response,
            QualityResult quality) {
        DailyPrompt prompt = findOpenPrompt(promptId, user, now);
        prompt.setResponse(response);
        prompt.setStatus(PromptStatus.SUBMITTED);
        prompt.setSubmittedAt(now);
        prompt.setAttemptCount(quality.attempt());
        prompt.setAiQualityFlag(quality.flagged());
        DailyPrompt saved = dailyPromptRepository.save(prompt);

        if (prompt.getStage() != PromptStage.MORNING_KICKOFF
                && "BLOCKED".equals(response.get("progressStatus"))) {
            WorkMode workMode = prompt.getAttendance() == null || prompt.getAttendance().getWorkMode() == null
                    ? WorkMode.ON_SITE
                    : prompt.getAttendance().getWorkMode();
            String title = prompt.getStage() == PromptStage.MIDDAY_PULSE
                    ? "Midday check-in blocker"
                    : "End-of-day check-in blocker";
            createPassiveBlockerTicket(user, title, workMode, (String) response.get("blockerNote"), quality.flagged());
        }
        return new SubmitPromptResponse(promptMapper.toDto(saved), quality);
    }

    private DailyPrompt findOpenPrompt(UUID promptId, User user, Instant requestTime) {
        DailyPrompt prompt = dailyPromptRepository.findByIdForSubmission(promptId)
                .filter(candidate -> user.getId().equals(candidate.getUser().getId()))
                .orElseThrow(() -> new ConflictException("PROMPT_NOT_OPEN", "Prompt is not open"));
        if (prompt.getStatus() == PromptStatus.SUBMITTED) {
            throw new ConflictException("PROMPT_ALREADY_SUBMITTED", "Prompt has already been submitted");
        }
        if (prompt.getStatus() == PromptStatus.EXPIRED || !requestTime.isBefore(prompt.getExpiresAt())) {
            throw new ConflictException("PROMPT_EXPIRED", "Prompt has expired");
        }
        if (requestTime.isBefore(prompt.getScheduledAt())) {
            throw new ConflictException("PROMPT_NOT_OPEN", "Prompt is not open yet");
        }
        return prompt;
    }

    private void createPassiveBlockerTicket(User user, String title, WorkMode workMode, String blockerNote, boolean aiQualityFlag) {
        supportTicketRepository.save(SupportTicket.builder()
                .user(user)
                .type(TicketType.BLOCKER)
                .workMode(workMode)
                .title(title)
                .description(blockerNote)
                .status(TicketStatus.OPEN)
                .prolonged(false)
                .aiQualityFlag(aiQualityFlag)
                .build());
    }
}
