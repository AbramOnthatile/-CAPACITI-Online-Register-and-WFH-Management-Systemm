package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.time.Instant;
import java.time.LocalTime;

import org.springframework.stereotype.Component;

import za.ac.capaciti.capacitionlineregisterbackend.enums.ArrivalStatus;
import za.ac.capaciti.capacitionlineregisterbackend.enums.DepartureStatus;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.util.TimeUtil;

@Component
public class AttendanceStatusEngine {

    private static final LocalTime CLOCK_IN_OPENS = LocalTime.of(8, 45);
    private static final LocalTime ON_TIME_UNTIL = LocalTime.of(9, 15);
    private static final LocalTime CLOCK_OUT_OPENS = LocalTime.of(16, 0);
    private static final LocalTime CLOCK_OUT_ON_TIME_UNTIL = LocalTime.of(16, 20);

    public ArrivalStatus arrivalStatusFor(Instant clockIn, boolean excused) {
        LocalTime localTime = TimeUtil.toLocalTime(clockIn);
        if (localTime.isBefore(CLOCK_IN_OPENS)) {
            throw new BadRequestException("Clock-in opens at 08:45");
        }
        if (!localTime.isAfter(ON_TIME_UNTIL)) {
            return ArrivalStatus.ON_TIME;
        }
        return excused ? ArrivalStatus.LATE_EXCUSED : ArrivalStatus.LATE_UNEXCUSED;
    }

    // Presentation accounts may clock in at any hour; before 08:45 counts as on time.
    public ArrivalStatus arrivalStatusAtAnyHour(Instant clockIn) {
        if (TimeUtil.toLocalTime(clockIn).isBefore(CLOCK_IN_OPENS)) {
            return ArrivalStatus.ON_TIME;
        }
        return arrivalStatusFor(clockIn, false);
    }

    public DepartureStatus departureStatusFor(Instant clockOut) {
        LocalTime localTime = TimeUtil.toLocalTime(clockOut);
        if (localTime.isBefore(CLOCK_OUT_OPENS)) {
            return DepartureStatus.PARTIAL_DAY;
        }
        if (!localTime.isAfter(CLOCK_OUT_ON_TIME_UNTIL)) {
            return DepartureStatus.ON_TIME;
        }
        return DepartureStatus.LATE_CLOCKOUT;
    }

    public boolean requiresLateReason(ArrivalStatus status) {
        return status == ArrivalStatus.LATE_UNEXCUSED || status == ArrivalStatus.LATE_EXCUSED;
    }

    public boolean requiresClockOutText(DepartureStatus status) {
        return status == DepartureStatus.PARTIAL_DAY || status == DepartureStatus.LATE_CLOCKOUT;
    }
}