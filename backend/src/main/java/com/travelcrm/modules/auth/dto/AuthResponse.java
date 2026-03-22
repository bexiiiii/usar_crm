package com.travelcrm.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UUID id;
    private String email;
    private String fullName;
    private String role;
}
