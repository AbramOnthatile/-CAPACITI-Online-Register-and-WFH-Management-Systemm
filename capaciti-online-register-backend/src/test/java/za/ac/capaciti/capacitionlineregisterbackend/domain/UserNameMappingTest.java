package za.ac.capaciti.capacitionlineregisterbackend.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.UserDto;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.UserMapper;

class UserNameMappingTest {

    @Test
    void fullNameJoinsFirstAndLastNames() {
        User user = new User();
        user.setFirstName("Ada");
        user.setLastName("Lovelace");

        UserDto dto = new UserMapper().toDto(user);

        assertEquals("Ada Lovelace", dto.fullName());
    }

    @Test
    void fullNameDoesNotAddExtraWhitespaceWhenLastNameIsEmpty() {
        User user = new User();
        user.setFirstName("Ada");
        user.setLastName("");

        assertEquals("Ada", user.getFullName());
    }
}
