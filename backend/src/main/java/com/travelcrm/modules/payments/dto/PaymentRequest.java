package com.travelcrm.modules.payments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class PaymentRequest {
    @NotNull
    private UUID bookingId;

    @NotNull
    private UUID clientId;

    @NotNull
    private BigDecimal amount;

    private String currency = "USD";

    @NotBlank
    private String type;

    @NotBlank
    private String direction;

    private String method;
    private String status;
    private Instant paidAt;
    private LocalDate dueDate;
    private String reference;
    private String notes;
}
