package za.ac.capaciti.capacitionlineregisterbackend.mappers;

import org.springframework.stereotype.Component;

import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.UserDto;

@Component
public class UserMapper {

    public UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getDefaultMode(),
                user.getCampus() == null ? null : user.getCampus().getId(),
                user.getCampus() == null ? null : user.getCampus().getName(),
                user.getChampion() == null ? null : user.getChampion().getId(),
                user.isActive(),
                user.getCreatedAt());
    }
}