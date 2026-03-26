package com.travelcrm.modules.documents.dto;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class DocumentResponse {
    private UUID id;
    private UUID bookingId;
    private String bookingNumber;
    private UUID clientId;
    private String clientName;
    private String type;
    private String fileName;
    private String filePath;
    private Instant generatedAt;
    private UUID generatedById;
    private String generatedByName;
}
