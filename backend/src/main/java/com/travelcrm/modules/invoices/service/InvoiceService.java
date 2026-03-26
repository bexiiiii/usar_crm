package com.travelcrm.modules.invoices.service;

import com.travelcrm.modules.bookings.BookingRepository;
import com.travelcrm.modules.clients.ClientRepository;
import com.travelcrm.modules.invoices.InvoiceEntity;
import com.travelcrm.modules.invoices.InvoiceRepository;
import com.travelcrm.modules.invoices.dto.InvoiceRequest;
import com.travelcrm.modules.invoices.dto.InvoiceResponse;
import com.travelcrm.modules.invoices.dto.InvoiceStatsResponse;
import com.travelcrm.shared.exception.NotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;
    private final BookingRepository bookingRepository;

    private static final AtomicLong counter = new AtomicLong(1001);

    public Page<InvoiceResponse> findAll(String search, String status, Pageable pageable) {
        Specification<InvoiceEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("invoiceNumber")), like),
                    cb.like(cb.lower(root.get("client").get("firstName")), like),
                    cb.like(cb.lower(root.get("client").get("lastName")), like)
                ));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return invoiceRepository.findAll(spec, pageable).map(this::toResponse);
    }

    public InvoiceResponse findById(UUID id) {
        return toResponse(invoiceRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Счёт не найден")));
    }

    @Transactional
    public InvoiceResponse create(InvoiceRequest req) {
        InvoiceEntity inv = new InvoiceEntity();
        inv.setInvoiceNumber("INV-" + counter.getAndIncrement());
        applyFields(inv, req);
        return toResponse(invoiceRepository.save(inv));
    }

    @Transactional
    public InvoiceResponse update(UUID id, InvoiceRequest req) {
        InvoiceEntity inv = invoiceRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Счёт не найден"));
        applyFields(inv, req);
        return toResponse(invoiceRepository.save(inv));
    }

    @Transactional
    public InvoiceResponse send(UUID id) {
        InvoiceEntity inv = invoiceRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Счёт не найден"));
        inv.setStatus("SENT");
        return toResponse(invoiceRepository.save(inv));
    }

    @Transactional
    public InvoiceResponse markPaid(UUID id) {
        InvoiceEntity inv = invoiceRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Счёт не найден"));
        inv.setStatus("PAID");
        inv.setPaidAt(Instant.now());
        return toResponse(invoiceRepository.save(inv));
    }

    @Transactional
    public void delete(UUID id) {
        if (!invoiceRepository.existsById(id)) throw new NotFoundException("Счёт не найден");
        invoiceRepository.deleteById(id);
    }

    public InvoiceStatsResponse getStats() {
        long total = invoiceRepository.count();
        long unpaid = invoiceRepository.countByStatus("SENT");
        long overdue = invoiceRepository.countByStatus("OVERDUE");
        BigDecimal paidMonth = invoiceRepository.sumPaidCurrentMonth();
        return new InvoiceStatsResponse(total, unpaid, overdue,
            paidMonth != null ? paidMonth : BigDecimal.ZERO);
    }

    private void applyFields(InvoiceEntity inv, InvoiceRequest req) {
        if (req.getClientId() != null) {
            inv.setClient(clientRepository.findById(req.getClientId())
                .orElseThrow(() -> new NotFoundException("Клиент не найден")));
        }
        if (req.getBookingId() != null) {
            inv.setBooking(bookingRepository.findById(req.getBookingId())
                .orElseThrow(() -> new NotFoundException("Бронирование не найдено")));
        }
        if (req.getStatus() != null) inv.setStatus(req.getStatus());
        BigDecimal amount = req.getAmount() != null ? req.getAmount() : BigDecimal.ZERO;
        BigDecimal taxPct = req.getTaxPercent() != null ? req.getTaxPercent() : BigDecimal.ZERO;
        BigDecimal taxAmount = amount.multiply(taxPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        inv.setAmount(amount);
        inv.setTaxPercent(taxPct);
        inv.setTaxAmount(taxAmount);
        inv.setTotalAmount(amount.add(taxAmount));
        inv.setCurrency(req.getCurrency() != null ? req.getCurrency() : "USD");
        inv.setDueDate(req.getDueDate());
        inv.setNotes(req.getNotes());
        inv.setItems(req.getItems());
    }

    private InvoiceResponse toResponse(InvoiceEntity inv) {
        InvoiceResponse r = new InvoiceResponse();
        r.setId(inv.getId());
        r.setInvoiceNumber(inv.getInvoiceNumber());
        if (inv.getClient() != null) {
            r.setClientId(inv.getClient().getId());
            r.setClientName(inv.getClient().getFirstName() + " " + inv.getClient().getLastName());
        }
        if (inv.getBooking() != null) {
            r.setBookingId(inv.getBooking().getId());
            r.setBookingNumber(inv.getBooking().getBookingNumber());
        }
        r.setStatus(inv.getStatus());
        r.setAmount(inv.getAmount());
        r.setTaxAmount(inv.getTaxAmount());
        r.setTotalAmount(inv.getTotalAmount());
        r.setTaxPercent(inv.getTaxPercent());
        r.setCurrency(inv.getCurrency());
        r.setDueDate(inv.getDueDate());
        r.setPaidAt(inv.getPaidAt());
        r.setItems(inv.getItems());
        r.setNotes(inv.getNotes());
        r.setCreatedAt(inv.getCreatedAt());
        r.setUpdatedAt(inv.getUpdatedAt());
        return r;
    }
}
