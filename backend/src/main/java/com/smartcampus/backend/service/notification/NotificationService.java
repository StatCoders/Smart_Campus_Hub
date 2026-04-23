package com.smartcampus.backend.service.notification;

import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.notification.Notification;
import com.smartcampus.backend.model.notification.NotificationPriority;
import com.smartcampus.backend.model.notification.NotificationType;
import com.smartcampus.backend.model.notification.NotificationPreference;
import com.smartcampus.backend.repository.notification.NotificationRepository;
import com.smartcampus.backend.repository.notification.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;

    public Notification createNotification(Long userId, String message, NotificationType type) {
        // Check preferences
        Optional<NotificationPreference> prefsOpt = preferenceRepository.findByUserId(userId);
        if (prefsOpt.isPresent()) {
            NotificationPreference prefs = prefsOpt.get();
            if (prefs.isMuteAll()) return null;

            boolean enabled = switch (type) {
                case BOOKING -> prefs.isBookingEnabled();
                case TICKET -> prefs.isTicketEnabled();
                case SYSTEM -> prefs.isSystemEnabled();
                case COMMENT -> prefs.isTicketEnabled();
            };

            if (!enabled) return null;
        }

        // Assign priority based on type
        NotificationPriority priority = switch (type) {
            case TICKET -> NotificationPriority.HIGH;
            case BOOKING -> NotificationPriority.MEDIUM;
            case SYSTEM -> NotificationPriority.LOW;
            case COMMENT -> NotificationPriority.MEDIUM;
        };

        Notification notification = Notification.builder()
                .userId(userId)
                .message(message)
                .type(type)
                .priority(priority)
                .isRead(false)
                .build();

        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public Notification getNotificationById(Long notificationId) {
        return findNotificationById(notificationId);
    }

    public Notification markAsRead(Long notificationId) {
        Notification notification = findNotificationById(notificationId);
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadFalse(userId);

        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    private Notification findNotificationById(Long notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found with id: " + notificationId));
    }

    public void deleteNotification(Long notificationId) {
        Notification notification = findNotificationById(notificationId);
        notificationRepository.delete(notification);
    }
}
