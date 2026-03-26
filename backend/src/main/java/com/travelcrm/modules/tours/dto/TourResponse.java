package com.travelcrm.modules.tours.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class TourResponse {
    private UUID id;
    private String name;
    private String description;
    private String country;
    private String resort;
    private String hotelName;
    private Integer hotelStars;
    private String tourOperator;
    private String category;
    private String departureCity;
    private int durationDays;
    private String mealPlan;
    private String transport;
    private BigDecimal priceNetto;
    private BigDecimal priceBrutto;
    private String currency;
    private Integer maxSeats;
    private int bookedSeats;
    private String status;
    private String imageUrl;
    private LocalDate departureDate;
    private LocalDate returnDate;
    private boolean visaRequired;
    private boolean insuranceIncluded;
    private String notes;
    private String locations;
    private String included;
    private String program;
    private String warnings;
    private String whatToBring;
    private String dressCode;
    private String transportNotes;
    private String mealInfo;
    private String departureDates;
    private String averageCheck;
    private Instant createdAt;
    private Instant updatedAt;
}
