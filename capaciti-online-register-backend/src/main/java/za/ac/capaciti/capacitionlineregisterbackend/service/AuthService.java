package za.ac.capaciti.capacitionlineregisterbackend.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.auth.LoginRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.auth.LoginResponse;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.UserDto;
import za.ac.capaciti.capacitionlineregisterbackend.exception.AuthenticationFailedException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ResourceNotFoundException;

@Service
@Transactional(readOnly = true)
public class AuthService implements IAuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final IUserService userService;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            IUserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            request.email().trim(),
                            request.password()));
        } catch (AuthenticationException exception) {
            throw new AuthenticationFailedException();
        }

        if (!(authentication.getPrincipal() instanceof UserDetails userDetails)) {
            throw new AuthenticationServiceException("Authentication did not return user details.");
        }

        String token = jwtService.generateToken(userDetails);
        return new LoginResponse(
                token,
                jwtService.extractExpiration(token),
                userService.getCurrent(userDetails.getUsername()));
    }

    @Override
    public UserDto me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AuthenticationFailedException();
        }
        try {
            return userService.getCurrent(authentication.getName());
        } catch (ResourceNotFoundException exception) {
            throw new AuthenticationFailedException();
        }
    }
}
