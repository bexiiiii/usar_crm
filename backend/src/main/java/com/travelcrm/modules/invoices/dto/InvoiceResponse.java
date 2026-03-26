package com.travelcrm.modules.invoices.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class InvoiceResponse {
    private UUID id;
    private String invoiceNumber;
    private UUID clientId;
    private String clientName;
    private UUID bookingId;
    private String bookingNumber;
    private String status;
    private BigDecimal amount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BigDecimal taxPercent;
    private String currency;
    private LocalDate dueDate;
    private Instant paidAt;
    private List<Map<String, Object>> items;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
