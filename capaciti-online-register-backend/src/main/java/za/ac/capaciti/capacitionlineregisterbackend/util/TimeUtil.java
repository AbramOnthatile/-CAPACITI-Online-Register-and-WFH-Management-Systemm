package za.ac.capaciti.capacitionlineregisterbackend.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

public final class TimeUtil {
    private TimeUtil() {
    }

    public static LocalDate today() {
        return LocalDate.now(ZoneId.systemDefault());
    }

    public static Instant now() {
        return Instant.now();
    }
}
