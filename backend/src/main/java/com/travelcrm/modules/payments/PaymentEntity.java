package com.travelcrm.modules.payments;

import com.travelcrm.modules.auth.UserEntity;
import com.travelcrm.modules.bookings.BookingEntity;
import com.travelcrm.modules.clients.ClientEntity;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class PaymentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private BookingEntity booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private ClientEntity client;

    @Column(nullable = false)
    private BigDecimal amount;

    private String currency = "USD";

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String direction;

    private String method;

    private String status = "PENDING";

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "due_date")
    private LocalDate dueDate;

    private String reference;

    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private UserEntity createdBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
