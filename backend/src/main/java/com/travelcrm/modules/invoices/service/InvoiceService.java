package com.travelcrm.modules.invoices.service;

import com.travelcrm.modules.bookings.BookingRepository;
import com.travelcrm.modules.clients.ClientRepository;
import com.travelcrm.modules.invoices.InvoiceEntity;
import com.travelcrm.modules.invoices.InvoiceRepository;
import com.travelcrm.modules.invoices.dto.InvoiceRequest;
import com.travelcrm.modules.invoices.dto.InvoiceResponse;
import com.travelcrm.modules.invoices.dto.InvoiceStatsResponse;
import com.travelcrm.shared.exception.BadRequestException;
import com.travelcrm.shared.exception.NotFoundException;
import com.travelcrm.shared.pdf.PdfDocumentRenderer;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
        if ("PAID".equals(inv.getStatus())) {
            throw new BadRequestException("Оплаченный счёт нельзя редактировать");
        }
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

    public PdfFile generatePdf(UUID id) {
        InvoiceEntity inv = invoiceRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Счёт не найден"));
        List<BufferedImage> pages = buildInvoicePages(inv);
        byte[] bytes = PdfDocumentRenderer.render(pages);
        return new PdfFile("invoice-" + inv.getInvoiceNumber() + ".pdf", bytes);
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

    private List<BufferedImage> buildInvoicePages(InvoiceEntity invoice) {
        final int width = 1240;
        final int height = 1754;
        final int left = 76;
        final int right = width - 76;
        final int top = 74;
        final int bottom = height - 76;
        final int contentWidth = right - left;
        final int maxRowsPerPage = 12;

        List<Map<String, Object>> items = invoice.getItems() != null ? invoice.getItems() : List.<Map<String, Object>>of();
        int totalPages = Math.max(1, (int) Math.ceil(items.size() / (double) maxRowsPerPage));
        List<BufferedImage> pages = new ArrayList<>();

        for (int pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = image.createGraphics();
            configureGraphics(g);
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, width, height);

            g.setColor(new Color(43, 91, 240));
            g.fillRoundRect(left, 40, 210, 10, 10, 10);
            g.setColor(new Color(26, 35, 50));
            g.setFont(new Font("SansSerif", Font.BOLD, 34));
            g.drawString("Счёт на оплату", left, top + 35);

            g.setFont(new Font("SansSerif", Font.PLAIN, 15));
            drawKeyValue(g, left, top + 82, "Номер счёта", invoice.getInvoiceNumber(), contentWidth / 2 - 20);
            drawKeyValue(g, left + contentWidth / 2, top + 82, "Статус", invoice.getStatus(), contentWidth / 2);
            drawKeyValue(g, left, top + 126, "Клиент", invoice.getClient() != null ? invoice.getClient().getFirstName() + " " + invoice.getClient().getLastName() : "—", contentWidth / 2 - 20);
            drawKeyValue(g, left + contentWidth / 2, top + 126, "Бронь", invoice.getBooking() != null ? invoice.getBooking().getBookingNumber() : "—", contentWidth / 2);
            drawKeyValue(g, left, top + 170, "Срок оплаты", invoice.getDueDate() != null ? invoice.getDueDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")) : "—", contentWidth / 2 - 20);
            drawKeyValue(g, left + contentWidth / 2, top + 170, "Валюта", invoice.getCurrency(), contentWidth / 2);

            int y = top + 240;
            g.setFont(new Font("SansSerif", Font.BOLD, 15));
            g.drawString("Позиции счёта", left, y);
            y += 18;
            g.setColor(new Color(226, 232, 244));
            g.fillRect(left, y, contentWidth, 2);
            y += 28;

            g.setFont(new Font("SansSerif", Font.PLAIN, 13));
            g.setColor(new Color(107, 122, 154));
            g.drawString("Описание", left, y);
            g.drawString("Кол-во", left + 520, y);
            g.drawString("Цена", left + 645, y);
            g.drawString("Сумма", left + 820, y);
            y += 14;
            g.setColor(new Color(226, 232, 244));
            g.fillRect(left, y, contentWidth, 1);
            y += 24;

            int start = pageIndex * maxRowsPerPage;
            int end = Math.min(items.size(), start + maxRowsPerPage);
            for (int i = start; i < end; i++) {
                Map<String, Object> item = items.get(i);
                String desc = stringValue(item.get("description"));
                String qty = stringValue(item.get("quantity"));
                String unit = moneyValue(item.get("unitPrice"), invoice.getCurrency());
                String total = moneyValue(item.get("total"), invoice.getCurrency());

                g.setColor(new Color(26, 35, 50));
                g.setFont(new Font("SansSerif", Font.PLAIN, 13));
                drawWrappedString(g, desc, left, y, 480, 18);
                g.setFont(new Font("SansSerif", Font.PLAIN, 13));
                g.drawString(qty, left + 520, y);
                g.drawString(unit, left + 645, y);
                g.setFont(new Font("SansSerif", Font.BOLD, 13));
                g.drawString(total, left + 820, y);
                g.setFont(new Font("SansSerif", Font.PLAIN, 13));
                y += 48;
                g.setColor(new Color(241, 243, 249));
                g.fillRect(left, y - 10, contentWidth, 1);
            }

            int totalsTop = bottom - 220;
            g.setColor(new Color(226, 232, 244));
            g.fillRoundRect(left + contentWidth - 360, totalsTop, 360, 170, 18, 18);
            g.setColor(new Color(26, 35, 50));
            g.setFont(new Font("SansSerif", Font.BOLD, 16));
            g.drawString("Итоги", left + contentWidth - 330, totalsTop + 30);
            g.setFont(new Font("SansSerif", Font.PLAIN, 14));
            drawKeyValue(g, left + contentWidth - 330, totalsTop + 68, "Сумма", moneyValue(invoice.getAmount(), invoice.getCurrency()), 300);
            drawKeyValue(g, left + contentWidth - 330, totalsTop + 102, "НДС", moneyValue(invoice.getTaxAmount(), invoice.getCurrency()), 300);
            g.setFont(new Font("SansSerif", Font.BOLD, 16));
            g.drawString("Итого: " + moneyValue(invoice.getTotalAmount(), invoice.getCurrency()), left + contentWidth - 330, totalsTop + 142);

            if (invoice.getNotes() != null && !invoice.getNotes().isBlank()) {
                g.setFont(new Font("SansSerif", Font.PLAIN, 13));
                g.setColor(new Color(107, 122, 154));
                drawWrappedString(g, "Комментарий: " + invoice.getNotes(), left, bottom - 18, contentWidth - 420, 16);
            }

            g.dispose();
            pages.add(image);
        }
        return pages;
    }

    private void configureGraphics(Graphics2D g) {
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
    }

    private void drawKeyValue(Graphics2D g, int x, int y, String label, String value, int width) {
        g.setColor(new Color(107, 122, 154));
        g.setFont(new Font("SansSerif", Font.PLAIN, 12));
        g.drawString(label, x, y);
        g.setColor(new Color(26, 35, 50));
        g.setFont(new Font("SansSerif", Font.BOLD, 14));
        drawWrappedString(g, value, x, y + 20, width, 16);
    }

    private void drawWrappedString(Graphics2D g, String text, int x, int y, int maxWidth, int lineHeight) {
        if (text == null) {
            return;
        }
        String[] words = text.split("\\s+");
        StringBuilder line = new StringBuilder();
        int currentY = y;
        for (String word : words) {
            String candidate = line.length() == 0 ? word : line + " " + word;
            if (g.getFontMetrics().stringWidth(candidate) > maxWidth && line.length() > 0) {
                g.drawString(line.toString(), x, currentY);
                currentY += lineHeight;
                line = new StringBuilder(word);
            } else {
                line = new StringBuilder(candidate);
            }
        }
        if (line.length() > 0) {
            g.drawString(line.toString(), x, currentY);
        }
    }

    private String stringValue(Object value) {
        return value == null ? "—" : String.valueOf(value);
    }

    private String moneyValue(Object value, String currency) {
        if (value == null) {
            return "—";
        }
        BigDecimal amount = value instanceof BigDecimal bd
            ? bd
            : new BigDecimal(String.valueOf(value));
        return formatMoney(amount, currency);
    }

    private String formatMoney(BigDecimal amount, String currency) {
        if (amount == null) {
            amount = BigDecimal.ZERO;
        }
        return amount.setScale(0, RoundingMode.HALF_UP).toPlainString() + " " + currency;
    }

    public record PdfFile(String fileName, byte[] bytes) {}
}
