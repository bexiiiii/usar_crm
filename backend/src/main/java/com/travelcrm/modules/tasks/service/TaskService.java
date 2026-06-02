package com.travelcrm.modules.tasks.service;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.auth.Role;
import com.travelcrm.modules.auth.UserRepository;
import com.travelcrm.modules.bookings.BookingRepository;
import com.travelcrm.modules.clients.ClientRepository;
import com.travelcrm.modules.leads.LeadRepository;
import com.travelcrm.modules.notifications.service.NotificationService;
import com.travelcrm.modules.tasks.TaskEntity;
import com.travelcrm.modules.tasks.TaskRepository;
import com.travelcrm.modules.tasks.dto.TaskRequest;
import com.travelcrm.modules.tasks.dto.TaskResponse;
import com.travelcrm.shared.exception.BadRequestException;
import com.travelcrm.shared.exception.NotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final ClientRepository clientRepository;
    private final LeadRepository leadRepository;
    private final NotificationService notificationService;

    public Page<TaskResponse> findAll(UUID assignedTo, String status, String priority, Pageable pageable, UserPrincipal currentUser) {
        if (currentUser.getRole() == Role.MANAGER) {
            assignedTo = currentUser.getId();
        }
        final List<String> statuses = status != null && !status.isBlank()
            ? Arrays.stream(status.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList()
            : List.of();
        final UUID finalAssignedTo = assignedTo;
        Specification<TaskEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (finalAssignedTo != null) predicates.add(cb.equal(root.get("assignedTo").get("id"), finalAssignedTo));
            if (!statuses.isEmpty()) predicates.add(root.get("status").in(statuses));
            if (priority != null) predicates.add(cb.equal(root.get("priority"), priority));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return taskRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional
    public TaskResponse create(TaskRequest req, UserPrincipal currentUser) {
        TaskEntity task = new TaskEntity();
        applyRequest(task, req, currentUser);
        TaskEntity saved = taskRepository.save(task);
        if (saved.getAssignedTo() != null) {
            notificationService.createForUser(
                saved.getAssignedTo().getId(),
                "task",
                "Новая задача",
                "Вам назначена задача: " + saved.getTitle(),
                currentUser.getId()
            );
        }
        return toResponse(saved);
    }

    @Transactional
    public TaskResponse updateStatus(UUID id, String status, UserPrincipal currentUser) {
        TaskEntity task = taskRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Задача не найдена"));
        boolean isAssignee = task.getAssignedTo() != null && task.getAssignedTo().getId().equals(currentUser.getId());
        if (currentUser.getRole() != Role.SUPER_ADMIN && !isAssignee) {
            throw new BadRequestException("Недостаточно прав для изменения этой задачи");
        }
        task.setStatus(status);
        if ("DONE".equals(status)) {
            task.setCompletedAt(Instant.now());
        } else {
            task.setCompletedAt(null);
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
        task.setDueDate(parseDueDate(req.getDueDate()));
        userRepository.findById(currentUser.getId()).ifPresent(task::setCreatedBy);
        UUID assignedTo = req.getAssignedTo();
        boolean canAssignTasks = currentUser.getRole() == Role.SUPER_ADMIN
            || Boolean.TRUE.equals(currentUser.getPermissions() != null ? currentUser.getPermissions().get("assign_tasks") : null);
        if (currentUser.getRole() == Role.MANAGER && !canAssignTasks) {
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

    private Instant parseDueDate(String dueDate) {
        if (dueDate == null || dueDate.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(dueDate);
        } catch (DateTimeException ignored) {
        }
        try {
            return LocalDateTime.parse(dueDate)
                .atZone(ZoneId.systemDefault())
                .toInstant();
        } catch (DateTimeException e) {
            throw new BadRequestException("Неверный формат срока задачи");
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
        if (t.getCreatedBy() != null) {
            r.setCreatedByName(t.getCreatedBy().getFullName());
        }
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
