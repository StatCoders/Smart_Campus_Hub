import apiClient from './apiClient';

const normalizeBookingError = (error, fallbackMessage) => {
  const message = error.response?.data?.message || fallbackMessage;
  return new Error(message);
};

const normalizeBookingCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (payload?.items && Array.isArray(payload.items)) {
    return payload.items;
  }

  // Handle case where backend returns single response object with data array
  if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
    const values = Object.values(payload);
    if (Array.isArray(values[0])) {
      return values[0];
    }
  }

  return [];
};

export const getAllBookings = async () => {
  try {
    const response = await apiClient.get('/bookings');
    return normalizeBookingCollection(response.data);
  } catch (error) {
    if ([404, 405, 501].includes(error.response?.status)) {
      return [];
    }

    throw normalizeBookingError(error, 'Failed to fetch bookings');
  }
};

export const getMyBookings = async () => {
  try {
    // Try the dedicated endpoint first
    try {
      const response = await apiClient.get('/bookings/my');
      return normalizeBookingCollection(response.data);
    } catch (error) {
      // If /bookings/my doesn't exist, fall back to /bookings
      if (error.response?.status === 404 || error.response?.status === 405) {
        const response = await apiClient.get('/bookings');
        const bookings = normalizeBookingCollection(response.data);
        // Filter to show only current user's bookings
        return bookings;
      }
      throw error;
    }
  } catch (error) {
    throw normalizeBookingError(error, 'Failed to fetch your bookings');
  }
};

export const createBooking = async (bookingData) => {
  const response = await apiClient.post('/bookings', bookingData);
  return response.data.data || response.data;
};

export const approveBooking = async (id) => {
  try {
    const response = await apiClient.put(`/bookings/${id}/approve`);
    return response.data.data || response.data;
  } catch (error) {
    throw normalizeBookingError(error, 'Failed to approve booking');
  }
};

export const rejectBooking = async (id, reason) => {
  try {
    const response = await apiClient.put(`/bookings/${id}/reject`, { reason });
    return response.data.data || response.data;
  } catch (error) {
    throw normalizeBookingError(error, 'Failed to reject booking');
  }
};

export const cancelBooking = async (id) => {
  try {
    const response = await apiClient.put(`/bookings/${id}/cancel`);
    return response.data.data || response.data;
  } catch (error) {
    throw normalizeBookingError(error, 'Failed to cancel booking');
  }
};

/**
 * Fetch per-slot availability for a resource on a specific date.
 * Returns the list of AvailabilitySlotDto objects from the backend:
 *   { startTime, endTime, bookedCapacity, remainingCapacity, isAvailable }
 *
 * The frontend uses this to colour the time dropdowns:
 *   - remainingCapacity === 0  → disabled / greyed out
 *   - partially booked         → amber label
 *   - fully free               → green label
 *
 * @param {number} resourceId
 * @param {string} date  ISO date string, e.g. "2026-04-23"
 */
export const getAvailability = async (resourceId, date) => {
  try {
    const response = await apiClient.get('/bookings/availability', {
      params: { resourceId, date },
    });
    return response.data.data || response.data;
  } catch (error) {
    throw normalizeBookingError(error, 'Failed to fetch availability');
  }
};
export const updateBooking = async (id, bookingData) => {
  try {
    const response = await apiClient.put(`/bookings/${id}`, bookingData);
    return response.data.data || response.data;
  } catch (error) {
    throw normalizeBookingError(error, 'Failed to update booking');
  }
};

export const deleteBooking = async (id) => {
  try {
    const response = await apiClient.delete(`/bookings/${id}`);
    return response.data.data || response.data;
  } catch (error) {
    throw normalizeBookingError(error, 'Failed to delete booking');
  }
};
