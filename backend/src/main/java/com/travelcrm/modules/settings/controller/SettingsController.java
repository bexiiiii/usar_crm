package com.travelcrm.modules.settings.controller;

import com.travelcrm.modules.settings.dto.SettingsRequest;
import com.travelcrm.modules.settings.service.SettingsService;
import com.travelcrm.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN') or hasAuthority('manage_settings')")
public class SettingsController {
    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getAll()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> update(@RequestBody SettingsRequest request) {
        return ResponseEntity.ok(ApiResponse.success(settingsService.update(request)));
    }
}
