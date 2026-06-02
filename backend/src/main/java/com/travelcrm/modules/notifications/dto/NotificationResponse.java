package com.travelcrm.modules.notifications.dto;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class NotificationResponse {
    private UUID id;
    private String type;
    private String title;
    private String body;
    private boolean read;
    private Instant readAt;
    private Instant createdAt;
    private UUID recipientId;
    private String recipientName;
    private UUID createdById;
    private String createdByName;
}
