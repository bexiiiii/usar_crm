package com.travelcrm.modules.invoices.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class InvoiceRequest {
    private UUID clientId;
    private UUID bookingId;
    private String status = "DRAFT";

    @NotNull
    private BigDecimal amount;

    private BigDecimal taxPercent = BigDecimal.ZERO;
    private String currency = "USD";
    private LocalDate dueDate;
    private String notes;
    private List<Map<String, Object>> items;
}
