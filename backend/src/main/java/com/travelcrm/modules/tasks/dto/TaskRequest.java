package com.travelcrm.modules.tasks.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class TaskRequest {
    @NotBlank
    private String title;

    private String description;
    private String status;
    private String priority;
    private UUID assignedTo;
    private UUID relatedBookingId;
    private UUID relatedClientId;
    private UUID relatedLeadId;
    private Instant dueDate;
}
