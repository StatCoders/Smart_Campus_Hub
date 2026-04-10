package com.smartcampus.backend.config;

import com.smartcampus.backend.service.facility.FacilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InitializationConfig {

    private final FacilityService facilityService;

    /**
     * Initialize booking status for all facilities when application starts
     * This ensures all existing facilities have correct booking_status based on their availability
     */
    @EventListener(ApplicationReadyEvent.class)
    public void initializeBookingStatus() {
        try {
            facilityService.initializeBookingStatus();
        } catch (Exception e) {
            // If facilities table doesn't exist yet or other issue, continue startup
        }
    }
}
