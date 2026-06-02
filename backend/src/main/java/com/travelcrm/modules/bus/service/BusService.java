package com.travelcrm.modules.bus.service;

import com.travelcrm.modules.bus.dto.BusResponse;
import com.travelcrm.modules.bus.entity.BusEntity;
import com.travelcrm.modules.bus.entity.BusType;
import com.travelcrm.modules.bus.mapper.BusMapper;
import com.travelcrm.modules.bus.repository.BusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BusService {
    private final BusRepository busRepository;
    private final BusMapper busMapper;

    public List<BusResponse> getAllBuses() {
        return busRepository.findAll().stream()
                .map(busMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<BusResponse> getBusesByType(BusType busType) {
        return busRepository.findByBusType(busType).stream()
                .map(busMapper::toResponse)
                .collect(Collectors.toList());
    }

    public BusResponse getBusById(UUID busId) {
        return busRepository.findById(busId)
                .map(busMapper::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Bus not found"));
    }

    @Transactional
    public BusResponse updateBusDriver(UUID busId, UUID driverId) {
        BusEntity bus = busRepository.findById(busId)
                .orElseThrow(() -> new IllegalArgumentException("Bus not found"));
        bus.setDriverId(driverId);
        busRepository.save(bus);
        return busMapper.toResponse(bus);
    }

    @Transactional
    public BusResponse clearBusDriver(UUID busId) {
        BusEntity bus = busRepository.findById(busId)
                .orElseThrow(() -> new IllegalArgumentException("Bus not found"));
        bus.setDriverId(null);
        busRepository.save(bus);
        return busMapper.toResponse(bus);
    }
}
