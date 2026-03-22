package com.travelcrm.modules.payments;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<PaymentEntity, UUID> {
    List<PaymentEntity> findByBookingId(UUID bookingId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PaymentEntity p WHERE p.booking.id = :bookingId AND p.direction = 'INCOMING' AND p.status = 'COMPLETED'")
    BigDecimal sumPaidByBooking(@Param("bookingId") UUID bookingId);
}
