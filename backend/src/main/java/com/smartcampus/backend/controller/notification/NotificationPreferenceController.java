package com.smartcampus.backend.controller.notification;

import com.smartcampus.backend.dto.notification.NotificationPreferenceDto;
import com.smartcampus.backend.exception.ApiResponse;
import com.smartcampus.backend.model.auth.User;
import com.smartcampus.backend.model.notification.NotificationPreference;
import com.smartcampus.backend.service.auth.UserService;
import com.smartcampus.backend.service.notification.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications/preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;
    private final UserService userService;

    @GetMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NotificationPreferenceDto>> getPreferences(@PathVariable Long userId) {
        validateCurrentUserAccess(userId);
        NotificationPreference preferences = preferenceService.getPreferences(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, HttpStatus.OK.value(), "Preferences retrieved successfully", mapToDto(preferences)));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NotificationPreferenceDto>> updatePreferences(
            @PathVariable Long userId, @RequestBody NotificationPreferenceDto dto) {
        validateCurrentUserAccess(userId);
        NotificationPreference preferences = preferenceService.updatePreferences(userId, dto);
        return ResponseEntity.ok(new ApiResponse<>(true, HttpStatus.OK.value(), "Preferences updated successfully", mapToDto(preferences)));
    }

    @PostMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<NotificationPreferenceDto>> createDefaultPreferences(@PathVariable Long userId) {
        validateCurrentUserAccess(userId);
        NotificationPreference preferences = preferenceService.createDefaultPreferences(userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, HttpStatus.CREATED.value(), "Default preferences created successfully", mapToDto(preferences)));
    }

    private void validateCurrentUserAccess(Long userId) {
        User currentUser = userService.getCurrentUser();
        if (!currentUser.getId().equals(userId)) {
            throw new AccessDeniedException("You can only access your own preferences");
        }
    }

    private NotificationPreferenceDto mapToDto(NotificationPreference prefs) {
        return NotificationPreferenceDto.builder()
                .userId(prefs.getUserId())
                .bookingEnabled(prefs.isBookingEnabled())
                .ticketEnabled(prefs.isTicketEnabled())
                .systemEnabled(prefs.isSystemEnabled())
                .muteAll(prefs.isMuteAll())
                .build();
    }
}
