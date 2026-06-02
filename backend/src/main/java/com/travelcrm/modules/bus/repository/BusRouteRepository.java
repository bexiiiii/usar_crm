package com.travelcrm.modules.bus.repository;

import com.travelcrm.modules.bus.entity.BusRouteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface BusRouteRepository extends JpaRepository<BusRouteEntity, UUID> {
    List<BusRouteEntity> findByBusIdAndRouteDate(UUID busId, LocalDate routeDate);
    List<BusRouteEntity> findByRouteDate(LocalDate routeDate);
    List<BusRouteEntity> findByBusId(UUID busId);
    List<BusRouteEntity> findByDriverIdAndRouteDate(UUID driverId, LocalDate routeDate);
}
