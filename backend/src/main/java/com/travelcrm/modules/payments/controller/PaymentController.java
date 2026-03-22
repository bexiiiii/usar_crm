package com.travelcrm.modules.payments.controller;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.payments.dto.PaymentRequest;
import com.travelcrm.modules.payments.dto.PaymentResponse;
import com.travelcrm.modules.payments.service.PaymentService;
import com.travelcrm.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
public class PaymentController {
    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> findByBooking(@RequestParam UUID bookingId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.findByBooking(bookingId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> create(
            @Valid @RequestBody PaymentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(paymentService.create(request, currentUser)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PaymentResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.updateStatus(id, body.get("status"))));
    }
}
