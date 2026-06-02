package com.travelcrm.modules.bus.repository;

import com.travelcrm.modules.bus.entity.BusEntity;
import com.travelcrm.modules.bus.entity.BusType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BusRepository extends JpaRepository<BusEntity, UUID> {
    Optional<BusEntity> findByBusNumber(String busNumber);
    List<BusEntity> findByBusType(BusType busType);
}
