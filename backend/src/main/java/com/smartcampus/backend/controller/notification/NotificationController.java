package com.smartcampus.backend.controller.notification;

import com.smartcampus.backend.dto.notification.NotificationCreateRequest;
import com.smartcampus.backend.dto.notification.NotificationDto;
import com.smartcampus.backend.dto.notification.UnreadCountDto;
import com.smartcampus.backend.exception.ApiResponse;
import com.smartcampus.backend.model.auth.User;
import com.smartcampus.backend.model.notification.Notification;
import com.smartcampus.backend.service.auth.UserService;
import com.smartcampus.backend.model.notification.NotificationPriority;
import com.smartcampus.backend.model.notification.NotificationType;
import com.smartcampus.backend.service.notification.NotificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Validated
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NotificationDto>> createNotification(
            @Valid @RequestBody NotificationCreateRequest request) {

        validateCurrentUserAccess(request.getUserId());

        Notification notification = notificationService.createNotification(
                request.getUserId(),
                request.getMessage().trim(),
                request.getType()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(
                        true,
                        HttpStatus.CREATED.value(),
                        "Notification created successfully",
                        mapToDto(notification)
                ));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getUserNotifications(
            @RequestParam(required = false) NotificationPriority priority) {

        User currentUser = userService.getCurrentUser();

        List<NotificationDto> notifications = notificationService.getUserNotifications(currentUser.getId(), priority)
                .stream()
                .map(this::mapToDto)
                .toList();

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                HttpStatus.OK.value(),
                "Notifications retrieved successfully",
                notifications
        ));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getAllNotifications(
            @RequestParam(required = false) NotificationPriority priority,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) Long userId) {

        List<NotificationDto> notifications = notificationService.getAllNotifications(priority, type, userId)
                .stream()
                .map(this::mapToDto)
                .toList();

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                HttpStatus.OK.value(),
                "All notifications retrieved successfully",
                notifications
        ));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NotificationDto>> markAsRead(
            @PathVariable @Positive(message = "Notification ID must be a positive number") Long id) {

        Notification existingNotification = notificationService.getNotificationById(id);
        validateCurrentUserAccess(existingNotification.getUserId());

        Notification updatedNotification = notificationService.markAsRead(id);

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                HttpStatus.OK.value(),
                "Notification marked as read",
                mapToDto(updatedNotification)
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable @Positive(message = "Notification ID must be a positive number") Long id) {

        Notification existingNotification = notificationService.getNotificationById(id);
        validateCurrentUserAccess(existingNotification.getUserId());

        notificationService.deleteNotification(id);

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                HttpStatus.OK.value(),
                "Notification deleted successfully",
                null
        ));
    }

    @PutMapping("/user/{userId}/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @PathVariable @Positive(message = "User ID must be a positive number") Long userId) {

        validateCurrentUserAccess(userId);
        notificationService.markAllAsRead(userId);

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                HttpStatus.OK.value(),
                "All notifications marked as read",
                null
        ));
    }

    @GetMapping("/user/{userId}/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UnreadCountDto>> getUnreadCount(
            @PathVariable @Positive(message = "User ID must be a positive number") Long userId) {

        validateCurrentUserAccess(userId);

        UnreadCountDto unreadCount = UnreadCountDto.builder()
                .userId(userId)
                .unreadCount(notificationService.getUnreadCount(userId))
                .build();

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                HttpStatus.OK.value(),
                "Unread notification count retrieved successfully",
                unreadCount
        ));
    }

    private void validateCurrentUserAccess(Long userId) {
        User currentUser = userService.getCurrentUser();

        if (!currentUser.getId().equals(userId)) {
            throw new AccessDeniedException("You can only access your own notifications");
        }
    }

    private NotificationDto mapToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .message(notification.getMessage())
                .type(notification.getType())
                .priority(notification.getPriority())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
