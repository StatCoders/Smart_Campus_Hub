package com.smartcampus.backend.repository.notification;

import com.smartcampus.backend.model.notification.Notification;
import com.smartcampus.backend.model.notification.NotificationPriority;
import com.smartcampus.backend.model.notification.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndPriorityOrderByCreatedAtDesc(Long userId, NotificationPriority priority);

    List<Notification> findByUserIdAndIsReadFalse(Long userId);

    long countByUserIdAndIsReadFalse(Long userId);

    @Query("SELECT n FROM Notification n WHERE " +
           "(:userId IS NULL OR n.userId = :userId) AND " +
           "(:priority IS NULL OR n.priority = :priority) AND " +
           "(:type IS NULL OR n.type = :type) " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findAllWithFilters(
            @Param("userId") Long userId,
            @Param("priority") NotificationPriority priority,
            @Param("type") NotificationType type);
}
