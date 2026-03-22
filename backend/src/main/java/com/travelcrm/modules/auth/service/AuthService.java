package com.travelcrm.modules.auth.service;

import com.travelcrm.config.JwtConfig;
import com.travelcrm.modules.auth.UserRepository;
import com.travelcrm.modules.auth.dto.AuthResponse;
import com.travelcrm.modules.auth.dto.LoginRequest;
import com.travelcrm.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtConfig jwtConfig;

    public AuthResponse login(LoginRequest request) {
        var user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BadRequestException("Неверный email или пароль"));
        if (!user.isActive()) {
            throw new BadRequestException("Аккаунт деактивирован");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Неверный email или пароль");
        }
        String token = jwtConfig.generate(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getFullName(), user.getRole().name());
    }
}
