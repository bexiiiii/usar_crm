package com.travelcrm.modules.bookings.service;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.auth.Role;
import com.travelcrm.modules.auth.UserRepository;
import com.travelcrm.modules.bookings.BookingEntity;
import com.travelcrm.modules.bookings.BookingRepository;
import com.travelcrm.modules.bookings.dto.BookingRequest;
import com.travelcrm.modules.bookings.dto.BookingResponse;
import com.travelcrm.modules.clients.ClientRepository;
import com.travelcrm.modules.leads.LeadRepository;
import com.travelcrm.modules.tours.TourEntity;
import com.travelcrm.modules.tours.TourRepository;
import com.travelcrm.shared.exception.NotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {
    private final BookingRepository bookingRepository;
    private final ClientRepository clientRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final TourRepository tourRepository;

    public Page<BookingResponse> findAll(String status, UUID managerId, UUID clientId, LocalDate from, LocalDate to,
                                          String destination, Pageable pageable, UserPrincipal currentUser) {
        if (currentUser.getRole() == Role.MANAGER) {
            managerId = currentUser.getId();
        }
        final UUID finalManagerId = managerId;
        Specification<BookingEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (finalManagerId != null) predicates.add(cb.equal(root.get("assignedManager").get("id"), finalManagerId));
            if (clientId != null) predicates.add(cb.equal(root.get("client").get("id"), clientId));
            if (from != null) predicates.add(cb.greaterThanOrEqualTo(root.get("departureDate"), from));
            if (to != null) predicates.add(cb.lessThanOrEqualTo(root.get("departureDate"), to));
            if (destination != null && !destination.isBlank())
                predicates.add(cb.like(cb.lower(root.get("destination")), "%" + destination.toLowerCase() + "%"));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return bookingRepository.findAll(spec, pageable).map(b -> toResponse(b, currentUser.getRole()));
    }

    public BookingResponse findById(UUID id, UserPrincipal currentUser) {
        BookingEntity b = bookingRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Бронь не найдена"));
        if (currentUser.getRole() == Role.MANAGER &&
            (b.getAssignedManager() == null || !b.getAssignedManager().getId().equals(currentUser.getId()))) {
            throw new AccessDeniedException("Нет доступа");
        }
        return toResponse(b, currentUser.getRole());
    }

    @Transactional
    public BookingResponse create(BookingRequest req, UserPrincipal currentUser) {
        // Check tour seat availability
        TourEntity tour = null;
        if (req.getTourId() != null) {
            tour = tourRepository.findById(req.getTourId())
                .orElseThrow(() -> new NotFoundException("Тур не найден"));
            if (!"ACTIVE".equals(tour.getStatus())) {
                throw new IllegalStateException("Тур недоступен для бронирования");
            }
            if (tour.getDepartureDate() != null && tour.getDepartureDate().isBefore(LocalDate.now())) {
                throw new IllegalStateException("Дата отправления уже прошла");
            }
            if (tour.getMaxSeats() != null && tour.getBookedSeats() >= tour.getMaxSeats()) {
                throw new IllegalStateException("Нет свободных мест в этом туре");
            }
        }
        BookingEntity booking = new BookingEntity();
        applyRequest(booking, req, currentUser);
        booking.setBookingNumber(generateBookingNumber());
        if (tour != null) {
            booking.setTour(tour);
            tour.setBookedSeats(tour.getBookedSeats() + 1);
            tourRepository.save(tour);
        }
        BookingEntity saved = bookingRepository.save(booking);
        // Update client stats immediately on booking creation
        if (saved.getClient() != null) {
            var client = saved.getClient();
            client.setTotalBookings(client.getTotalBookings() + 1);
            client.setTotalRevenue(client.getTotalRevenue().add(saved.getTotalPrice()));
            clientRepository.save(client);
        }
        return toResponse(saved, currentUser.getRole());
    }

    @Transactional
    public BookingResponse update(UUID id, BookingRequest req, UserPrincipal currentUser) {
        BookingEntity booking = bookingRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Бронь не найдена"));
        applyRequest(booking, req, currentUser);
        return toResponse(bookingRepository.save(booking), currentUser.getRole());
    }

    @Transactional
    public BookingResponse updateStatus(UUID id, String status, UserPrincipal currentUser) {
        BookingEntity booking = bookingRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Бронь не найдена"));
        if (currentUser.getRole() == Role.MANAGER && "CANCELLED".equals(status)) {
            throw new AccessDeniedException("Нет доступа — недостаточно прав");
        }
        String prevStatus = booking.getStatus();
        booking.setStatus(status);
        // Reverse client stats on cancellation
        if ("CANCELLED".equals(status) && !"CANCELLED".equals(prevStatus) && booking.getClient() != null) {
            var client = booking.getClient();
            client.setTotalBookings(Math.max(0, client.getTotalBookings() - 1));
            client.setTotalRevenue(client.getTotalRevenue().subtract(booking.getTotalPrice()).max(BigDecimal.ZERO));
            clientRepository.save(client);
        }
        // Free up tour seat on cancellation
        if ("CANCELLED".equals(status) && !"CANCELLED".equals(prevStatus) && booking.getTour() != null) {
            TourEntity tour = booking.getTour();
            tour.setBookedSeats(Math.max(0, tour.getBookedSeats() - 1));
            tourRepository.save(tour);
        }
        return toResponse(bookingRepository.save(booking), currentUser.getRole());
    }

    @Transactional
    public void delete(UUID id) {
        if (!bookingRepository.existsById(id)) {
            throw new NotFoundException("Бронь не найдена");
        }
        bookingRepository.deleteById(id);
    }

    public List<BookingResponse> findUpcomingDeadlines(UserPrincipal currentUser) {
        LocalDate deadline = LocalDate.now().plusDays(3);
        return bookingRepository.findUpcomingDeadlines(deadline).stream()
            .filter(b -> currentUser.getRole() == Role.SUPER_ADMIN ||
                (b.getAssignedManager() != null && b.getAssignedManager().getId().equals(currentUser.getId())))
            .map(b -> toResponse(b, currentUser.getRole()))
            .toList();
    }

    public List<BookingResponse> findUpcomingDepartures(int days, UserPrincipal currentUser) {
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(days);
        return bookingRepository.findUpcomingDepartures(from, to).stream()
            .filter(b -> currentUser.getRole() == Role.SUPER_ADMIN ||
                (b.getAssignedManager() != null && b.getAssignedManager().getId().equals(currentUser.getId())))
            .map(b -> toResponse(b, currentUser.getRole()))
            .toList();
    }

    public List<BookingResponse> findByClient(UUID clientId, UserPrincipal currentUser) {
        return bookingRepository.findByClientId(clientId).stream()
            .map(b -> toResponse(b, currentUser.getRole()))
            .toList();
    }

    private String generateBookingNumber() {
        long seq = bookingRepository.count() + 1;
        return String.format("TRV-%d-%04d", Year.now().getValue(), seq);
    }

    private void applyRequest(BookingEntity b, BookingRequest req, UserPrincipal currentUser) {
        if (req.getClientId() != null) {
            clientRepository.findById(req.getClientId()).ifPresent(b::setClient);
        }
        if (req.getLeadId() != null) {
            leadRepository.findById(req.getLeadId()).ifPresent(b::setLead);
        }
        UUID managerId = req.getAssignedManagerId();
        if (currentUser.getRole() == Role.MANAGER) {
            managerId = currentUser.getId();
        }
        if (managerId != null) {
            userRepository.findById(managerId).ifPresent(b::setAssignedManager);
        }
        b.setStatus(req.getStatus() != null ? req.getStatus() : "PENDING");
        b.setType(req.getType());
        b.setDestination(req.getDestination());
        b.setCountry(req.getCountry());
        b.setDepartureCity(req.getDepartureCity());
        b.setDepartureDate(req.getDepartureDate());
        b.setReturnDate(req.getReturnDate());
        b.setPaxAdults(req.getPaxAdults());
        b.setPaxChildren(req.getPaxChildren());
        b.setHotelName(req.getHotelName());
        b.setHotelStars(req.getHotelStars());
        b.setMealPlan(req.getMealPlan());
        b.setFlightNumber(req.getFlightNumber());
        b.setTourOperator(req.getTourOperator());
        b.setSupplierRef(req.getSupplierRef());
        b.setTotalPrice(req.getTotalPrice());
        b.setCostPrice(req.getCostPrice());
        b.setCurrency(req.getCurrency() != null ? req.getCurrency() : "USD");
        b.setSupplierPaymentDeadline(req.getSupplierPaymentDeadline());
        b.setSupplierPaid(req.isSupplierPaid());
        b.setNotes(req.getNotes());
        b.setSpecialRequests(req.getSpecialRequests());
    }

    private BookingResponse toResponse(BookingEntity b, Role role) {
        BookingResponse r = new BookingResponse();
        r.setId(b.getId());
        r.setBookingNumber(b.getBookingNumber());
        if (b.getTour() != null) {
            r.setTourId(b.getTour().getId());
            r.setTourName(b.getTour().getName());
        }
        r.setStatus(b.getStatus());
        r.setType(b.getType());
        r.setDestination(b.getDestination());
        r.setCountry(b.getCountry());
        r.setDepartureCity(b.getDepartureCity());
        r.setDepartureDate(b.getDepartureDate());
        r.setReturnDate(b.getReturnDate());
        r.setPaxAdults(b.getPaxAdults());
        r.setPaxChildren(b.getPaxChildren());
        r.setHotelName(b.getHotelName());
        r.setHotelStars(b.getHotelStars());
        r.setMealPlan(b.getMealPlan());
        r.setFlightNumber(b.getFlightNumber());
        r.setTourOperator(b.getTourOperator());
        r.setSupplierRef(b.getSupplierRef());
        r.setTotalPrice(b.getTotalPrice());
        r.setCurrency(b.getCurrency());
        r.setSupplierPaymentDeadline(b.getSupplierPaymentDeadline());
        r.setSupplierPaid(b.isSupplierPaid());
        r.setNotes(b.getNotes());
        r.setSpecialRequests(b.getSpecialRequests());
        r.setCreatedAt(b.getCreatedAt());
        r.setUpdatedAt(b.getUpdatedAt());
        if (role == Role.SUPER_ADMIN && b.getCostPrice() != null) {
            r.setCostPrice(b.getCostPrice());
            BigDecimal margin = b.getTotalPrice().subtract(b.getCostPrice());
            r.setMargin(margin);
        }
        if (b.getClient() != null) {
            r.setClientId(b.getClient().getId());
            r.setClientName(b.getClient().getFirstName() + " " + b.getClient().getLastName());
        }
        if (b.getAssignedManager() != null) {
            r.setAssignedManagerId(b.getAssignedManager().getId());
            r.setAssignedManagerName(b.getAssignedManager().getFullName());
        }
        return r;
    }
}
