package com.smartcampus.backend.controller.booking;

import com.smartcampus.backend.dto.booking.AvailabilitySlotDto;
import com.smartcampus.backend.dto.booking.BookingRequestDto;
import com.smartcampus.backend.dto.booking.BookingResponseDto;
import com.smartcampus.backend.dto.booking.RejectBookingRequestDto;
import com.smartcampus.backend.exception.ApiResponse;
import com.smartcampus.backend.service.booking.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // -------------------------------------------------------------------------
    // POST /api/bookings  — create a booking (USER)
    // -------------------------------------------------------------------------
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<BookingResponseDto>> createBooking(
            @Valid @RequestBody BookingRequestDto dto) {

        BookingResponseDto created = bookingService.createBooking(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, HttpStatus.CREATED.value(),
                        "Booking created successfully", created));
    }

    // -------------------------------------------------------------------------
    // GET /api/bookings/my  — current user's bookings (USER)
    // -------------------------------------------------------------------------
    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<BookingResponseDto>>> getMyBookings() {
        List<BookingResponseDto> bookings = bookingService.getMyBookings();
        return ResponseEntity.ok(new ApiResponse<>(true, HttpStatus.OK.value(),
                "Bookings retrieved successfully", bookings));
    }

    // -------------------------------------------------------------------------
    // GET /api/bookings  — all bookings, optional ?status= filter (ADMIN)
    // -------------------------------------------------------------------------
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BookingResponseDto>>> getAllBookings(
            @RequestParam(required = false) String status) {

        List<BookingResponseDto> bookings = bookingService.getAllBookings(status);
        return ResponseEntity.ok(new ApiResponse<>(true, HttpStatus.OK.value(),
                "Bookings retrieved successfully", bookings));
    }

    // -------------------------------------------------------------------------
    // PUT /api/bookings/{id}/approve  (ADMIN)
    // -------------------------------------------------------------------------
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingResponseDto>> approveBooking(
            @PathVariable Long id) {

        BookingResponseDto updated = bookingService.approveBooking(id);
        return ResponseEntity.ok(new ApiResponse<>(true, HttpStatus.OK.value(),
                "Booking approved successfully", updated));
    }

    // -------------------------------------------------------------------------
    // PUT /api/bookings/{id}/reject  (ADMIN)
    // -------------------------------------------------------------------------
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingResponseDto>> rejectBooking(
            @PathVariable Long id,
            @Valid @RequestBody RejectBookingRequestDto dto) {

        BookingResponseDto updated = bookingService.rejectBooking(id, dto.getReason());
        return ResponseEntity.ok(new ApiResponse<>(true, HttpStatus.OK.value(),
                "Booking rejected successfully", updated));
    }

    // -------------------------------------------------------------------------
    // PUT /api/bookings/{id}/cancel  (USER / owner)
    // -------------------------------------------------------------------------
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<BookingResponseDto>> cancelBooking(
            @PathVariable Long id) {

        BookingResponseDto updated = bookingService.cancelBooking(id);
        return ResponseEntity.ok(new ApiResponse<>(true, HttpStatus.OK.value(),
                "Booking cancelled successfully", updated));
    }

    // -------------------------------------------------------------------------
    // PUT /api/bookings/{id}  — update a booking (USER / owner)
    // -------------------------------------------------------------------------
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<BookingResponseDto>> updateBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingRequestDto dto) {

        BookingResponseDto updated = bookingService.updateBooking(id, dto);
        return ResponseEntity.ok(new ApiResponse<>(true, HttpStatus.OK.value(),
                "Booking updated successfully", updated));
    }

    // -------------------------------------------------------------------------
    // GET /api/bookings/availability?resourceId={id}&date={date}  (USER)
    // Returns all 15-minute slots for the day with booked/remaining capacity.
    // The frontend uses this list to colour and disable individual time options.
    // -------------------------------------------------------------------------
    @GetMapping("/availability")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<AvailabilitySlotDto>>> getAvailability(
            @RequestParam Long resourceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<AvailabilitySlotDto> slots = bookingService.getAvailability(resourceId, date);
        return ResponseEntity.ok(new ApiResponse<>(true, HttpStatus.OK.value(),
                "Availability retrieved successfully", slots));
    }
}
