package com.smartcampus.backend.dto.notification;

import com.smartcampus.backend.model.notification.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationCreateRequest {

    @NotNull(message = "User ID is required")
    @Positive(message = "User ID must be a positive number")
    private Long userId;

    @NotBlank(message = "Message is required")
    private String message;

    @NotNull(message = "Notification type is required")
    private NotificationType type;
}
