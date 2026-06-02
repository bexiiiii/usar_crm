package com.travelcrm.modules.bookings.service;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.auth.Role;
import com.travelcrm.modules.auth.UserRepository;
import com.travelcrm.modules.bookings.BookingEntity;
import com.travelcrm.modules.bookings.BookingRepository;
import com.travelcrm.modules.bookings.dto.BookingRequest;
import com.travelcrm.modules.bookings.dto.BookingMonthlySummaryResponse;
import com.travelcrm.modules.bookings.dto.BookingResponse;
import com.travelcrm.modules.bookings.dto.TourBookingExportResponse;
import com.travelcrm.modules.clients.ClientRepository;
import com.travelcrm.modules.leads.LeadRepository;
import com.travelcrm.modules.payments.PaymentRepository;
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
import java.time.Month;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {
    private static final String[] MONTH_LABELS = {
        "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
        "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"
    };

    private final BookingRepository bookingRepository;
    private final ClientRepository clientRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final TourRepository tourRepository;
    private final PaymentRepository paymentRepository;

    public Page<BookingResponse> findAll(String status, UUID managerId, UUID clientId, LocalDate from, LocalDate to,
                                          String destination, Pageable pageable, UserPrincipal currentUser) {
        if (currentUser.getRole() == Role.MANAGER) {
            managerId = currentUser.getId();
        }
        Specification<BookingEntity> spec = buildSpecification(status, managerId, clientId, from, to, destination);
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

    public List<BookingResponse> findByTour(UUID tourId, UserPrincipal currentUser) {
        if (!tourRepository.existsById(tourId)) {
            throw new NotFoundException("Тур не найден");
        }
        return bookingRepository.findByTourId(tourId).stream()
            .map(b -> toResponse(b, currentUser.getRole()))
            .toList();
    }

    public List<TourBookingExportResponse> findExportByTour(UUID tourId, UserPrincipal currentUser) {
        if (!tourRepository.existsById(tourId)) {
            throw new NotFoundException("Тур не найден");
        }
        List<BookingEntity> bookings = bookingRepository.findByTourId(tourId);
        if (bookings.isEmpty()) {
            return List.of();
        }

        List<UUID> bookingIds = bookings.stream()
            .map(BookingEntity::getId)
            .toList();

        Map<UUID, BigDecimal> paidAmounts = new HashMap<>();
        for (Object[] row : paymentRepository.sumPaidByBookingIds(bookingIds)) {
            paidAmounts.put((UUID) row[0], (BigDecimal) row[1]);
        }

        return bookings.stream()
            .map(booking -> toTourExportResponse(booking, paidAmounts.getOrDefault(booking.getId(), BigDecimal.ZERO)))
            .toList();
    }

    public List<BookingMonthlySummaryResponse> findMonthlySummary(Integer year, UserPrincipal currentUser) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        LocalDate from = LocalDate.of(targetYear, Month.JANUARY, 1);
        LocalDate to = LocalDate.of(targetYear, Month.DECEMBER, 31);

        UUID managerId = currentUser.getRole() == Role.MANAGER ? currentUser.getId() : null;
        List<BookingEntity> bookings = bookingRepository.findAll(buildSpecification(null, managerId, null, from, to, null));

        Map<Integer, Long> counts = new HashMap<>();
        Map<Integer, BigDecimal> totals = new HashMap<>();

        for (BookingEntity booking : bookings) {
            if (booking.getDepartureDate() == null) {
                continue;
            }
            int monthValue = booking.getDepartureDate().getMonthValue();
            counts.merge(monthValue, 1L, Long::sum);
            totals.merge(monthValue, booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO, BigDecimal::add);
        }

        List<BookingMonthlySummaryResponse> response = new ArrayList<>();
        for (int month = 1; month <= 12; month++) {
            BookingMonthlySummaryResponse item = new BookingMonthlySummaryResponse();
            item.setMonth(month);
            item.setLabel(MONTH_LABELS[month - 1]);
            item.setCount(counts.getOrDefault(month, 0L));
            item.setTotalAmount(totals.getOrDefault(month, BigDecimal.ZERO));
            response.add(item);
        }
        return response;
    }

    private String generateBookingNumber() {
        long seq = bookingRepository.count() + 1;
        return String.format("TRV-%d-%04d", Year.now().getValue(), seq);
    }

    private Specification<BookingEntity> buildSpecification(String status, UUID managerId, UUID clientId,
                                                            LocalDate from, LocalDate to, String destination) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (managerId != null) predicates.add(cb.equal(root.get("assignedManager").get("id"), managerId));
            if (clientId != null) predicates.add(cb.equal(root.get("client").get("id"), clientId));
            if (from != null) predicates.add(cb.greaterThanOrEqualTo(root.get("departureDate"), from));
            if (to != null) predicates.add(cb.lessThanOrEqualTo(root.get("departureDate"), to));
            if (destination != null && !destination.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("destination")), "%" + destination.toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
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
        b.setPickupLocation(req.getPickupLocation());
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
        r.setPickupLocation(b.getPickupLocation());
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

    private TourBookingExportResponse toTourExportResponse(BookingEntity booking, BigDecimal paidAmount) {
        TourBookingExportResponse response = new TourBookingExportResponse();
        response.setBookingId(booking.getId());
        response.setBookingNumber(booking.getBookingNumber());
        response.setStatus(booking.getStatus());
        response.setType(booking.getType());
        response.setDestination(booking.getDestination());
        response.setCountry(booking.getCountry());
        response.setDepartureCity(booking.getDepartureCity());
        response.setPickupLocation(booking.getPickupLocation());
        response.setDepartureDate(booking.getDepartureDate());
        response.setReturnDate(booking.getReturnDate());
        response.setPaxAdults(booking.getPaxAdults());
        response.setPaxChildren(booking.getPaxChildren());
        response.setTotalTourists(booking.getPaxAdults() + booking.getPaxChildren());
        response.setHotelName(booking.getHotelName());
        response.setMealPlan(booking.getMealPlan());
        response.setTourOperator(booking.getTourOperator());
        response.setSupplierRef(booking.getSupplierRef());
        response.setTotalPrice(booking.getTotalPrice());
        response.setPaidAmount(paidAmount);
        response.setRemainingAmount(booking.getTotalPrice().subtract(paidAmount).max(BigDecimal.ZERO));
        response.setCurrency(booking.getCurrency());
        response.setNotes(booking.getNotes());
        response.setSpecialRequests(booking.getSpecialRequests());

        if (booking.getTour() != null) {
            response.setTourId(booking.getTour().getId());
            response.setTourName(booking.getTour().getName());
        }
        if (booking.getClient() != null) {
            response.setClientId(booking.getClient().getId());
            response.setClientName(booking.getClient().getFirstName() + " " + booking.getClient().getLastName());
            response.setClientPhone(booking.getClient().getPhone());
            response.setClientEmail(booking.getClient().getEmail());
            response.setPassportNumber(booking.getClient().getPassportNumber());
            response.setPassportExpiry(booking.getClient().getPassportExpiry());
            response.setDateOfBirth(booking.getClient().getDateOfBirth());
        }
        if (booking.getAssignedManager() != null) {
            response.setAssignedManagerName(booking.getAssignedManager().getFullName());
        }

        return response;
    }
}
