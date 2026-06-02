package com.travelcrm.modules.bus.repository;

import com.travelcrm.modules.bus.entity.DriverEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DriverRepository extends JpaRepository<DriverEntity, UUID> {
    List<DriverEntity> findByIsActive(Boolean isActive);
}
