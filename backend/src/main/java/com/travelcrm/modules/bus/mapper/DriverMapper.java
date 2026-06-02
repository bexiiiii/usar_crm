package com.travelcrm.modules.bus.mapper;

import com.travelcrm.modules.bus.dto.DriverResponse;
import com.travelcrm.modules.bus.entity.DriverEntity;
import org.springframework.stereotype.Component;

@Component
public class DriverMapper {
    public DriverResponse toResponse(DriverEntity entity) {
        return DriverResponse.builder()
                .id(entity.getId())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .phoneNumber(entity.getPhoneNumber())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
