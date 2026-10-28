package za.ac.capaciti.capacitionlineregisterbackend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import za.ac.capaciti.capacitionlineregisterbackend.domain.AttendanceRecord;
import za.ac.capaciti.capacitionlineregisterbackend.domain.CampusHub;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.AttendanceActionResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.ClockInRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.common.QualityResult;
import za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.QualityContext;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ApiException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.AttendanceMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.AttendanceRecordRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.NotificationRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.WfhRequestRepository;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    private static final String EMAIL = "candidate1@example.com";
    // About 1 km from the campus below.
    private static final double FAR_LAT = -33.9159;
    private static final double FAR_LON = 18.4241;

    @Mock private AttendanceRecordRepository attendanceRecordRepository;
    @Mock private UserRepository userRepository;
    @Mock private WfhRequestRepository wfhRequestRepository;
    @Mock private AttendanceStatusEngine statusEngine;
    @Mock private IQualityGateService qualityGateService;
    @Mock private AuditService auditService;
    @Mock private NotificationRepository notificationRepository;
    @Mock private HttpServletRequest http;
    @Mock private IPromptGeneratorService promptGeneratorService;
    @Mock private IPromptService promptService;

    private AttendanceService service;
    private User user;
    private CampusHub campus;

    @BeforeEach
    void setUp() {
        service = new AttendanceService(
                attendanceRecordRepository, userRepository, wfhRequestRepository, statusEngine,
                new IpWhitelistService(""), new LocationVerificationService(), qualityGateService,
                new AttendanceMapper(), auditService, notificationRepository, promptGeneratorService, promptService);
        campus = CampusHub.builder().name("Campus").latitude(-33.9249).longitude(18.4241).radiusM(300)
                .whitelistedCidrs(List.of("196.0.0.0/24")).build();
        user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(EMAIL);
        user.setRole("CANDIDATE");
        user.setCampus(campus);
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user));
    }

    private void stubSave() {
        when(attendanceRecordRepository.findByUserAndAttendanceDate(eq(user), any())).thenReturn(Optional.empty());
        when(attendanceRecordRepository.saveAndFlush(any(AttendanceRecord.class))).thenAnswer(invocation -> {
            AttendanceRecord record = invocation.getArgument(0);
            record.setId(UUID.randomUUID());
            return record;
        });
    }

    @Test
    void onSitePassesByWhitelistedIpEvenWhenFarAway() {
        stubSave();
        when(statusEngine.arrivalStatusFor(any(Instant.class), eq(false))).thenReturn(ArrivalStatus.ON_TIME);
        when(http.getRemoteAddr()).thenReturn("196.0.0.10");

        AttendanceActionResponse response = service.clockIn(EMAIL,
                new ClockInRequest("d1", WorkMode.ON_SITE, null, FAR_LAT, FAR_LON, 10.0), http);

        assertTrue(response.attendance().ipVerified());
        assertFalse(response.attendance().geoVerified());
        assertEquals(ArrivalStatus.ON_TIME, response.attendance().arrivalStatus());
    }

    @Test
    void onSitePassesWithinRadiusFromAnyIp() {
        stubSave();
        when(statusEngine.arrivalStatusFor(any(Instant.class), eq(false))).thenReturn(ArrivalStatus.ON_TIME);
        when(http.getRemoteAddr()).thenReturn("41.1.1.1");

        AttendanceActionResponse response = service.clockIn(EMAIL,
                new ClockInRequest("d1", WorkMode.ON_SITE, null, -33.9250, 18.4242, 10.0), http);

        assertFalse(response.attendance().ipVerified());
        assertTrue(response.attendance().geoVerified());
        assertTrue(response.attendance().distanceM() < 300);
        verify(promptGeneratorService).generateOnClockIn(any(AttendanceRecord.class));
    }

    @Test
    void onSiteFailsWhenNeitherIpNorLocationMatch() {
        when(attendanceRecordRepository.findByUserAndAttendanceDate(eq(user), any())).thenReturn(Optional.empty());
        when(statusEngine.arrivalStatusFor(any(Instant.class), eq(false))).thenReturn(ArrivalStatus.ON_TIME);
        when(http.getRemoteAddr()).thenReturn("41.1.1.1");

        ApiException exception = assertThrows(ApiException.class, () -> service.clockIn(EMAIL,
                new ClockInRequest("d1", WorkMode.ON_SITE, null, FAR_LAT, FAR_LON, 10.0), http));

        assertEquals("LOCATION_NOT_VERIFIED", exception.getCode());
        verify(attendanceRecordRepository, never()).saveAndFlush(any());
    }

    @Test
    void wfhNeedsAnApprovedRequest() {
        when(attendanceRecordRepository.findByUserAndAttendanceDate(eq(user), any())).thenReturn(Optional.empty());
        when(statusEngine.arrivalStatusFor(any(Instant.class), eq(false))).thenReturn(ArrivalStatus.ON_TIME);
        when(wfhRequestRepository.findApprovedCoveringForUser(eq(user), any(LocalDate.class))).thenReturn(List.of());

        ApiException exception = assertThrows(ApiException.class, () -> service.clockIn(EMAIL,
                new ClockInRequest("d1", WorkMode.WFH, null, null, null, null), http));

        assertEquals("WFH_NOT_APPROVED", exception.getCode());
    }

    @Test
    void secondClockInIsAConflict() {
        AttendanceRecord existing = AttendanceRecord.builder().user(user).clockInAt(Instant.now()).build();
        when(attendanceRecordRepository.findByUserAndAttendanceDate(eq(user), any())).thenReturn(Optional.of(existing));

        ApiException exception = assertThrows(ApiException.class, () -> service.clockIn(EMAIL,
                new ClockInRequest("d1", WorkMode.ON_SITE, null, null, null, null), http));

        assertEquals("ALREADY_CLOCKED_IN", exception.getCode());
    }

    @Test
    void lateArrivalAsksForAReasonBeforeSaving() {
        when(attendanceRecordRepository.findByUserAndAttendanceDate(eq(user), any())).thenReturn(Optional.empty());
        when(statusEngine.arrivalStatusFor(any(Instant.class), eq(false))).thenReturn(ArrivalStatus.LATE_UNEXCUSED);
        when(statusEngine.requiresLateReason(ArrivalStatus.LATE_UNEXCUSED)).thenReturn(true);
        when(http.getRemoteAddr()).thenReturn("196.0.0.10");

        AttendanceActionResponse response = service.clockIn(EMAIL,
                new ClockInRequest("d1", WorkMode.ON_SITE, null, null, null, null), http);

        assertTrue(response.requiresReason());
        assertNull(response.attendance());
        verify(attendanceRecordRepository, never()).saveAndFlush(any());
    }

    @Test
    void flaggedLateReasonIsSavedWithTheFlag() {
        stubSave();
        when(statusEngine.arrivalStatusFor(any(Instant.class), eq(false))).thenReturn(ArrivalStatus.LATE_UNEXCUSED);
        when(statusEngine.requiresLateReason(ArrivalStatus.LATE_UNEXCUSED)).thenReturn(true);
        when(http.getRemoteAddr()).thenReturn("196.0.0.10");
        when(qualityGateService.check(user, QualityContext.LATE_REASON, "d1", "traffic"))
                .thenReturn(new QualityResult(true, false, "flagged", 3, true));

        AttendanceActionResponse response = service.clockIn(EMAIL,
                new ClockInRequest("d1", WorkMode.ON_SITE, "traffic", null, null, null), http);

        assertEquals(ArrivalStatus.LATE_UNEXCUSED, response.attendance().arrivalStatus());
        assertEquals("traffic", response.attendance().lateReason());
        assertTrue(response.attendance().aiQualityFlag());
    }
}
