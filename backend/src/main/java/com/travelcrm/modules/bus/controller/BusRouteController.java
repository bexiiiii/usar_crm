package com.travelcrm.modules.bus.controller;

import com.travelcrm.modules.bus.dto.BusRouteRequest;
import com.travelcrm.modules.bus.dto.BusRouteResponse;
import com.travelcrm.modules.bus.service.BusRouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/routes")
@RequiredArgsConstructor
public class BusRouteController {
    private final BusRouteService busRouteService;

    @GetMapping
    public ResponseEntity<List<BusRouteResponse>> getRoutesByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(busRouteService.getRoutesByDate(date));
    }

    @GetMapping("/bus/{busId}")
    public ResponseEntity<List<BusRouteResponse>> getRoutesByBus(@PathVariable UUID busId) {
        return ResponseEntity.ok(busRouteService.getRoutesByBus(busId));
    }

    @GetMapping("/bus/{busId}/date")
    public ResponseEntity<List<BusRouteResponse>> getRoutesByBusAndDate(
            @PathVariable UUID busId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(busRouteService.getRoutesByBusAndDate(busId, date));
    }

    @GetMapping("/driver/{driverId}/date")
    public ResponseEntity<List<BusRouteResponse>> getRoutesByDriver(
            @PathVariable UUID driverId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(busRouteService.getRoutesByDriver(driverId, date));
    }

    @GetMapping("/{routeId}")
    public ResponseEntity<BusRouteResponse> getRouteById(@PathVariable UUID routeId) {
        return ResponseEntity.ok(busRouteService.getRouteById(routeId));
    }

    @PostMapping
    public ResponseEntity<BusRouteResponse> createRoute(@RequestBody BusRouteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(busRouteService.createRoute(request));
    }

    @PutMapping("/{routeId}")
    public ResponseEntity<BusRouteResponse> updateRoute(@PathVariable UUID routeId, @RequestBody BusRouteRequest request) {
        return ResponseEntity.ok(busRouteService.updateRoute(routeId, request));
    }

    @DeleteMapping("/{routeId}")
    public ResponseEntity<Void> deleteRoute(@PathVariable UUID routeId) {
        busRouteService.deleteRoute(routeId);
        return ResponseEntity.noContent().build();
    }
}
