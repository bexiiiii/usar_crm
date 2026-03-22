package com.travelcrm.modules.leads.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class LeadRequest {
    private UUID clientId;

    @NotBlank
    private String title;

    private String stage;
    private String source;
    private String destination;
    private LocalDate travelDatesFrom;
    private LocalDate travelDatesTo;
    private int paxAdults = 1;
    private int paxChildren = 0;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private UUID assignedManagerId;
    private String lostReason;
    private int probability = 50;
    private LocalDate expectedCloseDate;
    private String notes;
}
