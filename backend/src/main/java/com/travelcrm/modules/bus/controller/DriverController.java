package com.travelcrm.modules.bus.controller;

import com.travelcrm.modules.bus.dto.DriverRequest;
import com.travelcrm.modules.bus.dto.DriverResponse;
import com.travelcrm.modules.bus.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/drivers")
@RequiredArgsConstructor
public class DriverController {
    private final DriverService driverService;

    @GetMapping
    public ResponseEntity<List<DriverResponse>> getAllDrivers() {
        return ResponseEntity.ok(driverService.getAllDrivers());
    }

    @GetMapping("/active")
    public ResponseEntity<List<DriverResponse>> getActiveDrivers() {
        return ResponseEntity.ok(driverService.getActiveDrivers());
    }

    @GetMapping("/{driverId}")
    public ResponseEntity<DriverResponse> getDriverById(@PathVariable UUID driverId) {
        return ResponseEntity.ok(driverService.getDriverById(driverId));
    }

    @PostMapping
    public ResponseEntity<DriverResponse> createDriver(@RequestBody DriverRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(driverService.createDriver(request));
    }

    @PutMapping("/{driverId}")
    public ResponseEntity<DriverResponse> updateDriver(@PathVariable UUID driverId, @RequestBody DriverRequest request) {
        return ResponseEntity.ok(driverService.updateDriver(driverId, request));
    }

    @DeleteMapping("/{driverId}")
    public ResponseEntity<Void> deleteDriver(@PathVariable UUID driverId) {
        driverService.deleteDriver(driverId);
        return ResponseEntity.noContent().build();
    }
}
