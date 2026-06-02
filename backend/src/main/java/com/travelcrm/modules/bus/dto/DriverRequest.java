package com.travelcrm.modules.bus.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverRequest {
    private String firstName;
    private String lastName;
    private String phoneNumber;
}
