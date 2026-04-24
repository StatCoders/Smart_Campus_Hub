package com.smartcampus.backend.service.notification;

import com.smartcampus.backend.dto.notification.NotificationPreferenceDto;
import com.smartcampus.backend.model.notification.NotificationPreference;
import com.smartcampus.backend.repository.notification.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;

    public NotificationPreference getPreferences(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));
    }

    public NotificationPreference updatePreferences(Long userId, NotificationPreferenceDto dto) {
        NotificationPreference preference = getPreferences(userId);
        
        preference.setBookingEnabled(dto.isBookingEnabled());
        preference.setTicketEnabled(dto.isTicketEnabled());
        preference.setSystemEnabled(dto.isSystemEnabled());
        preference.setMuteAll(dto.isMuteAll());
        preference.setHighPriorityOnly(dto.isHighPriorityOnly());

        return preferenceRepository.save(preference);
    }

    public NotificationPreference createDefaultPreferences(Long userId) {
        if (preferenceRepository.findByUserId(userId).isPresent()) {
            return preferenceRepository.findByUserId(userId).get();
        }

        NotificationPreference preference = NotificationPreference.builder()
                .userId(userId)
                .bookingEnabled(true)
                .ticketEnabled(true)
                .systemEnabled(true)
                .muteAll(false)
                .highPriorityOnly(false)
                .build();

        return preferenceRepository.save(preference);
    }
}
