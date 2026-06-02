package com.travelcrm.modules.bus.dto;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusRequest {
    private String busNumber;
    private String busType;
    private Integer capacity;
    private UUID driverId;
}
