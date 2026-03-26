package com.travelcrm.modules.tours.service;

import com.travelcrm.modules.tours.TourEntity;
import com.travelcrm.modules.tours.TourRepository;
import com.travelcrm.modules.tours.dto.TourRequest;
import com.travelcrm.modules.tours.dto.TourResponse;
import com.travelcrm.shared.exception.NotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TourService {

    private final TourRepository tourRepository;

    public Page<TourResponse> findAll(String search, String status, String category, Pageable pageable) {
        Specification<TourEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), like),
                    cb.like(cb.lower(root.get("country")), like),
                    cb.like(cb.lower(root.get("resort")), like),
                    cb.like(cb.lower(root.get("hotelName")), like),
                    cb.like(cb.lower(root.get("tourOperator")), like)
                ));
            }
            if (status != null && !status.isBlank()) predicates.add(cb.equal(root.get("status"), status));
            if (category != null && !category.isBlank()) predicates.add(cb.equal(root.get("category"), category));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return tourRepository.findAll(spec, pageable).map(this::toResponse);
    }

    public TourResponse findById(UUID id) {
        return toResponse(tourRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Тур не найден")));
    }

    @Transactional
    public TourResponse create(TourRequest req) {
        TourEntity tour = new TourEntity();
        mapFields(tour, req);
        return toResponse(tourRepository.save(tour));
    }

    @Transactional
    public TourResponse update(UUID id, TourRequest req) {
        TourEntity tour = tourRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Тур не найден"));
        mapFields(tour, req);
        return toResponse(tourRepository.save(tour));
    }

    @Transactional
    public void delete(UUID id) {
        if (!tourRepository.existsById(id)) throw new NotFoundException("Тур не найден");
        tourRepository.deleteById(id);
    }

    private void mapFields(TourEntity tour, TourRequest req) {
        tour.setName(req.getName());
        tour.setDescription(req.getDescription());
        tour.setCountry(req.getCountry());
        tour.setResort(req.getResort());
        tour.setHotelName(req.getHotelName());
        tour.setHotelStars(req.getHotelStars());
        tour.setTourOperator(req.getTourOperator());
        tour.setCategory(req.getCategory());
        tour.setDepartureCity(req.getDepartureCity());
        tour.setDurationDays(req.getDurationDays() != null ? req.getDurationDays() : 7);
        tour.setMealPlan(req.getMealPlan());
        tour.setTransport(req.getTransport());
        tour.setPriceNetto(req.getPriceNetto());
        tour.setPriceBrutto(req.getPriceBrutto());
        tour.setCurrency(req.getCurrency() != null ? req.getCurrency() : "USD");
        tour.setMaxSeats(req.getMaxSeats());
        tour.setStatus(req.getStatus() != null ? req.getStatus() : "ACTIVE");
        tour.setDepartureDate(req.getDepartureDate());
        tour.setReturnDate(req.getReturnDate());
        tour.setVisaRequired(req.isVisaRequired());
        tour.setInsuranceIncluded(req.isInsuranceIncluded());
        tour.setNotes(req.getNotes());
        tour.setLocations(req.getLocations());
        tour.setIncluded(req.getIncluded());
        tour.setProgram(req.getProgram());
        tour.setWarnings(req.getWarnings());
        tour.setWhatToBring(req.getWhatToBring());
        tour.setDressCode(req.getDressCode());
        tour.setTransportNotes(req.getTransportNotes());
        tour.setMealInfo(req.getMealInfo());
        tour.setDepartureDates(req.getDepartureDates());
        tour.setAverageCheck(req.getAverageCheck());
    }

    private TourResponse toResponse(TourEntity t) {
        TourResponse r = new TourResponse();
        r.setId(t.getId());
        r.setName(t.getName());
        r.setDescription(t.getDescription());
        r.setCountry(t.getCountry());
        r.setResort(t.getResort());
        r.setHotelName(t.getHotelName());
        r.setHotelStars(t.getHotelStars());
        r.setTourOperator(t.getTourOperator());
        r.setCategory(t.getCategory());
        r.setDepartureCity(t.getDepartureCity());
        r.setDurationDays(t.getDurationDays());
        r.setMealPlan(t.getMealPlan());
        r.setTransport(t.getTransport());
        r.setPriceNetto(t.getPriceNetto());
        r.setPriceBrutto(t.getPriceBrutto());
        r.setCurrency(t.getCurrency());
        r.setMaxSeats(t.getMaxSeats());
        r.setBookedSeats(t.getBookedSeats());
        r.setStatus(t.getStatus());
        r.setImageUrl(t.getImageUrl());
        r.setDepartureDate(t.getDepartureDate());
        r.setReturnDate(t.getReturnDate());
        r.setVisaRequired(t.isVisaRequired());
        r.setInsuranceIncluded(t.isInsuranceIncluded());
        r.setNotes(t.getNotes());
        r.setLocations(t.getLocations());
        r.setIncluded(t.getIncluded());
        r.setProgram(t.getProgram());
        r.setWarnings(t.getWarnings());
        r.setWhatToBring(t.getWhatToBring());
        r.setDressCode(t.getDressCode());
        r.setTransportNotes(t.getTransportNotes());
        r.setMealInfo(t.getMealInfo());
        r.setDepartureDates(t.getDepartureDates());
        r.setAverageCheck(t.getAverageCheck());
        r.setCreatedAt(t.getCreatedAt());
        r.setUpdatedAt(t.getUpdatedAt());
        return r;
    }
}
