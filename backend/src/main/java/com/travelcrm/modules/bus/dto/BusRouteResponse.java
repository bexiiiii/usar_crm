package com.travelcrm.modules.bus.dto;

import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusRouteResponse {
    private UUID id;
    private UUID busId;
    private String busNumber;
    private String routeName;
    private UUID driverId;
    private String driverName;
    private LocalTime startTime;
    private LocalTime endTime;
    private LocalDate routeDate;
    private Instant createdAt;
    private Instant updatedAt;
}
