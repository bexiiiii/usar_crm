package com.travelcrm.modules.bookings;

import com.travelcrm.modules.auth.UserEntity;
import com.travelcrm.modules.clients.ClientEntity;
import com.travelcrm.modules.leads.LeadEntity;
import com.travelcrm.modules.tours.TourEntity;
import com.travelcrm.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingEntity extends BaseEntity {
    @Column(name = "booking_number", unique = true, nullable = false)
    private String bookingNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tour_id")
    private TourEntity tour;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    private LeadEntity lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientEntity client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_manager_id")
    private UserEntity assignedManager;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String destination;

    private String country;

    @Column(name = "departure_city")
    private String departureCity;

    @Column(name = "departure_date", nullable = false)
    private LocalDate departureDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Column(name = "pax_adults")
    private int paxAdults = 1;

    @Column(name = "pax_children")
    private int paxChildren = 0;

    @Column(name = "hotel_name")
    private String hotelName;

    @Column(name = "hotel_stars")
    private Integer hotelStars;

    @Column(name = "meal_plan")
    private String mealPlan;

    @Column(name = "flight_number")
    private String flightNumber;

    @Column(name = "tour_operator")
    private String tourOperator;

    @Column(name = "supplier_ref")
    private String supplierRef;

    @Column(name = "total_price", nullable = false)
    private BigDecimal totalPrice;

    @Column(name = "cost_price")
    private BigDecimal costPrice;

    private String currency = "USD";

    @Column(name = "supplier_payment_deadline")
    private LocalDate supplierPaymentDeadline;

    @Column(name = "supplier_paid")
    private boolean supplierPaid = false;

    private String notes;

    @Column(name = "special_requests")
    private String specialRequests;
}
