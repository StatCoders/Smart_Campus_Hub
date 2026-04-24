package com.smartcampus.backend.dto.notification;

import com.smartcampus.backend.model.notification.NotificationPriority;
import com.smartcampus.backend.model.notification.NotificationType;
import com.smartcampus.backend.model.notification.ReferenceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {

    private Long id;
    private Long userId;
    private String message;
    private NotificationType type;
    private NotificationPriority priority;
    private Long referenceId;
    private ReferenceType referenceType;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
