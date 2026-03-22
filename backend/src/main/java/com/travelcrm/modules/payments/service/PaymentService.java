package com.travelcrm.modules.payments.service;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.auth.UserRepository;
import com.travelcrm.modules.bookings.BookingRepository;
import com.travelcrm.modules.clients.ClientRepository;
import com.travelcrm.modules.payments.PaymentEntity;
import com.travelcrm.modules.payments.PaymentRepository;
import com.travelcrm.modules.payments.dto.PaymentRequest;
import com.travelcrm.modules.payments.dto.PaymentResponse;
import com.travelcrm.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    public List<PaymentResponse> findByBooking(UUID bookingId) {
        return paymentRepository.findByBookingId(bookingId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public PaymentResponse create(PaymentRequest req, UserPrincipal currentUser) {
        PaymentEntity payment = new PaymentEntity();
        bookingRepository.findById(req.getBookingId()).ifPresent(payment::setBooking);
        clientRepository.findById(req.getClientId()).ifPresent(payment::setClient);
        userRepository.findById(currentUser.getId()).ifPresent(payment::setCreatedBy);
        payment.setAmount(req.getAmount());
        payment.setCurrency(req.getCurrency() != null ? req.getCurrency() : "USD");
        payment.setType(req.getType());
        payment.setDirection(req.getDirection());
        payment.setMethod(req.getMethod());
        payment.setStatus(req.getStatus() != null ? req.getStatus() : "COMPLETED");
        payment.setPaidAt(req.getPaidAt() != null ? req.getPaidAt() : Instant.now());
        payment.setDueDate(req.getDueDate());
        payment.setReference(req.getReference());
        payment.setNotes(req.getNotes());
        return toResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse updateStatus(UUID id, String status) {
        PaymentEntity payment = paymentRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Платёж не найден"));
        payment.setStatus(status);
        if ("COMPLETED".equals(status)) {
            payment.setPaidAt(Instant.now());
        }
        return toResponse(paymentRepository.save(payment));
    }

    private PaymentResponse toResponse(PaymentEntity p) {
        PaymentResponse r = new PaymentResponse();
        r.setId(p.getId());
        r.setAmount(p.getAmount());
        r.setCurrency(p.getCurrency());
        r.setType(p.getType());
        r.setDirection(p.getDirection());
        r.setMethod(p.getMethod());
        r.setStatus(p.getStatus());
        r.setPaidAt(p.getPaidAt());
        r.setDueDate(p.getDueDate());
        r.setReference(p.getReference());
        r.setNotes(p.getNotes());
        r.setCreatedAt(p.getCreatedAt());
        if (p.getBooking() != null) {
            r.setBookingId(p.getBooking().getId());
            r.setBookingNumber(p.getBooking().getBookingNumber());
        }
        if (p.getClient() != null) {
            r.setClientId(p.getClient().getId());
            r.setClientName(p.getClient().getFirstName() + " " + p.getClient().getLastName());
        }
        return r;
    }
}
