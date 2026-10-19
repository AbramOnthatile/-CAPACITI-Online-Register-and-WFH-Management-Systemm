package za.ac.capaciti.capacitionlineregisterbackend.service;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.auth.LoginRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.auth.LoginResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.UserDto;

public interface IAuthService {

    LoginResponse login(LoginRequest request);

    UserDto me();
}