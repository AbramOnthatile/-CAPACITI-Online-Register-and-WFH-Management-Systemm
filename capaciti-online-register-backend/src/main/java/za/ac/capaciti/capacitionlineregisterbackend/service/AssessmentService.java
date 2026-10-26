package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.LocalDate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.ac.capaciti.capacitionlineregisterbackend.domain.Assessment;
import za.ac.capaciti.capacitionlineregisterbackend.domain.AttendanceRecord;
import za.ac.capaciti.capacitionlineregisterbackend.domain.ScorecardEntry;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.AssessmentDetailDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.AssessmentSummaryDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.AttendanceSuggestionDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.CreateAssessmentRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.EntryRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.MyScorecardDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.SaveEntriesRequest;
import za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.AssessmentType;
import za.ac.capaciti.capacitionlineregisterbackend.enums.UserRole;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ConflictException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ResourceNotFoundException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.ScorecardMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AssessmentRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AttendanceRecordRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.ScorecardEntryRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;

@Service
public class AssessmentService implements IAssessmentService {

    private static final String ASSESSMENT_TARGET = "ASSESSMENT";

    private final AssessmentRepository assessmentRepository;
    private final ScorecardEntryRepository scorecardEntryRepository;
    private final UserRepository userRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final ScorecardMapper scorecardMapper;
    private final AttendanceScoreCalculator scoreCalculator;
    private final AuditService auditService;

