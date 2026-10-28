package za.ac.capaciti.capacitionlineregisterbackend.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.DayOfWeek;

public final class TimeUtil {

    private static final ZoneId ZONE = ZoneId.of("Africa/Johannesburg");

    private TimeUtil() {}

    public static LocalTime toLocalTime(Instant instant) {
        return instant.atZone(ZONE).toLocalTime();
    }

    public static LocalDate today() {
        return now().toLocalDate();
    }

    public static ZonedDateTime now() {
        return ZonedDateTime.now(ZONE);
    }

    public static boolean isWeekday(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY;
    }

    public static Instant toInstant(LocalDate date, LocalTime time) {
        return date.atTime(time).atZone(ZONE).toInstant();
    }
}
