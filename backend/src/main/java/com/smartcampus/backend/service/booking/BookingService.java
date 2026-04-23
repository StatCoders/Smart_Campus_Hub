package com.smartcampus.backend.service.booking;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.backend.dto.booking.AvailabilitySlotDto;
import com.smartcampus.backend.dto.booking.BookingRequestDto;
import com.smartcampus.backend.dto.booking.BookingResponseDto;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.exception.UnauthorizedException;
import com.smartcampus.backend.model.auth.Role;
import com.smartcampus.backend.model.booking.Booking;
import com.smartcampus.backend.model.booking.BookingStatus;
import com.smartcampus.backend.model.auth.User;
import com.smartcampus.backend.model.facility.Facility;
import com.smartcampus.backend.model.notification.NotificationType;
import com.smartcampus.backend.model.outbox.OutboxEvent;
import com.smartcampus.backend.model.outbox.OutboxStatus;
import com.smartcampus.backend.repository.booking.BookingRepository;
import com.smartcampus.backend.repository.auth.UserRepository;
import com.smartcampus.backend.repository.facility.FacilityRepository;
import com.smartcampus.backend.repository.outbox.OutboxEventRepository;
import com.smartcampus.backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final FacilityRepository facilityRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    // -------------------------------------------------------------------------
    // Helper – resolve the currently authenticated user
    // -------------------------------------------------------------------------
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));
    }

    // -------------------------------------------------------------------------
    // Helper – map Booking entity → BookingResponseDto
    // -------------------------------------------------------------------------
    private BookingResponseDto toDto(Booking booking) {
        return BookingResponseDto.builder()
                .id(booking.getId())
                .resourceId(booking.getResource().getId())
                .resourceName(booking.getResource().getName())
                .userId(booking.getUser().getId())
                .userFullName(booking.getUser().getFullName())
                .bookingDate(booking.getBookingDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus().name())
                .adminReason(booking.getAdminReason())
                .reviewedBy(booking.getReviewedBy() != null ? booking.getReviewedBy().getId() : null)
                .createdAt(booking.getCreatedAt())
                .build();
    }

    // -------------------------------------------------------------------------
    // Helper – serialise a Map to a JSON string for the outbox payload
    // -------------------------------------------------------------------------
    private String buildPayload(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialise outbox payload, falling back to empty JSON", e);
            return "{}";
        }
    }

    // -------------------------------------------------------------------------
    // Helper – persist an outbox event (must be called inside a transaction)
    // -------------------------------------------------------------------------
    private void writeOutboxEvent(String eventType, Map<String, Object> payload) {
        OutboxEvent event = OutboxEvent.builder()
                .eventType(eventType)
                .payload(buildPayload(payload))
                .status(OutboxStatus.PENDING)
                .build();
        outboxEventRepository.save(event);
    }

    // =========================================================================
    // createBooking
    // =========================================================================
    @Transactional
    public BookingResponseDto createBooking(BookingRequestDto dto) {

        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        User currentUser = getCurrentUser();

        Facility facility = facilityRepository.findById(dto.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Resource not found with id: " + dto.getResourceId()));

        if (dto.getExpectedAttendees() > facility.getCapacity()) {
            throw new IllegalArgumentException("Number of attendees (" + dto.getExpectedAttendees() + 
                ") exceeds the resource capacity");
        }

        // ── Capacity check (partial-capacity aware) ──────────────────────────────
        // Sum expectedAttendees of all APPROVED bookings that overlap the requested
        // time window.  We allow multiple bookings in the same slot as long as
        // total attendees do not exceed the resource's physical capacity.
        //
        // Example: capacity=30, booking1=10 attendees already approved.
        //   new request = 21 → total 31 > 30 → reject with 409.
        //   new request = 19 → total 29 ≤ 30 → allow.
        Integer alreadyBooked = bookingRepository.sumBookedAttendees(
                facility.getId(),
                dto.getBookingDate(),
                dto.getStartTime(),
                dto.getEndTime()
        );

        int bookedSoFar      = (alreadyBooked != null ? alreadyBooked : 0);
        int totalAfterBooking = bookedSoFar + dto.getExpectedAttendees();

        if (totalAfterBooking > facility.getCapacity()) {
            int remaining = facility.getCapacity() - bookedSoFar;
            throw new ConflictException(
                    "Not enough capacity. Only " + remaining
                    + " seat" + (remaining == 1 ? "" : "s")
                    + " remaining for this time slot.");
        }

        Booking booking = Booking.builder()
                .resource(facility)
                .user(currentUser)
                .bookingDate(dto.getBookingDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .purpose(dto.getPurpose())
                .expectedAttendees(dto.getExpectedAttendees())
                .status(BookingStatus.PENDING)
                .build();

        booking = bookingRepository.save(booking);

        // Outbox event - same transaction
        writeOutboxEvent("BOOKING_CREATED", Map.of(
                "bookingId", booking.getId(),
                "userId", currentUser.getId(),
                "resourceId", facility.getId(),
                "bookingDate", booking.getBookingDate().toString(),
                "startTime", booking.getStartTime().toString(),
                "endTime", booking.getEndTime().toString()
        ));

        // Notify Admins
        userRepository.findByRoleAndIsActiveTrueOrderByFirstName(Role.ADMIN).forEach(admin -> {
            notificationService.createNotification(
                    admin.getId(),
                    "New booking request received for " + facility.getName(),
                    NotificationType.BOOKING
            );
        });

        log.info("Booking {} created by user {}", booking.getId(), currentUser.getId());
        return toDto(booking);
    }

    // =========================================================================
    // getMyBookings
    // =========================================================================
    @Transactional(readOnly = true)
    public List<BookingResponseDto> getMyBookings() {
        User currentUser = getCurrentUser();
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // =========================================================================
    // getAllBookings  (admin)
    // =========================================================================
    @Transactional(readOnly = true)
    public List<BookingResponseDto> getAllBookings(String statusFilter) {
        List<Booking> bookings;
        if (statusFilter != null && !statusFilter.isBlank()) {
            try {
                BookingStatus status = BookingStatus.valueOf(statusFilter.toUpperCase());
                bookings = bookingRepository.findByStatusOrderByCreatedAtDesc(status);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid status filter: " + statusFilter);
            }
        } else {
            bookings = bookingRepository.findAllByOrderByCreatedAtDesc();
        }
        return bookings.stream().map(this::toDto).collect(Collectors.toList());
    }

    // =========================================================================
    // approveBooking  (admin)
    // =========================================================================
    @Transactional
    public BookingResponseDto approveBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException(
                    "Only PENDING bookings can be approved. Current status: " + booking.getStatus());
        }

        User admin = getCurrentUser();
        booking.setStatus(BookingStatus.APPROVED);
        booking.setReviewedBy(admin);
        booking = bookingRepository.save(booking);

        writeOutboxEvent("BOOKING_APPROVED", Map.of(
                "bookingId", booking.getId(),
                "userId", booking.getUser().getId(),
                "reviewedBy", admin.getId(),
                "resourceId", booking.getResource().getId()
        ));

        notificationService.createNotification(
                booking.getUser().getId(),
                "Your booking for " + booking.getResource().getName() + " has been approved",
                NotificationType.BOOKING
        );

        log.info("Booking {} approved by admin {}", booking.getId(), admin.getId());
        return toDto(booking);
    }

    // =========================================================================
    // rejectBooking  (admin)
    // =========================================================================
    @Transactional
    public BookingResponseDto rejectBooking(Long bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalArgumentException(
                    "Only PENDING bookings can be rejected. Current status: " + booking.getStatus());
        }

        User admin = getCurrentUser();
        booking.setStatus(BookingStatus.REJECTED);
        booking.setAdminReason(reason);
        booking.setReviewedBy(admin);
        booking = bookingRepository.save(booking);

        writeOutboxEvent("BOOKING_REJECTED", Map.of(
                "bookingId", booking.getId(),
                "userId", booking.getUser().getId(),
                "reviewedBy", admin.getId(),
                "reason", reason
        ));

        notificationService.createNotification(
                booking.getUser().getId(),
                "Your booking for " + booking.getResource().getName() + " has been rejected",
                NotificationType.BOOKING
        );

        log.info("Booking {} rejected by admin {} — reason: {}", booking.getId(), admin.getId(), reason);
        return toDto(booking);
    }

    // =========================================================================
    // cancelBooking  (booking owner)
    // =========================================================================
    @Transactional
    public BookingResponseDto cancelBooking(Long bookingId) {
        User currentUser = getCurrentUser();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found with id: " + bookingId));

        // Ownership check
        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You are not permitted to cancel this booking");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Booking is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking = bookingRepository.save(booking);

        log.info("Booking {} cancelled by user {}", booking.getId(), currentUser.getId());
        return toDto(booking);
    }

    // =========================================================================
    // getAvailability  (student) — 15-min slot availability for a resource/date
    // =========================================================================
    @Transactional(readOnly = true)
    public List<AvailabilitySlotDto> getAvailability(Long resourceId, LocalDate date) {

        Facility facility = facilityRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Resource not found with id: " + resourceId));

        int totalCapacity = facility.getCapacity();

        // Fetch only APPROVED bookings for this resource on this date
        List<Booking> approvedBookings =
                bookingRepository.findApprovedBookingsForResourceOnDate(resourceId, date);

        // Generate 15-minute slots from 08:00 to 20:00 (exclusive upper bound)
        // e.g. 08:00-08:15, 08:15-08:30, ... 19:45-20:00
        List<AvailabilitySlotDto> slots = new ArrayList<>();
        LocalTime cursor = LocalTime.of(8, 0);
        LocalTime dayEnd  = LocalTime.of(20, 0);

        while (cursor.isBefore(dayEnd)) {
            LocalTime slotEnd = cursor.plusMinutes(15);

            final LocalTime slotStart = cursor; // effectively final for lambda

            // Sum expectedAttendees of bookings that overlap this slot.
            // Overlap condition: booking.start < slotEnd AND booking.end > slotStart
            int booked = approvedBookings.stream()
                    .filter(b -> b.getStartTime().isBefore(slotEnd)
                              && b.getEndTime().isAfter(slotStart))
                    .mapToInt(b -> b.getExpectedAttendees() == null ? 0 : b.getExpectedAttendees())
                    .sum();

            int remaining = Math.max(0, totalCapacity - booked);

            slots.add(AvailabilitySlotDto.builder()
                    .startTime(slotStart)
                    .endTime(slotEnd)
                    .bookedCapacity(booked)
                    .remainingCapacity(remaining)
                    .isAvailable(remaining > 0)
                    .build());

            cursor = slotEnd;
        }

        return slots;
    }
}
