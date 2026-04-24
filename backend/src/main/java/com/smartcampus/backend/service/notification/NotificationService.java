package com.smartcampus.backend.service.notification;

import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.notification.Notification;
import com.smartcampus.backend.model.notification.NotificationPriority;
import com.smartcampus.backend.model.notification.NotificationType;
import com.smartcampus.backend.model.notification.ReferenceType;
import com.smartcampus.backend.repository.notification.NotificationRepository;
import com.smartcampus.backend.service.notification.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.smartcampus.backend.repository.maintenance.TicketRepository;
import com.smartcampus.backend.repository.booking.BookingRepository;
import com.smartcampus.backend.model.maintenance.Priority;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceService preferenceService;
    
    @org.springframework.context.annotation.Lazy
    private final com.smartcampus.backend.repository.auth.UserRepository userRepository;

    public Notification createNotification(Long userId, String message, NotificationType type) {
        return createNotification(userId, message, type, null, null);
    }

    public Notification createNotification(Long userId, String message, NotificationType type, Long referenceId, ReferenceType referenceType) {
        // 1. Determine priority using the standardized mapping
        NotificationPriority priority = determinePriority(type);

        // 2. Check user preferences (Admins always get TICKET alerts)
        if (!shouldSendNotification(userId, type, priority)) {
            return null;
        }

        Notification notification = Notification.builder()
                .userId(userId)
                .message(message)
                .type(type)
                .priority(priority)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .isRead(false)
                .build();

        return notificationRepository.save(notification);
    }

    private NotificationPriority determinePriority(NotificationType type) {
        return switch (type) {
            case TICKET, COMMENT -> NotificationPriority.HIGH;
            case BOOKING -> NotificationPriority.MEDIUM;
            case SYSTEM -> NotificationPriority.LOW;
            default -> NotificationPriority.LOW;
        };
    }

    private boolean shouldSendNotification(Long userId, NotificationType type, NotificationPriority priority) {
        // ADMINS always get TICKET notifications regardless of settings
        var user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getRole() == com.smartcampus.backend.model.auth.Role.ADMIN && type == NotificationType.TICKET) {
            return true;
        }

        var preferences = preferenceService.getPreferences(userId);

        if (preferences.isMuteAll()) {
            return false;
        }

        // 1. Critical status updates for bookings (Approved/Rejected) should bypass 
        // the general "enabled" check AND the "high priority only" filter.
        if (type == NotificationType.BOOKING) {
            return true;
        }

        // 2. Otherwise, respect the highPriorityOnly setting
        if (preferences.isHighPriorityOnly() && priority != NotificationPriority.HIGH) {
            return false;
        }

        return switch (type) {
            case TICKET -> preferences.isTicketEnabled();
            case SYSTEM -> preferences.isSystemEnabled();
            default -> true;
        };
    }

    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications(Long userId, NotificationPriority priority) {
        if (priority != null) {
            return notificationRepository.findByUserIdAndPriorityOrderByCreatedAtDesc(userId, priority);
        }
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<Notification> getAllNotifications(NotificationPriority priority, NotificationType type, Long userId) {
        return notificationRepository.findAllWithFilters(userId, priority, type);
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
