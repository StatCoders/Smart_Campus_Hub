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

  return [];
};

export const getAllBookings = async () => {
  try {
    const response = await apiClient.get('/bookings');

    return {
      items: normalizeBookingCollection(response.data),
      unavailable: false,
      message: '',
    };
  } catch (error) {
    if ([404, 405, 501].includes(error.response?.status)) {
      return {
        items: [],
        unavailable: true,
        message: 'Booking endpoints are not available in the current backend build.',
      };
    }

    throw normalizeBookingError(error, 'Failed to fetch bookings');
  }
};
