package za.ac.capaciti.capacitionlineregisterbackend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import za.ac.capaciti.capacitionlineregisterbackend.client.GeminiClient;
import za.ac.capaciti.capacitionlineregisterbackend.client.GeminiVerdict;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;
import za.ac.capaciti.capacitionlineregisterbackend.enums.QualityContext;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.util.Helper;

@Service
public class QualityGateService implements IQualityGateService {

    private final GeminiClient geminiClient;
    private final QualityAttemptService qualityAttemptService;
    private final int maxAttempts;

    public QualityGateService(
            GeminiClient geminiClient,
            QualityAttemptService qualityAttemptService,
            @Value("${app.quality.max-attempts:3}") int maxAttempts) {
        this.geminiClient = geminiClient;
        this.qualityAttemptService = qualityAttemptService;
        this.maxAttempts = maxAttempts;
    }

    @Override
    public QualityResult check(User user, QualityContext context, String contextRef, String text) {
        if (Helper.isNullOrEmpty(text)) {
            throw new BadRequestException("Text is required");
        }
        if (contextRef == null || contextRef.isBlank()) {
            throw new BadRequestException("contextRef is required");
        }

        var verdict = geminiClient.evaluate(describe(context), text.trim());
        if (verdict.isEmpty()) {
            return new QualityResult(true, false, null, 0, true);
        }

        GeminiVerdict result = verdict.get();
        if (result.isValid()) {
            qualityAttemptService.reset(user, context, contextRef);
            return new QualityResult(true, true, null, 0, false);
        }

        int attempts;
        try {
            attempts = qualityAttemptService.recordFailure(user, context, contextRef, result.feedbackMessage());
        } catch (DataIntegrityViolationException exception) {
            attempts = qualityAttemptService.recordFailure(user, context, contextRef, result.feedbackMessage());
        }

        if (attempts >= maxAttempts) {
            qualityAttemptService.reset(user, context, contextRef);
            return new QualityResult(true, false, result.feedbackMessage(), attempts, true);
        }
        return new QualityResult(false, false, result.feedbackMessage(), attempts, false);
    }

    private String describe(QualityContext context) {
        return switch (context) {
            case PROMPT -> "daily work deliverables or a progress note for a work-from-home check-in";
            case LATE_REASON -> "reason for arriving late to work";
            case EARLY_CLOCKOUT -> "reason for clocking out before 16:00";
            case CLOCKOUT_NOTE -> "short note explaining why the person clocked out after 16:20";
            case TICKET -> "description of an IT issue or a work blocker";
            case WFH_REASON -> "reason for requesting to work from home";
        };
    }
}