package com.smartcampus.backend.repository.booking;

import com.smartcampus.backend.model.booking.Booking;
import com.smartcampus.backend.model.booking.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    /** Return all bookings belonging to a specific user, newest first. */
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Return all bookings, newest first. */
    List<Booking> findAllByOrderByCreatedAtDesc();

    /** Return all bookings filtered by status, newest first. */
    List<Booking> findByStatusOrderByCreatedAtDesc(BookingStatus status);

    /**
     * Conflict check: find any APPROVED booking for the same resource on the
     * same date whose time range overlaps with the proposed [startTime, endTime].
     * Two intervals overlap when: existingStart < newEnd AND existingEnd > newStart.
     *
     * @param resourceId the resource being requested
     * @param bookingDate the requested date
     * @param startTime  the requested start time
     * @param endTime    the requested end time
     * @param excludeId  booking id to exclude from the check (use -1 when creating)
     */
    @Query("""
            SELECT b FROM Booking b
            WHERE b.resource.id = :resourceId
              AND b.bookingDate = :bookingDate
              AND b.status = com.smartcampus.backend.model.booking.BookingStatus.APPROVED
              AND b.startTime < :endTime
              AND b.endTime > :startTime
              AND b.id <> :excludeId
            """)
    List<Booking> findConflictingBookings(
            @Param("resourceId") Long resourceId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId
    );

    Optional<Booking> findByIdAndUserId(Long id, Long userId);

    /**
     * Fetch all APPROVED bookings for a specific resource within a date range.
     * Used for occupancy chart calculation on facility detail pages.
     * 
     * @param resourceId the facility/resource ID to fetch bookings for
     * @param startDate the start date of the range (inclusive)
     * @param endDate the end date of the range (inclusive)
     * @return List of approved bookings with user data, ordered by date and time
     * 
     * NOTE: Only APPROVED bookings are included.
     * This method does NOT modify or affect any other booking queries or functionality.
     */
    @Query("""
            SELECT b FROM Booking b
            WHERE b.resource.id = :resourceId
              AND b.status = com.smartcampus.backend.model.booking.BookingStatus.APPROVED
              AND b.bookingDate BETWEEN :startDate AND :endDate
            ORDER BY b.bookingDate ASC, b.startTime ASC
            """)
    List<Booking> findApprovedBookingsForResourceInWeek(
            @Param("resourceId") Long resourceId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
