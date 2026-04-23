package com.smartcampus.backend.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

/**
 * Represents a single 15-minute time slot and its current booking capacity
 * for a given resource on a given date.
 *
 * Returned by GET /api/bookings/availability?resourceId={id}&date={date}
 * The frontend uses this list to colour each option in the time dropdowns:
 *   - remainingCapacity == 0 → disabled / greyed out
 *   - 0 < remaining < total  → amber (partially booked)
 *   - remaining == total      → green (fully free)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilitySlotDto {

    /** Slot window start (inclusive), e.g. 09:00 */
    private LocalTime startTime;

    /** Slot window end (exclusive), e.g. 09:15 */
    private LocalTime endTime;

    /** Sum of expectedAttendees for APPROVED bookings that overlap this slot. */
    private int bookedCapacity;

    /** resource.capacity - bookedCapacity (may be negative if over-booked legacy data). */
    private int remainingCapacity;

    /** true when remainingCapacity > 0 */
    private boolean isAvailable;
}
