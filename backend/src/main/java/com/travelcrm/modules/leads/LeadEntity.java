package com.travelcrm.modules.leads;

import com.travelcrm.modules.auth.UserEntity;
import com.travelcrm.modules.clients.ClientEntity;
import com.travelcrm.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "leads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadEntity extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private ClientEntity client;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String stage = "NEW";

    private String source;
    private String destination;

    @Column(name = "travel_dates_from")
    private LocalDate travelDatesFrom;

    @Column(name = "travel_dates_to")
    private LocalDate travelDatesTo;

    @Column(name = "pax_adults")
    private int paxAdults = 1;

    @Column(name = "pax_children")
    private int paxChildren = 0;

    @Column(name = "budget_min")
    private BigDecimal budgetMin;

    @Column(name = "budget_max")
    private BigDecimal budgetMax;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_manager_id")
    private UserEntity assignedManager;

    @Column(name = "lost_reason")
    private String lostReason;

    private int probability = 50;

    @Column(name = "expected_close_date")
    private LocalDate expectedCloseDate;

    private String notes;
}
