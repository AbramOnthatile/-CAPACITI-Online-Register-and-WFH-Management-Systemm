package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.WfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.CreateWfhRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.ReadinessDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhActionResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhDecisionRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.wfh.WfhRequestDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.enums.WfhStatus;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ConflictException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.WfhRequestMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.WfhRequestRepository;

@ExtendWith(MockitoExtension.class)
class WfhRequestServiceTest {
    @Mock
    private WfhRequestRepository wfhRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WfhRequestMapper wfhRequestMapper;

    @Mock
    private IQualityGateService qualityGateService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private WfhRequestService service;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("candidate@test.com");
        user.setFirstName("Jane");
        user.setLastName("Doe");
        user.setRole("CANDIDATE");
    }

    @Test
    void startDateInPastThrowsBadRequest() {
        when(userRepository.findByEmail("candidate@test.com")).thenReturn(Optional.of(user));
        CreateWfhRequest request = new CreateWfhRequest("draft-1", LocalDate.now().minusDays(1), LocalDate.now().plusDays(2), "Need time", new ReadinessDto(true, true, true, true));
        assertThrows(BadRequestException.class, () -> service.create("candidate@test.com", request));
    }

    @Test
    void endDateBeforeStartDateThrowsBadRequest() {
        when(userRepository.findByEmail("candidate@test.com")).thenReturn(Optional.of(user));
        CreateWfhRequest request = new CreateWfhRequest("draft-2", LocalDate.now().plusDays(5), LocalDate.now().plusDays(2), "Need time", new ReadinessDto(true, true, true, true));
        assertThrows(BadRequestException.class, () -> service.create("candidate@test.com", request));
    }

    @Test
    void moreThan10DaysThrowsBadRequest() {
        when(userRepository.findByEmail("candidate@test.com")).thenReturn(Optional.of(user));
        CreateWfhRequest request = new CreateWfhRequest("draft-3", LocalDate.now().plusDays(1), LocalDate.now().plusDays(12), "Need time", new ReadinessDto(true, true, true, true));
        assertThrows(BadRequestException.class, () -> service.create("candidate@test.com", request));
    }

    @Test
    void overlappingRequestThrowsConflict() {
        when(userRepository.findByEmail("candidate@test.com")).thenReturn(Optional.of(user));
        when(wfhRequestRepository.existsOverlapping(user, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3))).thenReturn(true);
        CreateWfhRequest request = new CreateWfhRequest("draft-4", LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), "Need time", new ReadinessDto(true, true, true, true));
        assertThrows(ConflictException.class, () -> service.create("candidate@test.com", request));
    }

    @Test
    void rejectedQualityReturnsNullRequestAndSavesNothing() {
        when(userRepository.findByEmail("candidate@test.com")).thenReturn(Optional.of(user));
        when(qualityGateService.check(eq(user), eq("WFH_REASON"), eq("draft-5"), eq("Need time"))).thenReturn(new QualityResult(false, false, "Rejected"));
        CreateWfhRequest request = new CreateWfhRequest("draft-5", LocalDate.now().plusDays(1), LocalDate.now().plusDays(2), "Need time", new ReadinessDto(true, true, true, true));
        WfhActionResponse response = service.create("candidate@test.com", request);
        assertNull(response.request());
        verify(wfhRequestRepository).existsOverlapping(user, request.startDate(), request.endDate());
    }

    @Test
    void acceptedRequestSavesPendingAndCopiesFlaggedValue() {
        when(userRepository.findByEmail("candidate@test.com")).thenReturn(Optional.of(user));
        when(wfhRequestRepository.existsOverlapping(user, LocalDate.now().plusDays(1), LocalDate.now().plusDays(2))).thenReturn(false);
        when(qualityGateService.check(eq(user), eq("WFH_REASON"), eq("draft-6"), eq("Need time"))).thenReturn(new QualityResult(true, true, "Accepted"));
        when(wfhRequestRepository.save(any(WfhRequest.class))).thenAnswer(invocation -> {
            WfhRequest entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });
        when(wfhRequestMapper.toDto(any(WfhRequest.class))).thenReturn(new WfhRequestDto(UUID.randomUUID(), user.getId(), "Jane Doe", LocalDate.now().plusDays(1), LocalDate.now().plusDays(2), "Need time", new ReadinessDto(true, true, true, true), WfhStatus.PENDING, null, null, null, true, null));

        WfhActionResponse response = service.create("candidate@test.com", new CreateWfhRequest("draft-6", LocalDate.now().plusDays(1), LocalDate.now().plusDays(2), "Need time", new ReadinessDto(true, true, true, true)));
        assertNotNull(response.request());
        assertEquals(WfhStatus.PENDING, response.request().status());
        assertEquals(true, response.request().aiQualityFlag());
    }

    @Test
    void decideNonPendingRequestThrowsConflict() {
        User reviewer = new User();
        reviewer.setEmail("manager@test.com");
        when(userRepository.findByEmail("manager@test.com")).thenReturn(Optional.of(reviewer));
        WfhRequest current = new WfhRequest();
        current.setStatus(WfhStatus.APPROVED);
        when(wfhRequestRepository.findById(any())).thenReturn(Optional.of(current));
        assertThrows(ConflictException.class, () -> service.decide(UUID.randomUUID(), new WfhDecisionRequest(true, "ok"), "manager@test.com"));
    }

    @Test
    void rejectingWithoutCommentThrowsBadRequest() {
        User reviewer = new User();
        reviewer.setEmail("manager@test.com");
        when(userRepository.findByEmail("manager@test.com")).thenReturn(Optional.of(reviewer));
        WfhRequest current = new WfhRequest();
        current.setStatus(WfhStatus.PENDING);
        when(wfhRequestRepository.findById(any())).thenReturn(Optional.of(current));
        assertThrows(BadRequestException.class, () -> service.decide(UUID.randomUUID(), new WfhDecisionRequest(false, "   "), "manager@test.com"));
    }

    @Test
    void approvingSetsStatusReviewerAndWritesAudit() {
        UUID id = UUID.randomUUID();
        User reviewer = new User();
        reviewer.setId(UUID.randomUUID());
        reviewer.setEmail("manager@test.com");
        when(userRepository.findByEmail("manager@test.com")).thenReturn(Optional.of(reviewer));
        WfhRequest current = WfhRequest.builder().user(user).status(WfhStatus.PENDING).startDate(LocalDate.now().plusDays(1)).endDate(LocalDate.now().plusDays(3)).reason("Need time").build();
        current.setId(id);
        when(wfhRequestRepository.findById(id)).thenReturn(Optional.of(current));
        when(wfhRequestRepository.save(any(WfhRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(wfhRequestMapper.toDto(any(WfhRequest.class))).thenReturn(new WfhRequestDto(id, user.getId(), "Jane Doe", LocalDate.now().plusDays(1), LocalDate.now().plusDays(3), "Need time", null, WfhStatus.APPROVED, "Manager", null, "ok", false, null));

        WfhRequestDto result = service.decide(id, new WfhDecisionRequest(true, "ok"), "manager@test.com");
        assertEquals(WfhStatus.APPROVED, result.status());
        verify(auditService).log(eq("WFH_APPROVED"), eq(id), eq("WfhRequest"), any(Map.class));
    }
}
