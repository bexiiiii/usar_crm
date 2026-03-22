package com.travelcrm.modules.tasks.service;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.auth.Role;
import com.travelcrm.modules.auth.UserRepository;
import com.travelcrm.modules.bookings.BookingRepository;
import com.travelcrm.modules.clients.ClientRepository;
import com.travelcrm.modules.leads.LeadRepository;
import com.travelcrm.modules.tasks.TaskEntity;
import com.travelcrm.modules.tasks.TaskRepository;
import com.travelcrm.modules.tasks.dto.TaskRequest;
import com.travelcrm.modules.tasks.dto.TaskResponse;
import com.travelcrm.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final ClientRepository clientRepository;
    private final LeadRepository leadRepository;

    public Page<TaskResponse> findAll(UUID assignedTo, String status, String priority, Pageable pageable, UserPrincipal currentUser) {
        if (currentUser.getRole() == Role.MANAGER) {
            assignedTo = currentUser.getId();
        }
        return taskRepository.findWithFilters(assignedTo, status, priority, pageable).map(this::toResponse);
    }

    @Transactional
    public TaskResponse create(TaskRequest req, UserPrincipal currentUser) {
        TaskEntity task = new TaskEntity();
        applyRequest(task, req, currentUser);
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateStatus(UUID id, String status) {
        TaskEntity task = taskRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Задача не найдена"));
        task.setStatus(status);
        if ("DONE".equals(status)) {
            task.setCompletedAt(Instant.now());
        }
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public void delete(UUID id) {
        taskRepository.deleteById(id);
    }

    private void applyRequest(TaskEntity task, TaskRequest req, UserPrincipal currentUser) {
        task.setTitle(req.getTitle());
        task.setDescription(req.getDescription());
        task.setStatus(req.getStatus() != null ? req.getStatus() : "TODO");
        task.setPriority(req.getPriority() != null ? req.getPriority() : "MEDIUM");
        task.setDueDate(req.getDueDate());
        userRepository.findById(currentUser.getId()).ifPresent(task::setCreatedBy);
        UUID assignedTo = req.getAssignedTo();
        if (currentUser.getRole() == Role.MANAGER) {
            assignedTo = currentUser.getId();
        }
        if (assignedTo != null) {
            userRepository.findById(assignedTo).ifPresent(task::setAssignedTo);
        }
        if (req.getRelatedBookingId() != null) {
            bookingRepository.findById(req.getRelatedBookingId()).ifPresent(task::setRelatedBooking);
        }
        if (req.getRelatedClientId() != null) {
            clientRepository.findById(req.getRelatedClientId()).ifPresent(task::setRelatedClient);
        }
        if (req.getRelatedLeadId() != null) {
            leadRepository.findById(req.getRelatedLeadId()).ifPresent(task::setRelatedLead);
        }
    }

    private TaskResponse toResponse(TaskEntity t) {
        TaskResponse r = new TaskResponse();
        r.setId(t.getId());
        r.setTitle(t.getTitle());
        r.setDescription(t.getDescription());
        r.setStatus(t.getStatus());
        r.setPriority(t.getPriority());
        r.setDueDate(t.getDueDate());
        r.setCompletedAt(t.getCompletedAt());
        r.setCreatedAt(t.getCreatedAt());
        r.setUpdatedAt(t.getUpdatedAt());
        if (t.getAssignedTo() != null) {
            r.setAssignedToId(t.getAssignedTo().getId());
            r.setAssignedToName(t.getAssignedTo().getFullName());
        }
        if (t.getRelatedBooking() != null) {
            r.setRelatedBookingId(t.getRelatedBooking().getId());
            r.setRelatedBookingNumber(t.getRelatedBooking().getBookingNumber());
        }
        if (t.getRelatedClient() != null) {
            r.setRelatedClientId(t.getRelatedClient().getId());
            r.setRelatedClientName(t.getRelatedClient().getFirstName() + " " + t.getRelatedClient().getLastName());
        }
        return r;
    }
}
