package com.travelcrm.modules.bus.dto;

import com.travelcrm.modules.bus.entity.BusType;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusResponse {
    private UUID id;
    private String busNumber;
    private BusType busType;
    private Integer capacity;
    private UUID driverId;
    private String driverName;
    private Instant createdAt;
    private Instant updatedAt;
}
