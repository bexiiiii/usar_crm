package com.travelcrm.modules.tours;

import com.travelcrm.modules.auth.UserEntity;
import com.travelcrm.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tours")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourEntity extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String country;

    private String resort;

    @Column(name = "hotel_name")
    private String hotelName;

    @Column(name = "hotel_stars")
    private Integer hotelStars;

    @Column(name = "tour_operator")
    private String tourOperator;

    @Column(nullable = false)
    private String category = "BEACH";

    @Column(name = "departure_city")
    private String departureCity;

    @Column(name = "duration_days", nullable = false)
    private int durationDays = 7;

    @Column(name = "meal_plan")
    private String mealPlan;

    @Column(nullable = false)
    private String transport = "AIR";

    @Column(name = "price_netto", nullable = false)
    private BigDecimal priceNetto = BigDecimal.ZERO;

    @Column(name = "price_brutto", nullable = false)
    private BigDecimal priceBrutto = BigDecimal.ZERO;

    @Column(nullable = false)
    private String currency = "USD";

    @Column(name = "max_seats")
    private Integer maxSeats;

    @Column(name = "booked_seats", nullable = false)
    private int bookedSeats = 0;

    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "departure_date")
    private LocalDate departureDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Column(name = "visa_required", nullable = false)
    private boolean visaRequired = false;

    @Column(name = "insurance_included", nullable = false)
    private boolean insuranceIncluded = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String locations;

    @Column(columnDefinition = "TEXT")
    private String included;

    @Column(columnDefinition = "TEXT")
    private String program;

    @Column(columnDefinition = "TEXT")
    private String warnings;

    @Column(name = "what_to_bring", columnDefinition = "TEXT")
    private String whatToBring;

    @Column(name = "dress_code", columnDefinition = "TEXT")
    private String dressCode;

    @Column(name = "transport_notes", columnDefinition = "TEXT")
    private String transportNotes;

    @Column(name = "meal_info", columnDefinition = "TEXT")
    private String mealInfo;

    @Column(name = "departure_dates", columnDefinition = "TEXT")
    private String departureDates;

    @Column(name = "average_check")
    private String averageCheck;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private UserEntity createdBy;
}
