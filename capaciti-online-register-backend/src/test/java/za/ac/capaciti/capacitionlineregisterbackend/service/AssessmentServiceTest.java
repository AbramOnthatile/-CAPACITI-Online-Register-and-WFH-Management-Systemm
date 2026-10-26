package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import za.ac.capaciti.capacitionlineregisterbackend.domain.Assessment;
import za.ac.capaciti.capacitionlineregisterbackend.domain.ScorecardEntry;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.CreateAssessmentRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.EntryRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.scorecard.SaveEntriesRequest;
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

@ExtendWith(MockitoExtension.class)
class AssessmentServiceTest {

    private static final String MENTOR_EMAIL = "mentor@example.com";
    private static final String CANDIDATE_EMAIL = "candidate@example.com";

    @Mock
    private AssessmentRepository assessmentRepository;

    @Mock
    private ScorecardEntryRepository scorecardEntryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;

    @Mock
    private ScorecardMapper scorecardMapper;

    @Mock
    private AttendanceScoreCalculator scoreCalculator;

    @Mock
    private AuditService auditService;

    private AssessmentService service;

    @BeforeEach
    void setUp() {
        service = new AssessmentService(
                assessmentRepository,
                scorecardEntryRepository,
                userRepository,
                attendanceRecordRepository,
                scorecardMapper,
                scoreCalculator,
                auditService);
    }

    @Test
    void anotherMentorsAssessmentIsNotFound() {
        User requestingMentor = mentor();
        User assessmentMentor = mentor();
        Assessment assessment = assessment(AssessmentStatus.DRAFT, assessmentMentor);
        when(userRepository.findByEmailIgnoreCase(MENTOR_EMAIL))
                .thenReturn(Optional.of(requestingMentor));
        when(assessmentRepository.findWithMentorById(assessment.getId()))
                .thenReturn(Optional.of(assessment));

        assertThrows(
                ResourceNotFoundException.class,
                () -> service.getById(assessment.getId(), MENTOR_EMAIL));
    }

    @Test
    void savingSubmittedAssessmentThrowsLockedConflict() {
        User mentor = mentor();
        Assessment assessment = assessment(AssessmentStatus.SUBMITTED, mentor);
        when(userRepository.findByEmailIgnoreCase(MENTOR_EMAIL)).thenReturn(Optional.of(mentor));
        when(assessmentRepository.findWithMentorById(assessment.getId()))
                .thenReturn(Optional.of(assessment));

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> service.saveEntries(
                        assessment.getId(), MENTOR_EMAIL, new SaveEntriesRequest("", List.of())));

