package za.ac.capaciti.capacitionlineregisterbackend.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

public final class TimeUtil {

    private static final ZoneId ZONE = ZoneId.of("Africa/Johannesburg");

    private TimeUtil() {}

    public static LocalTime toLocalTime(Instant instant) {
        return instant.atZone(ZONE).toLocalTime();
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }
}
