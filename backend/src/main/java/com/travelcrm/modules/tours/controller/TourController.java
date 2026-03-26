package com.travelcrm.modules.tours.controller;

import com.travelcrm.modules.tours.dto.TourRequest;
import com.travelcrm.modules.tours.dto.TourResponse;
import com.travelcrm.modules.tours.service.TourService;
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
@RequestMapping("/api/tours")
@RequiredArgsConstructor
public class TourController {

    private final TourService tourService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TourResponse>>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String dir) {

        Sort.Direction direction = dir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(direction, sort));
        return ResponseEntity.ok(ApiResponse.success(tourService.findAll(search, status, category, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TourResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(tourService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TourResponse>> create(@Valid @RequestBody TourRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(tourService.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TourResponse>> update(@PathVariable UUID id,
                                                             @Valid @RequestBody TourRequest req) {
        return ResponseEntity.ok(ApiResponse.success(tourService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        tourService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
