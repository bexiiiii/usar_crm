package com.travelcrm.modules.invoices.controller;

import com.travelcrm.modules.invoices.dto.InvoiceRequest;
import com.travelcrm.modules.invoices.dto.InvoiceResponse;
import com.travelcrm.modules.invoices.dto.InvoiceStatsResponse;
import com.travelcrm.modules.invoices.service.InvoiceService;
import com.travelcrm.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.success(invoiceService.findAll(search, status, pageable)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<InvoiceStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getStats()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InvoiceResponse>> create(@Valid @RequestBody InvoiceRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(invoiceService.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> update(@PathVariable UUID id,
                                                                @Valid @RequestBody InvoiceRequest req) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.update(id, req)));
    }

    @PatchMapping("/{id}/send")
    public ResponseEntity<ApiResponse<InvoiceResponse>> send(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.send(id)));
    }

    @PatchMapping("/{id}/paid")
    public ResponseEntity<ApiResponse<InvoiceResponse>> markPaid(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.markPaid(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        invoiceService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
