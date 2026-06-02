package com.travelcrm.modules.bookings.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class TourBookingExportResponse {
    private UUID bookingId;
    private String bookingNumber;
    private UUID tourId;
    private String tourName;
    private String status;
    private String type;
    private UUID clientId;
    private String clientName;
    private String clientPhone;
    private String clientEmail;
    private String passportNumber;
    private LocalDate passportExpiry;
    private LocalDate dateOfBirth;
    private String assignedManagerName;
    private String destination;
    private String country;
    private String departureCity;
    private String pickupLocation;
    private LocalDate departureDate;
    private LocalDate returnDate;
    private Integer totalTourists;
    private Integer paxAdults;
    private Integer paxChildren;
    private String hotelName;
    private String mealPlan;
    private String tourOperator;
    private String supplierRef;
    private BigDecimal totalPrice;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private String currency;
    private String notes;
    private String specialRequests;
}
