package za.ac.capaciti.capacitionlineregisterbackend.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.UserDto;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.UserMapper;

class UserNameMappingTest {

    @Test
    void fullNameIsMappedToTheDto() {
        User user = new User();
        user.setFullName("Ada Lovelace");

        UserDto dto = new UserMapper().toDto(user);

        assertEquals("Ada Lovelace", dto.fullName());
    }

    @Test
    void fullNameIsTrimmedAndInnerWhitespaceCollapsed() {
        User user = new User();
        user.setFullName("  Ada   Lovelace ");

        assertEquals("Ada Lovelace", user.getFullName());
    }
}
