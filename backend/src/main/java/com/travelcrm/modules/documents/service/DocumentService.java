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
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
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
        doc.setFileName(type + "_" + booking.getBookingNumber() + ".pdf");
        doc.setFilePath(null);
        doc.setBooking(booking);
        doc.setClient(booking.getClient());

        UserEntity generatedBy = userRepository.findById(currentUser.getId()).orElse(null);
        doc.setGeneratedBy(generatedBy);

        return toResponse(documentRepository.save(doc));
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
}
