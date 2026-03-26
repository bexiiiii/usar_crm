package com.travelcrm.modules.bookings.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class BookingResponse {
    private UUID id;
    private String bookingNumber;
    private UUID tourId;
    private String tourName;
    private UUID clientId;
    private String clientName;
    private UUID assignedManagerId;
    private String assignedManagerName;
    private String status;
    private String type;
    private String destination;
    private String country;
    private String departureCity;
    private LocalDate departureDate;
    private LocalDate returnDate;
    private int paxAdults;
    private int paxChildren;
    private String hotelName;
    private Integer hotelStars;
    private String mealPlan;
    private String flightNumber;
    private String tourOperator;
    private String supplierRef;
    private BigDecimal totalPrice;
    private BigDecimal costPrice;
    private BigDecimal margin;
    private String currency;
    private LocalDate supplierPaymentDeadline;
    private boolean supplierPaid;
    private String notes;
    private String specialRequests;
    private Instant createdAt;
    private Instant updatedAt;
}
