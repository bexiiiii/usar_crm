package com.travelcrm.modules.bus.service;

import com.travelcrm.modules.bus.dto.BusRouteRequest;
import com.travelcrm.modules.bus.dto.BusRouteResponse;
import com.travelcrm.modules.bus.entity.BusRouteEntity;
import com.travelcrm.modules.bus.mapper.BusRouteMapper;
import com.travelcrm.modules.bus.repository.BusRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BusRouteService {
    private final BusRouteRepository busRouteRepository;
    private final BusRouteMapper busRouteMapper;

    public List<BusRouteResponse> getRoutesByDate(LocalDate date) {
        return busRouteRepository.findByRouteDate(date).stream()
                .map(busRouteMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<BusRouteResponse> getRoutesByBusAndDate(UUID busId, LocalDate date) {
        return busRouteRepository.findByBusIdAndRouteDate(busId, date).stream()
                .map(busRouteMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<BusRouteResponse> getRoutesByBus(UUID busId) {
        return busRouteRepository.findByBusId(busId).stream()
                .map(busRouteMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<BusRouteResponse> getRoutesByDriver(UUID driverId, LocalDate date) {
        return busRouteRepository.findByDriverIdAndRouteDate(driverId, date).stream()
                .map(busRouteMapper::toResponse)
                .collect(Collectors.toList());
    }

    public BusRouteResponse getRouteById(UUID routeId) {
        return busRouteRepository.findById(routeId)
                .map(busRouteMapper::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Route not found"));
    }

    @Transactional
    public BusRouteResponse createRoute(BusRouteRequest request) {
        BusRouteEntity route = BusRouteEntity.builder()
                .busId(request.getBusId())
                .routeName(request.getRouteName())
                .driverId(request.getDriverId())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .routeDate(request.getRouteDate())
                .build();
        busRouteRepository.save(route);
        return busRouteMapper.toResponse(route);
    }

    @Transactional
    public BusRouteResponse updateRoute(UUID routeId, BusRouteRequest request) {
        BusRouteEntity route = busRouteRepository.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("Route not found"));
        route.setRouteName(request.getRouteName());
        route.setDriverId(request.getDriverId());
        route.setStartTime(request.getStartTime());
        route.setEndTime(request.getEndTime());
        busRouteRepository.save(route);
        return busRouteMapper.toResponse(route);
    }

    @Transactional
    public void deleteRoute(UUID routeId) {
        busRouteRepository.deleteById(routeId);
    }
}
