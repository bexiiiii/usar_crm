package com.travelcrm.modules.bookings;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<BookingEntity, UUID> {
    @Query("""
        SELECT b FROM BookingEntity b
        WHERE (:status IS NULL OR b.status = :status)
        AND (:managerId IS NULL OR b.assignedManager.id = :managerId)
        AND (:clientId IS NULL OR b.client.id = :clientId)
        AND (:from IS NULL OR b.departureDate >= :from)
        AND (:to IS NULL OR b.departureDate <= :to)
        AND (:destination IS NULL OR LOWER(b.destination) LIKE LOWER(CONCAT('%', :destination, '%')))
        """)
    Page<BookingEntity> findWithFilters(
        @Param("status") String status,
        @Param("managerId") UUID managerId,
        @Param("clientId") UUID clientId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("destination") String destination,
        Pageable pageable
    );

    @Query("SELECT b FROM BookingEntity b WHERE b.supplierPaymentDeadline <= :deadline AND b.supplierPaid = false AND b.status NOT IN ('CANCELLED', 'COMPLETED')")
    List<BookingEntity> findUpcomingDeadlines(@Param("deadline") LocalDate deadline);

    @Query("SELECT b FROM BookingEntity b WHERE b.departureDate BETWEEN :from AND :to ORDER BY b.departureDate ASC")
    List<BookingEntity> findUpcomingDepartures(@Param("from") LocalDate from, @Param("to") LocalDate to);

    long countByAssignedManagerId(UUID managerId);

    @Query("SELECT b FROM BookingEntity b WHERE b.client.id = :clientId ORDER BY b.createdAt DESC")
    List<BookingEntity> findByClientId(@Param("clientId") UUID clientId);
}
