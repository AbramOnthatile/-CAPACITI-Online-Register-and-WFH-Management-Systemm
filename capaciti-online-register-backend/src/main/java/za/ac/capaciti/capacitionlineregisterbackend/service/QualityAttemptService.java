package za.ac.capaciti.capacitionlineregisterbackend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import za.ac.capaciti.capacitionlineregisterbackend.domain.QualityAttempt;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.enums.QualityContext;
import za.ac.capaciti.capacitionlineregisterbackend.repository.QualityAttemptRepository;

@Service
public class QualityAttemptService {

    private final QualityAttemptRepository qualityAttemptRepository;

    public QualityAttemptService(QualityAttemptRepository qualityAttemptRepository) {
        this.qualityAttemptRepository = qualityAttemptRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int recordFailure(User user, QualityContext context, String contextRef, String feedback) {
        QualityAttempt qualityAttempt = qualityAttemptRepository
                .findByUserAndContextTypeAndContextRef(user, context, contextRef)
                .orElseGet(() -> QualityAttempt.builder()
                        .user(user)
                        .contextType(context)
                        .contextRef(contextRef)
                        .build());
        qualityAttempt.setAttempts(qualityAttempt.getAttempts() + 1);
        qualityAttempt.setLastFeedback(feedback);
        return qualityAttemptRepository.save(qualityAttempt).getAttempts();
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void reset(User user, QualityContext context, String contextRef) {
        qualityAttemptRepository.findByUserAndContextTypeAndContextRef(user, context, contextRef)
                .ifPresent(qualityAttempt -> {
                    qualityAttempt.setAttempts(0);
                    qualityAttemptRepository.save(qualityAttempt);
                });
    }
}