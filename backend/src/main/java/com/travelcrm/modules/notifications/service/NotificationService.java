package com.travelcrm.modules.notifications.service;

import com.travelcrm.config.UserPrincipal;
import com.travelcrm.modules.auth.Role;
import com.travelcrm.modules.auth.UserEntity;
import com.travelcrm.modules.auth.UserRepository;
import com.travelcrm.modules.notifications.NotificationEntity;
import com.travelcrm.modules.notifications.NotificationRepository;
import com.travelcrm.modules.notifications.dto.NotificationRequest;
import com.travelcrm.modules.notifications.dto.NotificationResponse;
import com.travelcrm.shared.exception.BadRequestException;
import com.travelcrm.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public Page<NotificationResponse> findMine(Pageable pageable, UserPrincipal currentUser) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(currentUser.getId(), pageable)
            .map(this::toResponse);
    }

    public long unreadCount(UserPrincipal currentUser) {
        return notificationRepository.countByRecipientIdAndReadAtIsNull(currentUser.getId());
    }

    @Transactional
    public NotificationResponse broadcast(NotificationRequest request, UserPrincipal currentUser) {
        if (currentUser.getRole() != Role.SUPER_ADMIN) {
            throw new BadRequestException("Недостаточно прав для отправки уведомлений");
        }
        UserEntity sender = userRepository.findById(currentUser.getId())
            .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
        List<UserEntity> recipients = userRepository.findAll().stream()
            .filter(UserEntity::isActive)
            .toList();
        if (recipients.isEmpty()) {
            throw new BadRequestException("Нет активных пользователей для отправки уведомления");
        }

        NotificationEntity first = null;
        for (UserEntity recipient : recipients) {
            NotificationEntity notification = new NotificationEntity();
            notification.setRecipient(recipient);
            notification.setCreatedBy(sender);
            notification.setType(request.getType() != null ? request.getType() : "system");
            notification.setTitle(request.getTitle());
            notification.setBody(request.getBody());
            notification = notificationRepository.save(notification);
            if (first == null) {
                first = notification;
            }
        }
        return toResponse(first);
    }

    @Transactional
    public NotificationResponse markRead(UUID id, UserPrincipal currentUser) {
        NotificationEntity notification = notificationRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Уведомление не найдено"));
        if (!notification.getRecipient().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.SUPER_ADMIN) {
            throw new BadRequestException("Недостаточно прав");
        }
        notification.setReadAt(Instant.now());
        return toResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllRead(UserPrincipal currentUser) {
        List<NotificationEntity> mine = notificationRepository.findByRecipientIdAndReadAtIsNullOrderByCreatedAtDesc(currentUser.getId());
        for (NotificationEntity notification : mine) {
            notification.setReadAt(Instant.now());
        }
        if (!mine.isEmpty()) {
            notificationRepository.saveAll(mine);
        }
    }

    @Transactional
    public void createForUser(UUID recipientId, String type, String title, String body, UUID createdById) {
        UserEntity recipient = userRepository.findById(recipientId)
            .orElseThrow(() -> new NotFoundException("Получатель не найден"));
        UserEntity sender = createdById != null
            ? userRepository.findById(createdById).orElse(null)
            : null;

        NotificationEntity notification = new NotificationEntity();
        notification.setRecipient(recipient);
        notification.setCreatedBy(sender);
        notification.setType(type != null && !type.isBlank() ? type : "system");
        notification.setTitle(title);
        notification.setBody(body);
        notificationRepository.save(notification);
    }

    private NotificationResponse toResponse(NotificationEntity notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setType(notification.getType());
        response.setTitle(notification.getTitle());
        response.setBody(notification.getBody());
        response.setRead(notification.getReadAt() != null);
        response.setReadAt(notification.getReadAt());
        response.setCreatedAt(notification.getCreatedAt());
        if (notification.getRecipient() != null) {
            response.setRecipientId(notification.getRecipient().getId());
            response.setRecipientName(notification.getRecipient().getFullName());
        }
        if (notification.getCreatedBy() != null) {
            response.setCreatedById(notification.getCreatedBy().getId());
            response.setCreatedByName(notification.getCreatedBy().getFullName());
        }
        return response;
    }
}
