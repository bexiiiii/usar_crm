package com.travelcrm.modules.leads.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class LeadResponse {
    private UUID id;
    private UUID clientId;
    private String clientName;
    private String title;
    private String stage;
    private String source;
    private String destination;
    private LocalDate travelDatesFrom;
    private LocalDate travelDatesTo;
    private int paxAdults;
    private int paxChildren;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private UUID assignedManagerId;
    private String assignedManagerName;
    private String lostReason;
    private int probability;
    private LocalDate expectedCloseDate;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
