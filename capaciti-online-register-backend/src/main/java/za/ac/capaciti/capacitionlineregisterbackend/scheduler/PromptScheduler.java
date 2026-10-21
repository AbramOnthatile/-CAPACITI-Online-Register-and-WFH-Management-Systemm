package za.ac.capaciti.capacitionlineregisterbackend.scheduler;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import za.ac.capaciti.capacitionlineregisterbackend.service.IPromptGeneratorService;
import za.ac.capaciti.capacitionlineregisterbackend.service.IPromptService;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Component
public class PromptScheduler {

    private static final Logger log = LoggerFactory.getLogger(PromptScheduler.class);

    private final IPromptGeneratorService promptGeneratorService;
    private final IPromptService promptService;

    public PromptScheduler(
            IPromptGeneratorService promptGeneratorService,
            IPromptService promptService) {
        this.promptGeneratorService = promptGeneratorService;
        this.promptService = promptService;
    }

    @Scheduled(cron = "0 30 8 * * MON-FRI", zone = "${app.timezone}")
    public void generatePrompts() {
        try {
            int count = promptGeneratorService.generateForDate(TimeUtil.today());
            if (count > 0) {
                log.info("generatePrompts count={}", count);
            }
        } catch (Exception exception) {
            log.error("{}: {}", exception.getClass().getSimpleName(), exception.getMessage());
        }
    }

    @Scheduled(fixedDelay = 60000, initialDelay = 30000)
    public void housekeeping() {
        try {
            int count = promptService.activateDue();
            if (count > 0) {
                log.info("activateDue count={}", count);
            }
        } catch (Exception exception) {
            log.error("{}: {}", exception.getClass().getSimpleName(), exception.getMessage());
        }

        try {
            int count = promptService.expireOverdue();
            if (count > 0) {
                log.info("expireOverdue count={}", count);
            }
        } catch (Exception exception) {
            log.error("{}: {}", exception.getClass().getSimpleName(), exception.getMessage());
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public void catchUp() {
        try {
            LocalDate today = TimeUtil.today();
            int count = promptGeneratorService.generateForDate(today);
            if (count > 0) {
                log.info("catchUp count={}", count);
            }
        } catch (Exception exception) {
            log.error("{}: {}", exception.getClass().getSimpleName(), exception.getMessage());
        }
    }
}
