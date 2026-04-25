package com.smartcampus.backend.dto.facility;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for 7-day facility occupancy data used in facility detail pages.
 * Aggregates approved bookings per day with user information and occupancy percentage.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OccupancyDataDto {
    
    @JsonProperty("resourceId")
    private Long resourceId;
    
    @JsonProperty("capacity")
    private Integer capacity;
    
    @JsonProperty("availabilityWindow")
    private String availabilityWindow; // e.g., "Mon-Fri 08:00-17:00"
    
    @JsonProperty("occupancyData")
    private List<DayOccupancyDto> occupancyData;
    
    /**
     * Daily occupancy breakdown with user bookings.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DayOccupancyDto {
        
        @JsonProperty("date")
        private LocalDate date;
        
        @JsonProperty("dayName")
        private String dayName; // e.g., "Monday", "Tuesday"
        
        @JsonProperty("bookings")
        private List<BookingUserDto> bookings;
        
        @JsonProperty("totalAttendees")
        private Integer totalAttendees;
        
        @JsonProperty("occupancyPercent")
        private Double occupancyPercent;
    }
    
    /**
     * User booking information for a specific day.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BookingUserDto {
        
        @JsonProperty("userId")
        private Long userId;
        
        @JsonProperty("userName")
        private String userName;
        
        @JsonProperty("email")
        private String email;
        
        @JsonProperty("expectedAttendees")
        private Integer expectedAttendees;
        
        @JsonProperty("startTime")
        private String startTime; // ISO format date-time
        
        @JsonProperty("endTime")
        private String endTime; // ISO format date-time
        
        @JsonProperty("status")
        private String status; // BOOKED, COMPLETED, CANCELLED, PENDING
    }
}
