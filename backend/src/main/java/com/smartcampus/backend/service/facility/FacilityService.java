package com.smartcampus.backend.service.facility;

import com.smartcampus.backend.dto.facility.FacilityCreateRequest;
import com.smartcampus.backend.dto.facility.FacilityDto;
import com.smartcampus.backend.dto.facility.FacilitySearchFilter;
import com.smartcampus.backend.dto.facility.OccupancyDataDto;
import com.smartcampus.backend.model.facility.Facility;
import com.smartcampus.backend.repository.facility.FacilityRepository;
import com.smartcampus.backend.repository.booking.BookingRepository;
import com.smartcampus.backend.model.booking.Booking;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FacilityService {

    private final FacilityRepository facilityRepository;
    private final BookingRepository bookingRepository;
    private final ModelMapper modelMapper;

    /**
     * Initialize/backfill booking status for all facilities on startup
     * Recalculates booking status based on current status and availability windows
     */
    public void initializeBookingStatus() {
        List<Facility> allFacilities = facilityRepository.findAll();
        boolean needsUpdate = false;
        
        for (Facility facility : allFacilities) {
            String calculatedStatus = calculateBookingStatus(facility);
            if (facility.getBookingStatus() == null || 
                !facility.getBookingStatus().equals(calculatedStatus)) {
                facility.setBookingStatus(calculatedStatus);
                needsUpdate = true;
            }
        }
        
        if (needsUpdate) {
            facilityRepository.saveAll(allFacilities);
        }
    }

    /**
     * Get all facilities with optional filtering
     * Recalculates booking_status in real-time for each facility
     */
    public Page<FacilityDto> getAllFacilities(FacilitySearchFilter filter, Pageable pageable) {
        Specification<Facility> spec = buildSpecification(filter);
        Page<Facility> facilities = facilityRepository.findAll(spec, pageable);
        
        // Recalculate booking status for each facility based on current time before returning
        return facilities.map(facility -> {
            String currentBookingStatus = calculateBookingStatus(facility);
            facility.setBookingStatus(currentBookingStatus);
            return modelMapper.map(facility, FacilityDto.class);
        });
    }

    /**
     * Build Specification for dynamic filtering
     */
    private Specification<Facility> buildSpecification(FacilitySearchFilter filter) {
        return (root, query, cb) -> {
            var predicates = new java.util.ArrayList<>();

            if (filter.getType() != null) {
                predicates.add(cb.equal(root.get("type"), filter.getType()));
            }

            if (filter.getMinCapacity() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("capacity"), filter.getMinCapacity()));
            }

            if (filter.getLocation() != null && !filter.getLocation().isBlank()) {
                var building = cb.like(cb.lower(root.get("building")), "%" + filter.getLocation().toLowerCase() + "%");
                var floor = cb.like(cb.lower(root.get("floor")), "%" + filter.getLocation().toLowerCase() + "%");
                predicates.add(cb.or(building, floor));
            }

            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    /**
     * Get facility by ID
     * Recalculates booking_status in real-time based on current time
     */
    public FacilityDto getFacilityById(Long id) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility not found with id: " + id));
        
        // Recalculate booking status based on current time before returning
        String currentBookingStatus = calculateBookingStatus(facility);
        facility.setBookingStatus(currentBookingStatus);
        
        return modelMapper.map(facility, FacilityDto.class);
    }

    /**
     * Calculate booking status based on facility status and availability windows
     * Returns 3 states: CAN_BOOK_NOW, AVAILABLE_FOR_FUTURE_BOOKINGS, CANNOT_BOOK_NOW
     * Logic:
     * - CANNOT_BOOK_NOW: Only when facility is OUT_OF_SERVICE
     * - CAN_BOOK_NOW: Facility is ACTIVE + within availability window
     * - AVAILABLE_FOR_FUTURE_BOOKINGS: Facility is ACTIVE but outside availability window (hasn't started or has passed)
     * Handles formats like "Mon-Sun : 07:00-20:00"
     */
    private String calculateBookingStatus(Facility facility) {
        // If facility is out of service, cannot book
        if (facility.getStatus() != null && 
            facility.getStatus().toString().equals("OUT_OF_SERVICE")) {
            return "CANNOT_BOOK_NOW";
        }

        // If no availability windows, always available
        if (facility.getAvailabilityWindows() == null || 
            facility.getAvailabilityWindows().isEmpty()) {
            return "CAN_BOOK_NOW";
        }

        // Check if current time is within availability windows
        // Using IST (Asia/Kolkata) timezone for accurate local time comparison
        LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
        int currentHour = now.getHour();
        int currentMinute = now.getMinute();
        int currentTime = currentHour * 60 + currentMinute;
        String dayOfWeek = now.getDayOfWeek().toString();

        String windowStr = facility.getAvailabilityWindows().toLowerCase();

        // Check day range (e.g., "Mon-Fri", "Monday-Friday")
        String dayRegex = "(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\\s*-?\\s*(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)?";
        java.util.regex.Pattern dayPattern = java.util.regex.Pattern.compile(dayRegex, java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher dayMatch = dayPattern.matcher(windowStr);

        boolean dayIsValid = true;
        if (dayMatch.find()) {
            String startDay = dayMatch.group(1).substring(0, 3).toLowerCase();
            String endDay = dayMatch.group(2) != null ? dayMatch.group(2).substring(0, 3).toLowerCase() : null;
            java.util.List<String> daysOfWeek = java.util.Arrays.asList("sun", "mon", "tue", "wed", "thu", "fri", "sat");
            int dayIndex = daysOfWeek.indexOf(dayOfWeek.substring(0, 3).toLowerCase());

            if (endDay != null) {
                int startIdx = daysOfWeek.indexOf(startDay);
                int endIdx = daysOfWeek.indexOf(endDay);
                if (startIdx <= endIdx) {
                    dayIsValid = dayIndex >= startIdx && dayIndex <= endIdx;
                } else {
                    dayIsValid = dayIndex >= startIdx || dayIndex <= endIdx;
                }
            } else {
                dayIsValid = dayOfWeek.substring(0, 3).toLowerCase().equals(startDay);
            }
        }

        // Check time windows - handles formats like "Mon-Sun : 07:00-20:00" or "08:00-22:00"
        // Pattern matches time ranges with : or . as separators (e.g., 08:00-22:00 or 08.00-22.00)
        String timeRegex = "\\b([0-1]?\\d|2[0-3])[:.]([0-5]\\d)\\s*-\\s*([0-1]?\\d|2[0-3])[:.]([0-5]\\d)\\b";
        java.util.regex.Pattern timePattern = java.util.regex.Pattern.compile(timeRegex);
        java.util.regex.Matcher timeMatch = timePattern.matcher(windowStr);

        // Default to NOT available if we can't parse the time window (safer behavior)
        boolean timeIsValid = false;
        int startTimeInMinutes = 0;
        int endTimeInMinutes = 0;
        
        if (timeMatch.find()) {
            int startHour = Integer.parseInt(timeMatch.group(1));
            int startMinute = Integer.parseInt(timeMatch.group(2));
            int endHour = Integer.parseInt(timeMatch.group(3));
            int endMinute = Integer.parseInt(timeMatch.group(4));

            startTimeInMinutes = startHour * 60 + startMinute;
            endTimeInMinutes = endHour * 60 + endMinute;

            // Check if current time is within the time window
            timeIsValid = currentTime >= startTimeInMinutes && currentTime <= endTimeInMinutes;
        }

        // If day is valid
        if (dayIsValid) {
            // If we're within the availability window
            if (timeIsValid) {
                return "CAN_BOOK_NOW";
            }
            
            // Outside the window (hasn't started or has passed) → available for future bookings
            return "AVAILABLE_FOR_FUTURE_BOOKINGS";
        }

        // Day is not valid (facility not operating today) → available for future bookings
        return "AVAILABLE_FOR_FUTURE_BOOKINGS";
    }

    /**
     * Create new facility (Admin only)
     */
    public FacilityDto createFacility(FacilityCreateRequest request) {
        Facility facility = modelMapper.map(request, Facility.class);
        // Calculate and set booking status
        String bookingStatus = calculateBookingStatus(facility);
        facility.setBookingStatus(bookingStatus);
        Facility savedFacility = facilityRepository.save(facility);
        return modelMapper.map(savedFacility, FacilityDto.class);
    }

    /**
     * Update existing facility (Admin only)
     */
    public FacilityDto updateFacility(Long id, FacilityCreateRequest request) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facility not found with id: " + id));

        modelMapper.map(request, facility);
        // Recalculate and update booking status based on new values
        String bookingStatus = calculateBookingStatus(facility);
        facility.setBookingStatus(bookingStatus);
        Facility updatedFacility = facilityRepository.save(facility);
        return modelMapper.map(updatedFacility, FacilityDto.class);
    }

    /**
     * Delete facility (Admin only)
     */
    public void deleteFacility(Long id) {
        if (!facilityRepository.existsById(id)) {
            throw new RuntimeException("Facility not found with id: " + id);
        }
        facilityRepository.deleteById(id);
    }

    /**
     * Get facilities by type
     */
    public List<FacilityDto> getFacilitiesByType(String type) {
        return facilityRepository.findByType(Enum.valueOf(com.smartcampus.backend.model.facility.FacilityType.class, type))
                .stream()
                .map(facility -> modelMapper.map(facility, FacilityDto.class))
                .collect(Collectors.toList());
    }

    /**
     * Search facilities by location (building or floor)
     */
    public List<FacilityDto> searchByLocation(String location) {
        List<Facility> facilities = facilityRepository.findByBuilding(location);
        // Also add facilities with matching floor
        List<Facility> facilities2 = facilityRepository.findAll().stream()
                .filter(f -> f.getFloor() != null && f.getFloor().toLowerCase().contains(location.toLowerCase()))
                .collect(Collectors.toList());
        facilities.addAll(facilities2);

        return facilities.stream()
                .distinct()
                .map(facility -> modelMapper.map(facility, FacilityDto.class))
                .collect(Collectors.toList());
    }

    /**
     * Get count of total facilities
     */
    public long getTotalFacilityCount() {
        return facilityRepository.count();
    }

    /**
     * Get 7-day occupancy data for a facility.
     * Aggregates approved bookings per day with user information.
     * 
     * @param resourceId the facility ID
     * @param startDate the start date (today or custom)
     * @return OccupancyDataDto with 7-day breakdown
     */
    public OccupancyDataDto getWeeklyOccupancy(Long resourceId, LocalDate startDate) {
        // Verify facility exists
        Facility facility = facilityRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Facility not found with id: " + resourceId));
        
        // Calculate end date (7 days from start)
        LocalDate endDate = startDate.plusDays(6);
        
        // Build occupancy data
        return buildOccupancyData(facility, startDate, endDate);
    }
    
    /**
     * Build occupancy DTO with 7-day breakdown.
     * Aggregates approved bookings with user details.
     */
    private OccupancyDataDto buildOccupancyData(Facility facility, LocalDate startDate, LocalDate endDate) {
        OccupancyDataDto dto = OccupancyDataDto.builder()
                .resourceId(facility.getId())
                .capacity(facility.getCapacity())
                .build();
        
        List<OccupancyDataDto.DayOccupancyDto> dailyData = new java.util.ArrayList<>();
        
        // Fetch all approved bookings for the facility in this week
        List<Booking> weekBookings = bookingRepository.findApprovedBookingsForResourceInWeek(
                facility.getId(), startDate, endDate);
        
        // Group bookings by date
        java.util.Map<LocalDate, List<Booking>> bookingsByDate = weekBookings.stream()
                .collect(java.util.stream.Collectors.groupingBy(Booking::getBookingDate));
        
        // Generate data for each day
        for (int i = 0; i < 7; i++) {
            LocalDate date = startDate.plusDays(i);
            String dayName = date.getDayOfWeek().toString().substring(0, 3)
                    + " " + date.getDayOfMonth();
            
            // Get bookings for this day
            List<Booking> dayBookings = bookingsByDate.getOrDefault(date, java.util.Collections.emptyList());
            
            // Convert to DTOs and aggregate attendees
            List<OccupancyDataDto.BookingUserDto> bookingUsers = new java.util.ArrayList<>();
            int totalAttendees = 0;
            
            for (Booking booking : dayBookings) {
                if (booking.getExpectedAttendees() != null && booking.getUser() != null) {
                    totalAttendees += booking.getExpectedAttendees();
                    
                    // Format times as ISO strings
                    String startTimeStr = booking.getStartTime() != null 
                        ? booking.getStartTime().toString() 
                        : null;
                    String endTimeStr = booking.getEndTime() != null 
                        ? booking.getEndTime().toString() 
                        : null;
                    
                    bookingUsers.add(OccupancyDataDto.BookingUserDto.builder()
                            .userId(booking.getUser().getId())
                            .userName(booking.getUser().getFullName() != null 
                                ? booking.getUser().getFullName() 
                                : booking.getUser().getEmail())
                            .email(booking.getUser().getEmail())
                            .expectedAttendees(booking.getExpectedAttendees())
                            .startTime(startTimeStr)
                            .endTime(endTimeStr)
                            .status(booking.getStatus() != null ? booking.getStatus().toString() : "PENDING")
                            .build());
                }
            }
            
            // Calculate occupancy percentage
            double occupancyPercent = facility.getCapacity() > 0 
                ? (totalAttendees * 100.0) / facility.getCapacity() 
                : 0.0;
            
            dailyData.add(OccupancyDataDto.DayOccupancyDto.builder()
                    .date(date)
                    .dayName(dayName)
                    .bookings(bookingUsers)
                    .totalAttendees(totalAttendees)
                    .occupancyPercent(Math.min(occupancyPercent, 100.0)) // Cap at 100%
                    .build());
        }
        
        dto.setOccupancyData(dailyData);
        return dto;
    }
}
