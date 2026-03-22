package com.travelcrm.modules.leads.controller;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.leads.dto.LeadRequest;
import com.travelcrm.modules.leads.dto.LeadResponse;
import com.travelcrm.modules.leads.service.LeadService;
import com.travelcrm.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
public class LeadController {
    private final LeadService leadService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<LeadResponse>>> findAll(
            @RequestParam(required = false) String stage,
            @RequestParam(required = false) UUID managerId,
            Pageable pageable,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(leadService.findAll(stage, managerId, pageable, currentUser)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LeadResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(leadService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LeadResponse>> create(
            @Valid @RequestBody LeadRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(leadService.create(request, currentUser)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LeadResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody LeadRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(leadService.update(id, request, currentUser)));
    }

    @PatchMapping("/{id}/stage")
    public ResponseEntity<ApiResponse<LeadResponse>> updateStage(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(leadService.updateStage(id, body.get("stage"))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        leadService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
