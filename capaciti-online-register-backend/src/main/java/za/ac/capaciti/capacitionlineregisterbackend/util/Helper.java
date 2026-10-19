package za.ac.capaciti.capacitionlineregisterbackend.util;

import org.apache.commons.validator.routines.EmailValidator;

public final class Helper {

    private Helper() {}

    // Returns true if the object is null
    public static boolean isNull(Object obj) {
        return obj == null;
    }

    // Returns true if the string is null or empty after trimming
    public static boolean isNullOrEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }

    // Returns null when the string is null or blank, otherwise the trimmed string
    public static String trimToNull(String str) {
        return isNullOrEmpty(str) ? null : str.trim();
    }

    // Trims and lowercases an email, returns null when blank
    public static String normalizeEmail(String email) {
        return isNullOrEmpty(email) ? null : email.trim().toLowerCase();
    }

    // Returns true if the email is null, empty or not a valid format
    public static boolean isInvalidEmail(String email) {
        return isNullOrEmpty(email) || !EmailValidator.getInstance().isValid(email.trim());
    }

    // Returns true if the password is null, empty or shorter than 8 characters
    public static boolean isInvalidPassword(String password) {
        return isNullOrEmpty(password) || password.trim().length() < 8;
    }
}