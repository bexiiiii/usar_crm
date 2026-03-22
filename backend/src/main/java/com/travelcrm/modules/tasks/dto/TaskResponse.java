package com.travelcrm.modules.tasks.dto;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class TaskResponse {
    private UUID id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private UUID assignedToId;
    private String assignedToName;
    private UUID relatedBookingId;
    private String relatedBookingNumber;
    private UUID relatedClientId;
    private String relatedClientName;
    private Instant dueDate;
    private Instant completedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
