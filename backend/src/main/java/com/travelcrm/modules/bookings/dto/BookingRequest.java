package com.travelcrm.modules.bookings.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class BookingRequest {
    private UUID leadId;

    @NotNull
    private UUID clientId;

    private UUID assignedManagerId;
    private String status;

    @NotBlank
    private String type;

    @NotBlank
    private String destination;

    private String country;
    private String departureCity;

    @NotNull
    private LocalDate departureDate;

    private LocalDate returnDate;
    private int paxAdults = 1;
    private int paxChildren = 0;
    private String hotelName;
    private Integer hotelStars;
    private String mealPlan;
    private String flightNumber;
    private String tourOperator;
    private String supplierRef;

    @NotNull
    private BigDecimal totalPrice;

    private BigDecimal costPrice;
    private String currency = "USD";
    private LocalDate supplierPaymentDeadline;
    private boolean supplierPaid;
    private String notes;
    private String specialRequests;
}
