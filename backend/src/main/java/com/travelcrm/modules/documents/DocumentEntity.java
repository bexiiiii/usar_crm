package com.travelcrm.modules.documents;

import com.travelcrm.modules.auth.UserEntity;
import com.travelcrm.modules.bookings.BookingEntity;
import com.travelcrm.modules.clients.ClientEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private BookingEntity booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private ClientEntity client;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @CreationTimestamp
    @Column(name = "generated_at")
    private Instant generatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by")
    private UserEntity generatedBy;
}
