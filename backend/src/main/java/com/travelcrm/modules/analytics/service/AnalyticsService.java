package com.travelcrm.modules.analytics.service;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.analytics.dto.AnalyticsDashboardResponse;
import com.travelcrm.modules.auth.Role;
import com.travelcrm.modules.auth.UserRepository;
import com.travelcrm.modules.bookings.BookingEntity;
import com.travelcrm.modules.bookings.BookingRepository;
import com.travelcrm.modules.leads.LeadEntity;
import com.travelcrm.modules.leads.LeadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    private final BookingRepository bookingRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private static final ZoneId DEFAULT_ZONE = ZoneId.systemDefault();
    private static final String[] MONTH_LABELS = {
        "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
        "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"
    };

    public AnalyticsDashboardResponse getDashboard(UserPrincipal currentUser) {
        YearMonth currentMonth = YearMonth.now(DEFAULT_ZONE);
        YearMonth previousMonth = currentMonth.minusMonths(1);

        List<BookingEntity> visibleBookings = bookingRepository.findAll().stream()
            .filter(b -> currentUser.getRole() == Role.SUPER_ADMIN ||
                (b.getAssignedManager() != null && b.getAssignedManager().getId().equals(currentUser.getId())))
            .toList();

        List<LeadEntity> visibleLeads = leadRepository.findAll().stream()
            .filter(l -> currentUser.getRole() == Role.SUPER_ADMIN ||
                (l.getAssignedManager() != null && l.getAssignedManager().getId().equals(currentUser.getId())))
            .toList();

        BigDecimal revenueCurrentMonth = sumRevenueForMonth(visibleBookings, currentMonth);
        BigDecimal revenuePreviousMonth = sumRevenueForMonth(visibleBookings, previousMonth);
        long bookingsCurrentMonth = countByMonth(visibleBookings, currentMonth);
        long bookingsPreviousMonth = countByMonth(visibleBookings, previousMonth);
        long leadsCurrentMonth = countByMonth(visibleLeads, currentMonth);
        long leadsPreviousMonth = countByMonth(visibleLeads, previousMonth);
        double conversionRate = calculateRate(bookingsCurrentMonth, leadsCurrentMonth);
        double conversionRatePrevious = calculateRate(bookingsPreviousMonth, leadsPreviousMonth);

        AnalyticsDashboardResponse response = new AnalyticsDashboardResponse();
        response.setRevenueCurrentMonth(revenueCurrentMonth);
        response.setRevenuePreviousMonth(revenuePreviousMonth);
        response.setRevenueTrend(calculateTrend(revenueCurrentMonth, revenuePreviousMonth));
        response.setBookingsCurrentMonth(bookingsCurrentMonth);
        response.setBookingsPreviousMonth(bookingsPreviousMonth);
        response.setBookingsTrend(calculateTrend(bookingsCurrentMonth, bookingsPreviousMonth));
        response.setNewLeadsCurrentMonth(leadsCurrentMonth);
        response.setNewLeadsPreviousMonth(leadsPreviousMonth);
        response.setLeadsTrend(calculateTrend(leadsCurrentMonth, leadsPreviousMonth));
        response.setConversionRate(conversionRate);
        response.setConversionRatePrevious(conversionRatePrevious);
        response.setConversionTrend(calculateTrend(conversionRate, conversionRatePrevious));
        return response;
    }

    public List<Map<String, Object>> getTopDestinations(int limit) {
        Map<String, Long> counts = new LinkedHashMap<>();
        bookingRepository.findAll().forEach(b ->
            counts.merge(b.getDestination() != null ? b.getDestination() : "Другое", 1L, Long::sum)
        );
        return counts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(limit)
            .map(e -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("destination", e.getKey());
                m.put("count", e.getValue());
                return m;
            })
            .toList();
    }

    public List<Map<String, Object>> getManagersStats(UserPrincipal currentUser) {
        List<BookingEntity> bookings = bookingRepository.findAll();
        List<LeadEntity> leads = leadRepository.findAll();

        return userRepository.findAll().stream()
            .filter(u -> u.getRole().name().equals("MANAGER"))
            .filter(u -> currentUser.getRole() == Role.SUPER_ADMIN || u.getId().equals(currentUser.getId()))
            .map(u -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("managerId", u.getId());
                m.put("managerName", u.getFullName());
                long bookingCount = bookings.stream()
                    .filter(b -> b.getAssignedManager() != null && b.getAssignedManager().getId().equals(u.getId()))
                    .count();
                m.put("bookingCount", bookingCount);
                BigDecimal revenue = bookings.stream()
                    .filter(b -> b.getAssignedManager() != null && b.getAssignedManager().getId().equals(u.getId()))
                    .filter(b -> !b.getStatus().equals("CANCELLED"))
                    .map(b -> b.getTotalPrice() != null ? b.getTotalPrice() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                m.put("revenue", revenue);
                long leadCount = leads.stream()
                    .filter(l -> l.getAssignedManager() != null && l.getAssignedManager().getId().equals(u.getId()))
                    .count();
                m.put("conversionRate", calculateRate(bookingCount, leadCount));
                return m;
            })
            .toList();
    }

    public List<Map<String, Object>> getMonthlyRevenue() {
        YearMonth currentMonth = YearMonth.now(DEFAULT_ZONE);
        Map<YearMonth, BigDecimal> revenueByMonth = new LinkedHashMap<>();

        bookingRepository.findAll().stream()
            .filter(b -> !b.getStatus().equals("CANCELLED"))
            .filter(b -> b.getCreatedAt() != null)
            .forEach(b -> {
                YearMonth month = YearMonth.from(b.getCreatedAt().atZone(DEFAULT_ZONE));
                revenueByMonth.merge(month, b.getTotalPrice() != null ? b.getTotalPrice() : BigDecimal.ZERO, BigDecimal::add);
            });

        return IntStream.rangeClosed(11, 0).mapToObj(offset -> currentMonth.minusMonths(offset)).map(month -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", MONTH_LABELS[month.getMonthValue() - 1]);
            m.put("revenue", revenueByMonth.getOrDefault(month, BigDecimal.ZERO));
            return m;
        }).toList();
    }

    private BigDecimal sumRevenueForMonth(List<BookingEntity> bookings, YearMonth month) {
        return bookings.stream()
            .filter(b -> !b.getStatus().equals("CANCELLED"))
            .filter(b -> isInMonth(b.getCreatedAt(), month))
            .map(b -> b.getTotalPrice() != null ? b.getTotalPrice() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private long countByMonth(List<? extends com.travelcrm.shared.entity.BaseEntity> entities, YearMonth month) {
        return entities.stream()
            .filter(entity -> isInMonth(entity.getCreatedAt(), month))
            .count();
    }

    private boolean isInMonth(Instant createdAt, YearMonth month) {
        return createdAt != null && YearMonth.from(createdAt.atZone(DEFAULT_ZONE)).equals(month);
    }

    private double calculateRate(long numerator, long denominator) {
        if (denominator <= 0) {
            return 0.0;
        }
        return BigDecimal.valueOf((double) numerator * 100 / denominator)
            .setScale(2, RoundingMode.HALF_UP)
            .doubleValue();
    }

    private double calculateTrend(long current, long previous) {
        if (previous == 0) {
            return current == 0 ? 0.0 : 100.0;
        }
        return BigDecimal.valueOf(((double) (current - previous) / previous) * 100)
            .setScale(2, RoundingMode.HALF_UP)
            .doubleValue();
    }

    private double calculateTrend(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.signum() == 0) {
            return current == null || current.signum() == 0 ? 0.0 : 100.0;
        }
        BigDecimal currentValue = current != null ? current : BigDecimal.ZERO;
        return currentValue.subtract(previous)
            .divide(previous, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .setScale(2, RoundingMode.HALF_UP)
            .doubleValue();
    }

    private double calculateTrend(double current, double previous) {
        if (previous == 0.0) {
            return current == 0.0 ? 0.0 : 100.0;
        }
        return BigDecimal.valueOf(((current - previous) / previous) * 100)
            .setScale(2, RoundingMode.HALF_UP)
            .doubleValue();
    }
}
