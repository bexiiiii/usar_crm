package com.travelcrm.modules.bus.controller;

import com.travelcrm.modules.bus.dto.BusResponse;
import com.travelcrm.modules.bus.entity.BusType;
import com.travelcrm.modules.bus.service.BusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/buses")
@RequiredArgsConstructor
public class BusController {
    private final BusService busService;

    @GetMapping
    public ResponseEntity<List<BusResponse>> getAllBuses() {
        return ResponseEntity.ok(busService.getAllBuses());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<BusResponse>> getBusesByType(@PathVariable String type) {
        BusType busType = BusType.valueOf(type.toUpperCase());
        return ResponseEntity.ok(busService.getBusesByType(busType));
    }

    @GetMapping("/{busId}")
    public ResponseEntity<BusResponse> getBusById(@PathVariable UUID busId) {
        return ResponseEntity.ok(busService.getBusById(busId));
    }

    @PutMapping("/{busId}/driver/{driverId}")
    public ResponseEntity<BusResponse> assignDriver(@PathVariable UUID busId, @PathVariable UUID driverId) {
        return ResponseEntity.ok(busService.updateBusDriver(busId, driverId));
    }

    @DeleteMapping("/{busId}/driver")
    public ResponseEntity<BusResponse> clearDriver(@PathVariable UUID busId) {
        return ResponseEntity.ok(busService.clearBusDriver(busId));
    }
}
