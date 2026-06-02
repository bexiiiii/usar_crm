package com.travelcrm.modules.bus.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}
