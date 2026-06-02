package com.travelcrm.modules.documents.service;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.auth.UserEntity;
import com.travelcrm.modules.auth.UserRepository;
import com.travelcrm.modules.bookings.BookingEntity;
import com.travelcrm.modules.bookings.BookingRepository;
import com.travelcrm.modules.clients.ClientEntity;
import com.travelcrm.modules.clients.ClientRepository;
import com.travelcrm.modules.documents.DocumentEntity;
import com.travelcrm.modules.documents.DocumentRepository;
import com.travelcrm.modules.documents.dto.DocumentResponse;
import com.travelcrm.shared.exception.NotFoundException;
import com.travelcrm.shared.pdf.PdfDocumentRenderer;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final BookingRepository bookingRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public Page<DocumentResponse> findAll(String search, String type, Pageable pageable) {
        Specification<DocumentEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("fileName")), like));
            }
            if (type != null && !type.isBlank()) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return documentRepository.findAll(spec, pageable).map(this::toResponse);
    }

    public DocumentResponse findById(UUID id) {
        DocumentEntity doc = documentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Документ не найден"));
        return toResponse(doc);
    }

    @Transactional
    public DocumentResponse upload(MultipartFile file, UUID bookingId, UUID clientId,
                                   String type, UserPrincipal currentUser) {
        try {
            Files.createDirectories(Paths.get(uploadDir));
            String storedFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            String filePath = uploadDir + "/" + storedFileName;
            Files.copy(file.getInputStream(), Paths.get(filePath), StandardCopyOption.REPLACE_EXISTING);

            DocumentEntity doc = new DocumentEntity();
            doc.setType(type);
            doc.setFileName(file.getOriginalFilename());
            doc.setFilePath(filePath);

            if (bookingId != null) {
                BookingEntity booking = bookingRepository.findById(bookingId).orElse(null);
                doc.setBooking(booking);
            }
            if (clientId != null) {
                ClientEntity client = clientRepository.findById(clientId).orElse(null);
                doc.setClient(client);
            }

            UserEntity generatedBy = userRepository.findById(currentUser.getId()).orElse(null);
            doc.setGeneratedBy(generatedBy);

            return toResponse(documentRepository.save(doc));
        } catch (IOException e) {
            throw new RuntimeException("Ошибка при загрузке файла", e);
        }
    }

    @Transactional
    public DocumentResponse generate(UUID bookingId, String type, UserPrincipal currentUser) {
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Бронирование не найдено"));

        DocumentEntity doc = new DocumentEntity();
        doc.setType(type);
        doc.setFileName(buildDraftFileName(type, booking.getBookingNumber()));
        doc.setBooking(booking);
        doc.setClient(booking.getClient());

        UserEntity generatedBy = userRepository.findById(currentUser.getId()).orElse(null);
        doc.setGeneratedBy(generatedBy);
        DocumentEntity saved = documentRepository.save(doc);
        ensureGeneratedPdf(saved);
        return toResponse(documentRepository.save(saved));
    }

    @Transactional
    public DownloadFile download(UUID id) {
        DocumentEntity doc = documentRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Документ не найден"));
        try {
            Path filePath = doc.getFilePath() != null ? Paths.get(doc.getFilePath()) : null;
            if (filePath != null && Files.exists(filePath)) {
                return new DownloadFile(doc.getFileName(), Files.readAllBytes(filePath), Files.probeContentType(filePath));
            }
            if (doc.getBooking() != null) {
                ensureGeneratedPdf(doc);
                documentRepository.save(doc);
                Path generated = Paths.get(doc.getFilePath());
                return new DownloadFile(doc.getFileName(), Files.readAllBytes(generated), Files.probeContentType(generated));
            }
            throw new NotFoundException("Файл документа не найден");
        } catch (IOException e) {
            throw new RuntimeException("Не удалось скачать документ", e);
        }
    }

    @Transactional
    public void delete(UUID id) {
        DocumentEntity doc = documentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Документ не найден"));
        String filePath = doc.getFilePath();
        documentRepository.deleteById(id);
        if (filePath != null) {
            try {
                Files.deleteIfExists(Paths.get(filePath));
            } catch (IOException ignored) {
            }
        }
    }

    private void ensureGeneratedPdf(DocumentEntity doc) {
        if (doc.getBooking() == null) {
            return;
        }
        try {
            Files.createDirectories(Paths.get(uploadDir));
            Path file = Paths.get(uploadDir, buildGeneratedFileName(doc.getType(), doc.getBooking().getBookingNumber(), doc.getId()));
            byte[] bytes = PdfDocumentRenderer.render(buildDocumentPages(doc));
            Files.write(file, bytes);
            doc.setFilePath(file.toString());
            doc.setFileName(file.getFileName().toString());
        } catch (IOException e) {
            throw new RuntimeException("Не удалось сформировать документ", e);
        }
    }

    private DocumentResponse toResponse(DocumentEntity doc) {
        DocumentResponse r = new DocumentResponse();
        r.setId(doc.getId());
        r.setType(doc.getType());
        r.setFileName(doc.getFileName());
        r.setFilePath(doc.getFilePath());
        r.setGeneratedAt(doc.getGeneratedAt());

        if (doc.getBooking() != null) {
            r.setBookingId(doc.getBooking().getId());
            r.setBookingNumber(doc.getBooking().getBookingNumber());
        }
        if (doc.getClient() != null) {
            r.setClientId(doc.getClient().getId());
            r.setClientName(doc.getClient().getFirstName() + " " + doc.getClient().getLastName());
        }
        if (doc.getGeneratedBy() != null) {
            r.setGeneratedById(doc.getGeneratedBy().getId());
            r.setGeneratedByName(doc.getGeneratedBy().getFullName());
        }
        return r;
    }

    private String buildGeneratedFileName(String type, String bookingNumber, UUID docId) {
        return type + "_" + bookingNumber + "_" + docId + ".pdf";
    }

    private String buildDraftFileName(String type, String bookingNumber) {
        return type + "_" + bookingNumber + ".pdf";
    }

    private List<BufferedImage> buildDocumentPages(DocumentEntity doc) {
        final int width = 1240;
        final int height = 1754;
        final int left = 76;
        final int right = width - 76;
        final int top = 74;
        final int contentWidth = right - left;

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        configureGraphics(g);
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, width, height);

        g.setColor(new Color(43, 91, 240));
        g.fillRoundRect(left, 40, 210, 10, 10, 10);
        g.setColor(new Color(26, 35, 50));
        g.setFont(new Font("SansSerif", Font.BOLD, 34));
        g.drawString(resolveDocumentTitle(doc.getType()), left, top + 35);

        g.setFont(new Font("SansSerif", Font.PLAIN, 15));
        drawKeyValue(g, left, top + 82, "Тип документа", resolveDocumentLabel(doc.getType()), contentWidth / 2 - 20);
        drawKeyValue(g, left + contentWidth / 2, top + 82, "Бронь", doc.getBooking() != null ? doc.getBooking().getBookingNumber() : "—", contentWidth / 2);
        drawKeyValue(g, left, top + 126, "Клиент", doc.getClient() != null ? doc.getClient().getFirstName() + " " + doc.getClient().getLastName() : "—", contentWidth / 2 - 20);
        drawKeyValue(g, left + contentWidth / 2, top + 126, "Менеджер", doc.getGeneratedBy() != null ? doc.getGeneratedBy().getFullName() : "—", contentWidth / 2);
        drawKeyValue(g, left, top + 170, "Дата", doc.getGeneratedAt() != null ? doc.getGeneratedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")) : "—", contentWidth / 2 - 20);
        drawKeyValue(g, left + contentWidth / 2, top + 170, "Направление", doc.getBooking() != null ? doc.getBooking().getDestination() : "—", contentWidth / 2);

        int y = top + 250;
        g.setFont(new Font("SansSerif", Font.BOLD, 15));
        g.drawString("Детали бронирования", left, y);
        y += 18;
        g.setColor(new Color(226, 232, 244));
        g.fillRect(left, y, contentWidth, 2);
        y += 28;

        g.setFont(new Font("SansSerif", Font.PLAIN, 14));
        Map<String, String> lines = new LinkedHashMap<>();
        lines.put("Даты поездки", bookingDates(doc));
        lines.put("Пункт сбора", doc.getBooking() != null ? nullSafe(doc.getBooking().getPickupLocation()) : "—");
        lines.put("Вылет из", doc.getBooking() != null ? nullSafe(doc.getBooking().getDepartureCity()) : "—");
        lines.put("Отель", doc.getBooking() != null ? nullSafe(doc.getBooking().getHotelName()) : "—");
        lines.put("Оператор", doc.getBooking() != null ? nullSafe(doc.getBooking().getTourOperator()) : "—");
        lines.put("Стоимость", doc.getBooking() != null ? money(doc.getBooking().getTotalPrice(), doc.getBooking().getCurrency()) : "—");
        lines.put("Особые запросы", doc.getBooking() != null ? nullSafe(doc.getBooking().getSpecialRequests()) : "—");

        for (Map.Entry<String, String> entry : lines.entrySet()) {
            g.setColor(new Color(107, 122, 154));
            g.drawString(entry.getKey(), left, y);
            g.setColor(new Color(26, 35, 50));
            drawWrappedString(g, entry.getValue(), left + 220, y, contentWidth - 220, 18);
            y += 44;
            g.setColor(new Color(241, 243, 249));
            g.fillRect(left, y - 12, contentWidth, 1);
        }

        g.setFont(new Font("SansSerif", Font.PLAIN, 12));
        g.setColor(new Color(107, 122, 154));
        g.drawString("Сформировано автоматически в Usar Travel CRM", left, height - 18);
        g.dispose();
        return List.of(image);
    }

    private String bookingDates(DocumentEntity doc) {
        if (doc.getBooking() == null) {
            return "—";
        }
        String departure = doc.getBooking().getDepartureDate() != null
            ? doc.getBooking().getDepartureDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))
            : "—";
        String returnDate = doc.getBooking().getReturnDate() != null
            ? doc.getBooking().getReturnDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))
            : "—";
        return departure + " - " + returnDate;
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
        if (text == null || text.isBlank()) {
            g.drawString("—", x, y);
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

    private String resolveDocumentTitle(String type) {
        return switch (type) {
            case "CONTRACT" -> "Договор с туристом";
            case "VOUCHER" -> "Ваучер";
            case "INVOICE" -> "Счёт из бронирования";
            case "TOURIST_MEMO" -> "Памятка туриста";
            case "PASSPORT_SCAN" -> "Паспортная копия";
            case "VISA" -> "Визовый документ";
            case "INSURANCE" -> "Страховой полис";
            case "TICKET" -> "Авиабилет";
            default -> "Документ";
        };
    }

    private String resolveDocumentLabel(String type) {
        return switch (type) {
            case "CONTRACT" -> "Договор";
            case "VOUCHER" -> "Ваучер";
            case "INVOICE" -> "Счёт";
            case "TOURIST_MEMO" -> "Памятка туриста";
            case "PASSPORT_SCAN" -> "Паспорт";
            case "VISA" -> "Виза";
            case "INSURANCE" -> "Страховка";
            case "TICKET" -> "Билет";
            default -> type;
        };
    }

    private String nullSafe(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }

    private String money(java.math.BigDecimal value, String currency) {
        if (value == null) {
            return "—";
        }
        return value.setScale(0, java.math.RoundingMode.HALF_UP).toPlainString() + " " + currency;
    }

    public record DownloadFile(String fileName, byte[] bytes, String contentType) {}
}
