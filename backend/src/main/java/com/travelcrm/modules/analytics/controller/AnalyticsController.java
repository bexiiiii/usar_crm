package com.travelcrm.modules.analytics.controller;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.analytics.dto.AnalyticsDashboardResponse;
import com.travelcrm.modules.analytics.service.AnalyticsService;
import com.travelcrm.modules.bookings.dto.BookingResponse;
import com.travelcrm.modules.bookings.service.BookingService;
import com.travelcrm.shared.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','MANAGER')")
public class AnalyticsController {
    private final AnalyticsService analyticsService;
    private final BookingService bookingService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AnalyticsDashboardResponse>> getDashboard(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getDashboard(currentUser)));
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenue() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getMonthlyRevenue()));
    }

    @GetMapping("/top-destinations")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopDestinations(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getTopDestinations(limit)));
    }

    @GetMapping("/managers")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getManagers(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getManagersStats(currentUser)));
    }

    @GetMapping("/upcoming-departures")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getUpcomingDepartures(
            @RequestParam(defaultValue = "7") int days,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.findUpcomingDepartures(days, currentUser)));
    }
}
