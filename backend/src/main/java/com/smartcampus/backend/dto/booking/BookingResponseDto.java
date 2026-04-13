package com.smartcampus.backend.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponseDto {

    private Long id;

    private Long resourceId;

    private String resourceName;

    private Long userId;

    private String userFullName;

    private LocalDate bookingDate;

    private LocalTime startTime;

    private LocalTime endTime;

    private String purpose;

    private Integer expectedAttendees;

    private String status;

    private String adminReason;

    /** Id of the admin/reviewer who approved or rejected this booking. */
    private Long reviewedBy;

    private LocalDateTime createdAt;
}
