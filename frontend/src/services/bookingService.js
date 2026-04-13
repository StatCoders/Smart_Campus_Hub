import apiClient from './apiClient';

// Every backend response is wrapped: { success, statusCode, message, data, timestamp }
// We unwrap response.data.data so callers receive the plain payload directly.

// Create a new booking (USER)
export const createBooking = async (bookingData) => {
  try {
    const response = await apiClient.post('/bookings', bookingData);
    return response.data.data; // BookingResponseDto
  } catch (error) {
    // Propagate the full error so callers can check status codes (e.g. 409 conflict)
    throw error;
  }
};

// Get the current user's bookings (USER)
export const getMyBookings = async () => {
  try {
    const response = await apiClient.get('/bookings/my');
    return response.data.data; // List<BookingResponseDto>
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch your bookings';
  }
};

// Get all bookings (ADMIN)
export const getAllBookings = async () => {
  try {
    const response = await apiClient.get('/bookings');
    return response.data.data; // List<BookingResponseDto>
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch all bookings';
  }
};

// Approve a booking (ADMIN)
export const approveBooking = async (id) => {
  try {
    const response = await apiClient.put(`/bookings/${id}/approve`);
    return response.data.data; // BookingResponseDto
  } catch (error) {
    throw error.response?.data?.message || 'Failed to approve booking';
  }
};

// Reject a booking with a reason (ADMIN)
export const rejectBooking = async (id, reason) => {
  try {
    const response = await apiClient.put(`/bookings/${id}/reject`, { reason });
    return response.data.data; // BookingResponseDto
  } catch (error) {
    throw error.response?.data?.message || 'Failed to reject booking';
  }
};

// Cancel a booking (USER – own booking only)
export const cancelBooking = async (id) => {
  try {
    const response = await apiClient.put(`/bookings/${id}/cancel`);
    return response.data.data; // BookingResponseDto
  } catch (error) {
    throw error.response?.data?.message || 'Failed to cancel booking';
  }
};
