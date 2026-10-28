package za.ac.capaciti.capacitionlineregisterbackend.service;

import java.util.Locale;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import za.ac.capaciti.capacitionlineregisterbackend.domain.CampusHub;
import za.ac.capaciti.capacitionlineregisterbackend.domain.User;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.CreateUserRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.UpdateUserRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.UpdateUserStatusRequest;
import za.ac.capaciti.capacitionlineregisterbackend.domain.dtos.user.UserDto;
import za.ac.capaciti.capacitionlineregisterbackend.enums.UserRole;
import za.ac.capaciti.capacitionlineregisterbackend.exception.BadRequestException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ConflictException;
import za.ac.capaciti.capacitionlineregisterbackend.exception.ResourceNotFoundException;
import za.ac.capaciti.capacitionlineregisterbackend.mappers.UserMapper;
import za.ac.capaciti.capacitionlineregisterbackend.repository.CampusHubRepository;
import za.ac.capaciti.capacitionlineregisterbackend.repository.UserRepository;

@Service
@Transactional
public class UserService implements IUserService {

    private final UserRepository userRepository;
    private final CampusHubRepository campusHubRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            CampusHubRepository campusHubRepository,
            UserMapper userMapper,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.campusHubRepository = campusHubRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDto create(CreateUserRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("EMAIL_ALREADY_EXISTS", "An account with this email already exists.");
        }

        String[] name = splitFullName(request.fullName());
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.temporaryPassword()));
        user.setFirstName(name[0]);
        user.setLastName(name[1]);
        user.setRole(request.role().name());
        user.setWorkMode(request.defaultMode());
        user.setCampus(resolveCampus(request.campusId()));
        user.setChampion(resolveChampion(request.championId()));
        user.setActive(true);
        return userMapper.toDto(userRepository.save(user));
    }

    @Override
    public UserDto update(UUID id, UpdateUserRequest request) {
        User user = findUser(id);
        String[] name = splitFullName(request.fullName());
        user.setFirstName(name[0]);
        user.setLastName(name[1]);
        user.setWorkMode(request.defaultMode());
        user.setCampus(resolveCampus(request.campusId()));
        user.setChampion(resolveChampion(request.championId()));
        user.setRole(request.role().name());
        return userMapper.toDto(userRepository.save(user));
    }

    @Override
    public UserDto setActive(UUID id, UpdateUserStatusRequest request) {
        User user = findUser(id);
        user.setActive(request.active());
        return userMapper.toDto(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserDto> list(UserRole role, Boolean active, String text, Pageable pageable) {
        String query = text == null || text.isBlank() ? null : text.trim();
        return userRepository.searchUsers(role == null ? null : role.name(), active, query, pageable)
                .map(userMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getById(UUID id) {
        return userMapper.toDto(findUser(id));
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrent(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User account was not found."));
        return userMapper.toDto(user);
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User account was not found."));
    }

    private CampusHub resolveCampus(UUID campusId) {
        if (campusId == null) return null;
        return campusHubRepository.findById(campusId)
                .orElseThrow(() -> new ResourceNotFoundException("Campus was not found."));
    }

    private User resolveChampion(UUID championId) {
        if (championId == null) return null;
        User champion = findUser(championId);
        if (!UserRole.TECH_CHAMP.name().equals(champion.getRole())) {
            throw new BadRequestException("The selected champion account does not have the Tech Champion role.");
        }
        return champion;
    }

    private String[] splitFullName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            throw new BadRequestException("Full name is required.");
        }
        String[] parts = fullName.trim().split("\\s+", 2);
        return new String[] { parts[0], parts.length > 1 ? parts[1] : "" };
    }
}