        assertEquals("ASSESSMENT_LOCKED", exception.getCode());
    }

    @Test
    void savingRejectsScoresOutsideOneToFive() {
        User mentor = mentor();
        User candidate = candidate(mentor);
        Assessment assessment = assessment(AssessmentStatus.DRAFT, mentor);
        ScorecardEntry entry = entry(assessment, candidate);
        when(userRepository.findByEmailIgnoreCase(MENTOR_EMAIL)).thenReturn(Optional.of(mentor));
        when(assessmentRepository.findWithMentorById(assessment.getId()))
                .thenReturn(Optional.of(assessment));
        when(scorecardEntryRepository.findByAssessmentId(assessment.getId()))
                .thenReturn(List.of(entry));

        for (int invalidScore : List.of(0, 6)) {
            EntryRequest requested = request(candidate.getId(), invalidScore, 3, 3, 3, 3, 3);
            BadRequestException exception = assertThrows(
                    BadRequestException.class,
                    () -> service.saveEntries(
                            assessment.getId(),
                            MENTOR_EMAIL,
                            new SaveEntriesRequest("", List.of(requested))));
            assertEquals("BAD_REQUEST", exception.getCode());
        }
    }

    @Test
    void submitNamesCandidateAndMissingCriterion() {
        User mentor = mentor();
        User candidate = candidate(mentor);
        Assessment assessment = assessment(AssessmentStatus.DRAFT, mentor);
        ScorecardEntry entry = entry(assessment, candidate);
        entry.setCommunicationScore(4);
        entry.setAccountabilityScore(4);
        entry.setCreativityScore(4);
        entry.setDeliveryScore(4);
        entry.setTechSkillsScore(4);
        when(userRepository.findByEmailIgnoreCase(MENTOR_EMAIL)).thenReturn(Optional.of(mentor));
        when(assessmentRepository.findWithMentorById(assessment.getId()))
                .thenReturn(Optional.of(assessment));
        when(scorecardEntryRepository.findByAssessmentId(assessment.getId()))
                .thenReturn(List.of(entry));

        BadRequestException exception = assertThrows(
                BadRequestException.class, () -> service.submit(assessment.getId(), MENTOR_EMAIL));

        assertEquals("ASSESSMENT_INCOMPLETE", exception.getCode());
        assertEquals("attendance", exception.getFieldErrors().get(candidate.getId().toString()));
    }

    @Test
    void reopenRecordsTheAuthenticatedMentorAsActor() {
        User mentor = mentor();
        Assessment assessment = assessment(AssessmentStatus.SUBMITTED, mentor);
        when(userRepository.findByEmailIgnoreCase(MENTOR_EMAIL)).thenReturn(Optional.of(mentor));
        when(assessmentRepository.findWithMentorById(assessment.getId()))
                .thenReturn(Optional.of(assessment));
        when(scorecardEntryRepository.findByAssessmentId(assessment.getId())).thenReturn(List.of());

        service.reopen(assessment.getId(), MENTOR_EMAIL);

        assertEquals(AssessmentStatus.DRAFT, assessment.getStatus());
        assertEquals(mentor, assessment.getReopenedBy());
        assertNotNull(assessment.getReopenedAt());
        verify(auditService).log(
                eq(mentor),
                eq("ASSESSMENT_REOPENED"),
                eq("ASSESSMENT"),
                eq(assessment.getId().toString()),
                any());
    }

    @Test
    void candidateCannotReadDraftScorecard() {
        User candidate = candidate(null);
        Assessment assessment = assessment(AssessmentStatus.DRAFT, mentor());
        when(userRepository.findByEmailIgnoreCase(CANDIDATE_EMAIL))
                .thenReturn(Optional.of(candidate));
        when(scorecardEntryRepository.findByAssessmentIdAndCandidateId(
                        assessment.getId(), candidate.getId()))
                .thenReturn(Optional.of(entry(assessment, candidate)));

        assertThrows(
                ResourceNotFoundException.class,
                () -> service.myScorecard(assessment.getId(), CANDIDATE_EMAIL));
    }

    @Test
    void candidateCannotReadSomeoneElsesScorecard() {
        User candidate = candidate(null);
        when(userRepository.findByEmailIgnoreCase(CANDIDATE_EMAIL))
                .thenReturn(Optional.of(candidate));
        when(scorecardEntryRepository.findByAssessmentIdAndCandidateId(
                        any(UUID.class), eq(candidate.getId())))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> service.myScorecard(UUID.randomUUID(), CANDIDATE_EMAIL));
    }

    @Test
    void createFailsWhenMentorHasNoAssignedCandidates() {
        User mentor = mentor();
        when(userRepository.findByEmailIgnoreCase(MENTOR_EMAIL)).thenReturn(Optional.of(mentor));
        when(userRepository.findByChampionAndRoleAndActive(mentor, "CANDIDATE", true))
                .thenReturn(List.of());

        ConflictException exception = assertThrows(
                ConflictException.class,
                () -> service.create(
                        MENTOR_EMAIL,
                        new CreateAssessmentRequest(
                                "Weekly review",
                                AssessmentType.WEEKLY,
                                LocalDate.of(2026, 10, 26),
                                LocalDate.of(2026, 10, 19),
                                LocalDate.of(2026, 10, 23))));

        assertEquals("NO_CANDIDATES_ASSIGNED", exception.getCode());
        assertEquals("No candidates are assigned to you", exception.getMessage());
    }

    @Test
    void saveRejectsCandidateFromAnotherMentorsGroup() {
        User mentor = mentor();
        User assignedCandidate = candidate(mentor);
        User otherCandidate = candidate(mentor());
        Assessment assessment = assessment(AssessmentStatus.DRAFT, mentor);
        ScorecardEntry entry = entry(assessment, assignedCandidate);
        when(userRepository.findByEmailIgnoreCase(MENTOR_EMAIL)).thenReturn(Optional.of(mentor));
        when(assessmentRepository.findWithMentorById(assessment.getId()))
                .thenReturn(Optional.of(assessment));
        when(scorecardEntryRepository.findByAssessmentId(assessment.getId()))
                .thenReturn(List.of(entry));

        assertThrows(
                BadRequestException.class,
                () -> service.saveEntries(
                        assessment.getId(),
                        MENTOR_EMAIL,
                        new SaveEntriesRequest(
                                "",
                                List.of(request(otherCandidate.getId(), 4, 4, 4, 4, 4, 4)))));
    }

    private static User mentor() {
        User mentor = new User();
        mentor.setId(UUID.randomUUID());
        mentor.setEmail(MENTOR_EMAIL);
        mentor.setRole(UserRole.TECH_CHAMP.name());
        return mentor;
    }

    private static User candidate(User champion) {
        User candidate = new User();
        candidate.setId(UUID.randomUUID());
        candidate.setEmail(CANDIDATE_EMAIL);
        candidate.setFirstName("Test");
        candidate.setLastName("Candidate");
        candidate.setRole(UserRole.CANDIDATE.name());
        candidate.setChampion(champion);
        return candidate;
    }

    private static Assessment assessment(AssessmentStatus status, User mentor) {
        Assessment assessment = new Assessment();
        assessment.setId(UUID.randomUUID());
        assessment.setTitle("Assessment");
        assessment.setType(AssessmentType.WEEKLY);
        assessment.setStatus(status);
        assessment.setMentor(mentor);
        return assessment;
    }

    private static ScorecardEntry entry(Assessment assessment, User candidate) {
        ScorecardEntry entry = new ScorecardEntry();
        entry.setId(UUID.randomUUID());
        entry.setAssessment(assessment);
        entry.setCandidate(candidate);
        return entry;
    }

    private static EntryRequest request(
            UUID candidateId,
            Integer attendance,
            Integer communication,
            Integer accountability,
            Integer creativity,
            Integer delivery,
            Integer techSkills) {
        return new EntryRequest(
                candidateId,
                attendance,
                communication,
                accountability,
                creativity,
                delivery,
                techSkills,
                "",
                "",
                "");
    }
}
