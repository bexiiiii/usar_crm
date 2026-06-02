package com.travelcrm.modules.auth.dto;

import com.travelcrm.modules.auth.Role;
import lombok.Data;

import java.util.Map;

@Data
public class UpdateUserRequest {
    private String fullName;
    private Role role;
    private Boolean active;
    private Map<String, Boolean> permissions;
}
