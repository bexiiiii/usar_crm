package com.travelcrm.modules.bus.mapper;

import com.travelcrm.modules.bus.dto.BusRouteResponse;
import com.travelcrm.modules.bus.entity.BusRouteEntity;
import com.travelcrm.modules.bus.repository.BusRepository;
import com.travelcrm.modules.bus.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BusRouteMapper {
    private final BusRepository busRepository;
    private final DriverRepository driverRepository;

    public BusRouteResponse toResponse(BusRouteEntity entity) {
        String busNumber = busRepository.findById(entity.getBusId())
                .map(BusRouteEntity::getId)
                .orElse(null) != null ? busRepository.findById(entity.getBusId())
                .map(b -> b.getBusNumber())
                .orElse(null) : null;

        String driverName = null;
        if (entity.getDriverId() != null) {
            driverName = driverRepository.findById(entity.getDriverId())
                    .map(d -> d.getFirstName() + " " + d.getLastName())
                    .orElse(null);
        }

        return BusRouteResponse.builder()
                .id(entity.getId())
                .busId(entity.getBusId())
                .busNumber(busNumber)
                .routeName(entity.getRouteName())
                .driverId(entity.getDriverId())
                .driverName(driverName)
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .routeDate(entity.getRouteDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
