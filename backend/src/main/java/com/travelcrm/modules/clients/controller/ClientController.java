package com.travelcrm.modules.clients.controller;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.clients.dto.ClientRequest;
import com.travelcrm.modules.clients.dto.ClientResponse;
import com.travelcrm.modules.clients.service.ClientService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
public class ClientController {
    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ClientResponse>>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID managerId,
            Pageable pageable,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(clientService.findAll(search, status, managerId, pageable, currentUser)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientResponse>> findById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(clientService.findById(id, currentUser)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClientResponse>> create(
            @Valid @RequestBody ClientRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(clientService.create(request, currentUser)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClientResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody ClientRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(clientService.update(id, request, currentUser)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        clientService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
