package com.travelcrm.modules.bus.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusRouteRequest {
    private UUID busId;
    private String routeName;
    private UUID driverId;
    private LocalTime startTime;
    private LocalTime endTime;
    private LocalDate routeDate;
}
