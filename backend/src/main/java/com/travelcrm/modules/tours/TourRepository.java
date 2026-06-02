package com.travelcrm.modules.tours;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.UUID;

public interface TourRepository extends JpaRepository<TourEntity, UUID>, JpaSpecificationExecutor<TourEntity> {

    @Modifying
    @Query("UPDATE TourEntity t SET t.status = 'ARCHIVED' WHERE t.departureDate < :today AND t.status = 'ACTIVE'")
    int archiveExpiredTours(@Param("today") LocalDate today);
}
