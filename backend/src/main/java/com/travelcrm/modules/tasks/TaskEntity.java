package com.travelcrm.modules.tasks;

import com.travelcrm.modules.auth.UserEntity;
import com.travelcrm.modules.bookings.BookingEntity;
import com.travelcrm.modules.clients.ClientEntity;
import com.travelcrm.modules.leads.LeadEntity;
import com.travelcrm.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskEntity extends BaseEntity {
    @Column(nullable = false)
    private String title;

    private String description;

    private String status = "TODO";

    private String priority = "MEDIUM";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private UserEntity assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private UserEntity createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_booking_id")
    private BookingEntity relatedBooking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_client_id")
    private ClientEntity relatedClient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_lead_id")
    private LeadEntity relatedLead;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "completed_at")
    private Instant completedAt;
}
