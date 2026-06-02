package com.travelcrm.modules.bus.service;

import com.travelcrm.modules.bus.dto.DriverRequest;
import com.travelcrm.modules.bus.dto.DriverResponse;
import com.travelcrm.modules.bus.entity.DriverEntity;
import com.travelcrm.modules.bus.mapper.DriverMapper;
import com.travelcrm.modules.bus.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DriverService {
    private final DriverRepository driverRepository;
    private final DriverMapper driverMapper;

    public List<DriverResponse> getAllDrivers() {
        return driverRepository.findAll().stream()
                .map(driverMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<DriverResponse> getActiveDrivers() {
        return driverRepository.findByIsActive(true).stream()
                .map(driverMapper::toResponse)
                .collect(Collectors.toList());
    }

    public DriverResponse getDriverById(UUID driverId) {
        return driverRepository.findById(driverId)
                .map(driverMapper::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found"));
    }

    @Transactional
    public DriverResponse createDriver(DriverRequest request) {
        DriverEntity driver = DriverEntity.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .isActive(true)
                .build();
        driverRepository.save(driver);
        return driverMapper.toResponse(driver);
    }

    @Transactional
    public DriverResponse updateDriver(UUID driverId, DriverRequest request) {
        DriverEntity driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found"));
        driver.setFirstName(request.getFirstName());
        driver.setLastName(request.getLastName());
        driver.setPhoneNumber(request.getPhoneNumber());
        driverRepository.save(driver);
        return driverMapper.toResponse(driver);
    }

    @Transactional
    public void deleteDriver(UUID driverId) {
        DriverEntity driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found"));
        driver.setIsActive(false);
        driverRepository.save(driver);
    }
}
