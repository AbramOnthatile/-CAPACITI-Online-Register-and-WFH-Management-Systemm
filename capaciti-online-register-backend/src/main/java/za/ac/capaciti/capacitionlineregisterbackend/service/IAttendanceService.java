package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.AttendanceActionResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.AttendanceDto;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.ClockInRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.ClockOutRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance.ExcuseRequest;
import za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;

public interface IAttendanceService {
    AttendanceActionResponse clockIn(String email, ClockInRequest request, HttpServletRequest http);
    AttendanceActionResponse clockOut(String email, ClockOutRequest request);
    AttendanceDto today(String email);
    Page<AttendanceDto> mine(String email, Pageable pageable);
    Page<AttendanceDto> search(UUID userId, LocalDate from, LocalDate to, WorkMode workMode,
                               ArrivalStatus arrivalStatus, Pageable pageable);
    AttendanceDto getById(UUID id);
    AttendanceDto excuse(UUID id, ExcuseRequest request, String actorEmail);
    int markAbsentForDate(LocalDate date);
    int notifyMissingClockOuts(LocalDate date);
}
