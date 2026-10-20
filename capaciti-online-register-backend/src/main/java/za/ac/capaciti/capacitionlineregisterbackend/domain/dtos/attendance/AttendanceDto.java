package za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.attendance;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.DepartureStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.WorkMode;

public record AttendanceDto(
        UUID id,
        UUID userId,
        String userName,
        LocalDate attendanceDate,
        WorkMode workMode,
        Instant clockInAt,
        Instant clockOutAt,
        ArrivalStatus arrivalStatus,
        DepartureStatus departureStatus,
        String lateReason,
        String earlyClockoutReason,
        String lateClockoutNote,
        String deliverableLink,
        Boolean ipVerified,
        Boolean geoVerified,
        Double distanceM,
        boolean aiQualityFlag) {
}