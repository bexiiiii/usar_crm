package com.travelcrm.modules.documents.controller;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.documents.dto.DocumentResponse;
import com.travelcrm.modules.documents.service.DocumentService;
import com.travelcrm.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
public class DocumentController {

    private final DocumentService documentService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DocumentResponse>>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "generatedAt"));
        return ResponseEntity.ok(ApiResponse.success(documentService.findAll(search, type, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(documentService.findById(id)));
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<DocumentResponse>> upload(
            @RequestPart MultipartFile file,
            @RequestParam(required = false) UUID bookingId,
            @RequestParam(required = false) UUID clientId,
            @RequestParam String type,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(documentService.upload(file, bookingId, clientId, type, currentUser)));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<DocumentResponse>> generate(
            @RequestParam UUID bookingId,
            @RequestParam String type,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(documentService.generate(bookingId, type, currentUser)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        documentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