    public AssessmentService(
            AssessmentRepository assessmentRepository,
            ScorecardEntryRepository scorecardEntryRepository,
            UserRepository userRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            ScorecardMapper scorecardMapper,
            AttendanceScoreCalculator scoreCalculator,
            AuditService auditService) {
        this.assessmentRepository = assessmentRepository;
        this.scorecardEntryRepository = scorecardEntryRepository;
        this.userRepository = userRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.scorecardMapper = scorecardMapper;
        this.scoreCalculator = scoreCalculator;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public AssessmentDetailDto create(String email, CreateAssessmentRequest request) {
        User mentor = currentUser(email);
        if (!UserRole.TECH_CHAMP.name().equals(mentor.getRole())) {
            throw new BadRequestException("Only tech champions can create assessments");
        }

        List<User> candidates = userRepository.findByChampionAndRoleAndActive(
                mentor, UserRole.CANDIDATE.name(), true);
        if (candidates.isEmpty()) {
            throw new ConflictException("NO_CANDIDATES_ASSIGNED", "No candidates are assigned to you");
        }

        Assessment assessment = assessmentRepository.save(Assessment.builder()
                .title(request.title())
                .type(request.type())
                .mentor(mentor)
                .assessmentDate(request.assessmentDate())
                .periodStart(request.periodStart())
                .periodEnd(request.periodEnd())
                .status(AssessmentStatus.DRAFT)
                .build());

        List<ScorecardEntry> entries = candidates.stream()
                .map(candidate -> ScorecardEntry.builder()
                        .assessment(assessment)
                        .candidate(candidate)
                        .build())
                .toList();
        scorecardEntryRepository.saveAll(entries);
        auditService.log(
                mentor,
                "ASSESSMENT_CREATED",
                ASSESSMENT_TARGET,
                assessment.getId().toString(),
                Map.of("entryCount", entries.size()));
        return detail(assessment);
    }

    @Override
    @Transactional
    public AssessmentDetailDto saveEntries(
            UUID assessmentId, String email, SaveEntriesRequest request) {
        User mentor = currentUser(email);
        Assessment assessment = findOwnedAssessment(assessmentId, mentor);
        requireStatus(assessment, AssessmentStatus.DRAFT);
        if (request.entries() == null) {
            throw new BadRequestException("Entries are required");
        }

        List<ScorecardEntry> entries = scorecardEntryRepository.findByAssessmentId(assessmentId);
        Map<UUID, ScorecardEntry> entriesByCandidate = new HashMap<>();
        for (ScorecardEntry entry : entries) {
            entriesByCandidate.put(entry.getCandidate().getId(), entry);
        }

        for (EntryRequest requested : request.entries()) {
            if (requested.candidateId() == null) {
                throw new BadRequestException("Each entry must include a candidateId");
            }
            ScorecardEntry entry = entriesByCandidate.get(requested.candidateId());
            if (entry == null) {
                throw new BadRequestException("Candidate does not belong to this assessment");
            }
            validateScore("attendanceScore", requested.attendanceScore());
            validateScore("communicationScore", requested.communicationScore());
            validateScore("accountabilityScore", requested.accountabilityScore());
            validateScore("creativityScore", requested.creativityScore());
            validateScore("deliveryScore", requested.deliveryScore());
            validateScore("techSkillsScore", requested.techSkillsScore());

            entry.setAttendanceScore(requested.attendanceScore());
            entry.setCommunicationScore(requested.communicationScore());
            entry.setAccountabilityScore(requested.accountabilityScore());
            entry.setCreativityScore(requested.creativityScore());
            entry.setDeliveryScore(requested.deliveryScore());
            entry.setTechSkillsScore(requested.techSkillsScore());
            entry.setOverallPercent(overallPercent(requested));
            entry.setFeedback(requested.feedback());
            entry.setFeedbackStrengths(requested.feedbackStrengths());
            entry.setFeedbackImprovements(requested.feedbackImprovements());
        }
        assessment.setGroupFeedback(request.groupFeedback());
        scorecardEntryRepository.saveAll(entries);
        assessmentRepository.save(assessment);
        return detail(assessment);
    }

    @Override
    @Transactional
    public AssessmentDetailDto submit(UUID assessmentId, String email) {
        User mentor = currentUser(email);
        Assessment assessment = findOwnedAssessment(assessmentId, mentor);
        requireStatus(assessment, AssessmentStatus.DRAFT);
        List<ScorecardEntry> entries = scorecardEntryRepository.findByAssessmentId(assessmentId);

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (ScorecardEntry entry : entries) {
            List<String> missing = missingCriteria(entry);
            if (!missing.isEmpty()) {
                fieldErrors.put(entry.getCandidate().getId().toString(), String.join(", ", missing));
            }
        }
        if (!fieldErrors.isEmpty()) {
            throw new BadRequestException(
                    "ASSESSMENT_INCOMPLETE",
                    "Every candidate must have all six scores before submission",
                    fieldErrors);
        }

        assessment.setStatus(AssessmentStatus.SUBMITTED);
        assessment.setSubmittedAt(Instant.now());
        assessmentRepository.save(assessment);
        Double groupAverage = scorecardEntryRepository.averageOverallByAssessmentId(assessmentId);
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("groupAverage", groupAverage);
        details.put("entryCount", entries.size());
        auditService.log(
                mentor,
                "ASSESSMENT_SUBMITTED",
                ASSESSMENT_TARGET,
                assessmentId.toString(),
                details);
        return detail(assessment);
    }

    @Override
    @Transactional
    public AssessmentDetailDto reopen(UUID assessmentId, String email) {
        User mentor = currentUser(email);
        Assessment assessment = findOwnedAssessment(assessmentId, mentor);
        requireStatus(assessment, AssessmentStatus.SUBMITTED);
        assessment.setStatus(AssessmentStatus.DRAFT);
        assessment.setReopenedBy(mentor);
        assessment.setReopenedAt(Instant.now());
        assessmentRepository.save(assessment);
        auditService.log(
                mentor,
                "ASSESSMENT_REOPENED",
                ASSESSMENT_TARGET,
                assessmentId.toString(),
                Map.of());
        return detail(assessment);
    }

    @Override
    @Transactional
    public void delete(UUID assessmentId, String email) {
        User mentor = currentUser(email);
        Assessment assessment = findOwnedAssessment(assessmentId, mentor);
        requireStatus(assessment, AssessmentStatus.DRAFT);
        List<ScorecardEntry> entries = scorecardEntryRepository.findByAssessmentId(assessmentId);
        scorecardEntryRepository.deleteAll(entries);
        assessmentRepository.delete(assessment);
        auditService.log(
                mentor,
                "ASSESSMENT_DELETED",
                ASSESSMENT_TARGET,
                assessmentId.toString(),
                Map.of());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AssessmentSummaryDto> list(
            String email,
            AssessmentType type,
            AssessmentStatus status,
            LocalDate from,
            LocalDate to,
            Pageable pageable) {
        User user = currentUser(email);
        Page<Assessment> assessments;
        if (UserRole.ADMIN.name().equals(user.getRole())) {
            assessments = assessmentRepository.searchSubmitted(type, from, to, pageable);
        } else if (UserRole.TECH_CHAMP.name().equals(user.getRole())) {
            assessments = assessmentRepository.search(user.getId(), type, status, from, to, pageable);
        } else {
            throw notFound();
        }
        return assessments.map(this::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public AssessmentDetailDto getById(UUID assessmentId, String email) {
        User user = currentUser(email);
        Assessment assessment = assessmentRepository.findWithMentorById(assessmentId)
                .orElseThrow(AssessmentService::notFound);
        if (UserRole.ADMIN.name().equals(user.getRole())) {
            if (assessment.getStatus() != AssessmentStatus.SUBMITTED) {
                throw notFound();
            }
        } else if (!UserRole.TECH_CHAMP.name().equals(user.getRole())
                || !user.getId().equals(assessment.getMentor().getId())) {
            throw notFound();
        }
        return detail(assessment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MyScorecardDto> myScorecards(String email) {
        User candidate = currentUser(email);
        if (!UserRole.CANDIDATE.name().equals(candidate.getRole())) {
            throw notFound();
        }
        return scorecardEntryRepository
                .findByCandidateIdAndAssessmentStatusOrderByAssessmentAssessmentDateDesc(
                        candidate.getId(), AssessmentStatus.SUBMITTED)
                .stream()
                .map(scorecardMapper::toMyScorecardDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MyScorecardDto myScorecard(UUID assessmentId, String email) {
        User candidate = currentUser(email);
        if (!UserRole.CANDIDATE.name().equals(candidate.getRole())) {
            throw notFound();
        }
        ScorecardEntry entry = scorecardEntryRepository
                .findByAssessmentIdAndCandidateId(assessmentId, candidate.getId())
                .filter(found -> found.getAssessment().getStatus() == AssessmentStatus.SUBMITTED)
                .orElseThrow(AssessmentService::notFound);
        return scorecardMapper.toMyScorecardDto(entry);
    }

    private User currentUser(String email) {
        return userRepository.findByEmailIgnoreCase(email).orElseThrow(AssessmentService::notFound);
    }

    private Assessment findOwnedAssessment(UUID assessmentId, User mentor) {
        Assessment assessment = assessmentRepository.findWithMentorById(assessmentId)
                .orElseThrow(AssessmentService::notFound);
        if (!UserRole.TECH_CHAMP.name().equals(mentor.getRole())
                || !mentor.getId().equals(assessment.getMentor().getId())) {
            throw notFound();
        }
        return assessment;
    }

    private void requireStatus(Assessment assessment, AssessmentStatus expected) {
        if (assessment.getStatus() != expected) {
            throw new ConflictException(
                    "ASSESSMENT_LOCKED",
                    "Assessment must be " + expected.name().toLowerCase() + " for this operation");
        }
    }

    private void validateScore(String fieldName, Integer score) {
        if (score != null && (score < 1 || score > 5)) {
            throw new BadRequestException(fieldName + " must be between 1 and 5");
        }
    }

    private Integer overallPercent(EntryRequest entry) {
        Integer[] scores = {
            entry.attendanceScore(),
            entry.communicationScore(),
            entry.accountabilityScore(),
            entry.creativityScore(),
            entry.deliveryScore(),
            entry.techSkillsScore()
        };
        for (Integer score : scores) {
            if (score == null) {
                return null;
            }
        }
        return scoreCalculator.overallPercent(
                entry.attendanceScore(),
                entry.communicationScore(),
                entry.accountabilityScore(),
                entry.creativityScore(),
                entry.deliveryScore(),
                entry.techSkillsScore());
    }

    private List<String> missingCriteria(ScorecardEntry entry) {
        List<String> missing = new ArrayList<>();
        if (entry.getAttendanceScore() == null) {
            missing.add("attendance");
        }
        if (entry.getCommunicationScore() == null) {
            missing.add("communication");
        }
        if (entry.getAccountabilityScore() == null) {
            missing.add("accountability");
        }
        if (entry.getCreativityScore() == null) {
            missing.add("creativity");
        }
        if (entry.getDeliveryScore() == null) {
            missing.add("delivery");
        }
        if (entry.getTechSkillsScore() == null) {
            missing.add("techSkills");
        }
        return missing;
    }

    private AssessmentSummaryDto toSummary(Assessment assessment) {
        return scorecardMapper.toSummaryDto(
                assessment,
                scorecardEntryRepository.countByAssessmentId(assessment.getId()),
                groupAverage(assessment));
    }

    private AssessmentDetailDto detail(Assessment assessment) {
        List<ScorecardEntry> entries = scorecardEntryRepository.findByAssessmentId(assessment.getId());
        return scorecardMapper.toDetailDto(
                assessment, entries, groupAverage(assessment), attendanceSuggestions(assessment, entries));
    }

    private Double groupAverage(Assessment assessment) {
        return assessment.getStatus() == AssessmentStatus.SUBMITTED
                ? scorecardEntryRepository.averageOverallByAssessmentId(assessment.getId())
                : null;
    }

    private List<AttendanceSuggestionDto> attendanceSuggestions(
            Assessment assessment, List<ScorecardEntry> entries) {
        if (entries.isEmpty()
                || assessment.getPeriodStart() == null
                || assessment.getPeriodEnd() == null) {
            return List.of();
        }

        Map<UUID, AttendanceCounts> countsByCandidate = new HashMap<>();
        List<UUID> candidateIds = entries.stream()
                .map(entry -> entry.getCandidate().getId())
                .toList();
        for (AttendanceRecord record : attendanceRecordRepository.findByUser_IdInAndAttendanceDateBetween(
                candidateIds, assessment.getPeriodStart(), assessment.getPeriodEnd())) {
            UUID candidateId = record.getUser().getId();
            AttendanceCounts counts = countsByCandidate.computeIfAbsent(
                    candidateId, ignored -> new AttendanceCounts());
            ArrivalStatus status = record.getArrivalStatus();
            if (status == ArrivalStatus.ON_TIME) {
                counts.onTime++;
            } else if (status == ArrivalStatus.LATE_EXCUSED) {
                counts.lateExcused++;
            } else if (status == ArrivalStatus.LATE_UNEXCUSED) {
                counts.lateUnexcused++;
            } else if (status == ArrivalStatus.ABSENT_UNEXCUSED) {
                counts.absent++;
            }
        }

        return entries.stream()
                .map(entry -> {
                    UUID candidateId = entry.getCandidate().getId();
                    AttendanceCounts counts = countsByCandidate.getOrDefault(
                            candidateId, new AttendanceCounts());
                    return new AttendanceSuggestionDto(
                            candidateId,
                            counts.onTime,
                            counts.lateExcused,
                            counts.lateUnexcused,
                            counts.absent,
                            scoreCalculator.suggestAttendanceScore(
                                    counts.onTime,
                                    counts.lateExcused,
                                    counts.lateUnexcused,
                                    counts.absent));
                })
                .toList();
    }

    private static ResourceNotFoundException notFound() {
        return new ResourceNotFoundException("Assessment not found");
    }

    private static final class AttendanceCounts {
        private int onTime;
        private int lateExcused;
        private int lateUnexcused;
        private int absent;
    }
}
