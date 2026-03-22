package com.travelcrm.modules.payments.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class PaymentResponse {
    private UUID id;
    private UUID bookingId;
    private String bookingNumber;
    private UUID clientId;
    private String clientName;
    private BigDecimal amount;
    private String currency;
    private String type;
    private String direction;
    private String method;
    private String status;
    private Instant paidAt;
    private LocalDate dueDate;
    private String reference;
    private String notes;
    private Instant createdAt;
}
