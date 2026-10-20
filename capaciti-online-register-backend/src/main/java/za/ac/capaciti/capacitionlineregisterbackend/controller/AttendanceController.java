package za.ac.capaciti.capacitionlineregisterbackend.controller;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.AttendanceActionResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.AttendanceDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.ClockInRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.ClockOutRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.ExcuseRequest;
import za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;
import za.ac.capaciti.capacitionlineregisterbackend.service.IAttendanceService;

@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {

    private final IAttendanceService attendanceService;

    public AttendanceController(IAttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/clock-in")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<AttendanceActionResponse> clockIn(
            Authentication authentication,
            @Valid @RequestBody ClockInRequest request,
            HttpServletRequest http) {
        return ResponseEntity.ok(attendanceService.clockIn(authentication.getName(), request, http));
    }

    @PostMapping("/clock-out")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<AttendanceActionResponse> clockOut(
            Authentication authentication,
            @Valid @RequestBody ClockOutRequest request) {
        return ResponseEntity.ok(attendanceService.clockOut(authentication.getName(), request));
    }

    @GetMapping("/today")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<AttendanceDto> today(Authentication authentication) {
        return ResponseEntity.ok(attendanceService.today(authentication.getName()));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<Page<AttendanceDto>> mine(
            Authentication authentication,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(attendanceService.mine(authentication.getName(), pageable));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('TECH_CHAMP', 'ADMIN')")
    public ResponseEntity<Page<AttendanceDto>> search(
            @RequestParam(required = false) UUID userId,
            @RequestParam(name = "from", required = false) LocalDate from,
            @RequestParam(name = "to", required = false) LocalDate to,
            @RequestParam(required = false) WorkMode workMode,
            @RequestParam(required = false) ArrivalStatus arrivalStatus,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(attendanceService.search(userId, from, to, workMode, arrivalStatus, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TECH_CHAMP', 'ADMIN')")
    public ResponseEntity<AttendanceDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(attendanceService.getById(id));
    }

    @PatchMapping("/{id}/excuse")
    @PreAuthorize("hasAnyRole('TECH_CHAMP', 'ADMIN')")
    public ResponseEntity<AttendanceDto> excuse(
            @PathVariable UUID id,
            @Valid @RequestBody ExcuseRequest request,
            @AuthenticationPrincipal User actor) {
        return ResponseEntity.ok(attendanceService.excuse(id, request, actor));
    }
}