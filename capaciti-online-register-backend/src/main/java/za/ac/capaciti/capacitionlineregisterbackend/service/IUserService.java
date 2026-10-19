package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.CreateUserRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.UpdateUserRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.UpdateUserStatusRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.UserDto;
import za.ac.capaciti.capacitionlineregisterbackend.enums.Role;

public interface IUserService {

    UserDto create(CreateUserRequest request);

    UserDto update(UUID id, UpdateUserRequest request);

    UserDto setActive(UUID id, UpdateUserStatusRequest request);

    Page<UserDto> list(Role role, Boolean active, String text, Pageable pageable);

    UserDto getById(UUID id);

    UserDto getCurrent(String email);
}