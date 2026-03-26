package com.travelcrm.modules.tours;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface TourRepository extends JpaRepository<TourEntity, UUID>, JpaSpecificationExecutor<TourEntity> {
}
