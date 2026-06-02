package com.travelcrm.modules.notifications.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NotificationRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String body;

    private String type = "system";
}
