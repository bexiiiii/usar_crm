package com.travelcrm.modules.clients.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class ClientRequest {
    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    private String email;

    @NotBlank
    private String phone;

    private String passportNumber;
    private LocalDate passportExpiry;
    private LocalDate dateOfBirth;
    private String status;
    private List<String> tags;
    private String preferences;
    private String source;
    private UUID assignedManagerId;
    private String notes;
}
