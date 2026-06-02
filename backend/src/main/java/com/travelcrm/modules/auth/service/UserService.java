package com.travelcrm.modules.auth.service;

import com.travelcrm.modules.auth.Role;
import com.travelcrm.modules.auth.UserEntity;
import com.travelcrm.modules.auth.UserRepository;
import com.travelcrm.modules.auth.UserPermissions;
import com.travelcrm.modules.auth.dto.CreateUserRequest;
import com.travelcrm.modules.auth.dto.UpdateUserRequest;
import com.travelcrm.modules.auth.dto.UserResponse;
import com.travelcrm.shared.exception.BadRequestException;
import com.travelcrm.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Page<UserResponse> findAll(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    public UserResponse findById(UUID id) {
        return toResponse(userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Пользователь не найден")));
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email уже используется");
        }
        Role role = request.getRole() != null ? request.getRole() : Role.MANAGER;
        UserEntity user = UserEntity.builder()
            .email(request.getEmail())
            .fullName(request.getFullName())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .role(role)
            .permissions(new HashMap<>(UserPermissions.resolve(role, request.getPermissions())))
            .active(true)
            .build();
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest request) {
        UserEntity user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getRole() != null) user.setRole(request.getRole());
        if (request.getActive() != null) user.setActive(request.getActive());
        if (request.getRole() != null || request.getPermissions() != null) {
            user.setPermissions(new HashMap<>(UserPermissions.resolve(
                user.getRole(),
                request.getPermissions() != null ? request.getPermissions() : user.getPermissions()
            )));
        }
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateRole(UUID id, Role role) {
        UserEntity user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
        user.setRole(role);
        user.setPermissions(new HashMap<>(UserPermissions.resolve(role, user.getPermissions())));
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse deactivate(UUID id) {
        UserEntity user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
        user.setActive(false);
        return toResponse(userRepository.save(user));
    }

    private UserResponse toResponse(UserEntity u) {
        return new UserResponse(
            u.getId(),
            u.getEmail(),
            u.getFullName(),
            u.getRole().name(),
            new HashMap<>(UserPermissions.resolve(u.getRole(), u.getPermissions())),
            u.isActive(),
            u.getCreatedAt(),
            0
        );
    }
}
