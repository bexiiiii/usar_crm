package com.travelcrm.modules.bookings;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<BookingEntity, UUID>, JpaSpecificationExecutor<BookingEntity> {

    @Query("SELECT b FROM BookingEntity b WHERE b.supplierPaymentDeadline <= :deadline AND b.supplierPaid = false AND b.status NOT IN ('CANCELLED', 'COMPLETED')")
    List<BookingEntity> findUpcomingDeadlines(@Param("deadline") LocalDate deadline);

    @Query("SELECT b FROM BookingEntity b WHERE b.departureDate BETWEEN :from AND :to ORDER BY b.departureDate ASC")
    List<BookingEntity> findUpcomingDepartures(@Param("from") LocalDate from, @Param("to") LocalDate to);

    long countByAssignedManagerId(UUID managerId);

    @Query("SELECT b FROM BookingEntity b WHERE b.client.id = :clientId ORDER BY b.createdAt DESC")
    List<BookingEntity> findByClientId(@Param("clientId") UUID clientId);
}
