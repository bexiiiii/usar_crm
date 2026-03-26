package com.travelcrm.modules.tours.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TourRequest {
    @NotBlank
    private String name;

    private String description;

    @NotBlank
    private String country;

    private String resort;
    private String hotelName;
    private Integer hotelStars;
    private String tourOperator;

    @NotBlank
    private String category;

    private String departureCity;

    @NotNull
    private Integer durationDays;

    private String mealPlan;

    @NotBlank
    private String transport;

    @NotNull
    private BigDecimal priceNetto;

    @NotNull
    private BigDecimal priceBrutto;

    private String currency = "USD";
    private Integer maxSeats;
    private String status = "ACTIVE";
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
}
