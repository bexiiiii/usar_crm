package com.travelcrm.modules.clients.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class ClientResponse {
    private UUID id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String passportNumber;
    private LocalDate passportExpiry;
    private LocalDate dateOfBirth;
    private String status;
    private List<String> tags;
    private String preferences;
    private String source;
    private UUID assignedManagerId;
    private String assignedManagerName;
    private String notes;
    private int totalBookings;
    private BigDecimal totalRevenue;
    private Instant createdAt;
    private Instant updatedAt;
}
