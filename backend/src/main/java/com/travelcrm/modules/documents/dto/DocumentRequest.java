package com.travelcrm.modules.documents.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class DocumentRequest {
    private UUID bookingId;
    private UUID clientId;
    @NotBlank
    private String type; // CONTRACT, VOUCHER, INVOICE, PASSPORT_SCAN, VISA, INSURANCE, TICKET, OTHER
    @NotBlank
    private String fileName;
    private String filePath;
}
