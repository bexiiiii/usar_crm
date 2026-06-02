package com.travelcrm.modules.bus.mapper;

import com.travelcrm.modules.bus.dto.BusResponse;
import com.travelcrm.modules.bus.entity.BusEntity;
import com.travelcrm.modules.bus.entity.DriverEntity;
import com.travelcrm.modules.bus.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BusMapper {
    private final DriverRepository driverRepository;

    public BusResponse toResponse(BusEntity entity) {
        String driverName = null;
        if (entity.getDriverId() != null) {
            driverName = driverRepository.findById(entity.getDriverId())
                    .map(d -> d.getFirstName() + " " + d.getLastName())
                    .orElse(null);
        }
        return BusResponse.builder()
                .id(entity.getId())
                .busNumber(entity.getBusNumber())
                .busType(entity.getBusType())
                .capacity(entity.getCapacity())
                .driverId(entity.getDriverId())
                .driverName(driverName)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
