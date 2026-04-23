import apiClient from './apiClient';

const normalizeNotificationError = (error, fallbackMessage) => {
  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    fallbackMessage;

  return new Error(message);
};

const unwrapResponseData = (response) => response.data?.data ?? response.data;

export const getNotifications = async () => {
  try {
    const response = await apiClient.get('/notifications');
    const notifications = unwrapResponseData(response);
    return Array.isArray(notifications) ? notifications : [];
  } catch (error) {
    throw normalizeNotificationError(error, 'Failed to fetch notifications');
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return unwrapResponseData(response);
  } catch (error) {
    throw normalizeNotificationError(error, 'Failed to mark notification as read');
  }
};

export const markAllAsRead = async (userId) => {
  try {
    const response = await apiClient.put(`/notifications/user/${userId}/read-all`);
    return unwrapResponseData(response);
  } catch (error) {
    throw normalizeNotificationError(error, 'Failed to mark all notifications as read');
  }
};

export const getUnreadCount = async (userId) => {
  try {
    const response = await apiClient.get(`/notifications/user/${userId}/unread-count`);
    const payload = unwrapResponseData(response);

    if (typeof payload?.unreadCount === 'number') {
      return payload.unreadCount;
    }

    if (typeof payload === 'number') {
      return payload;
    }

    return 0;
  } catch (error) {
    throw normalizeNotificationError(error, 'Failed to fetch unread notification count');
  }
};

export const getPreferences = async (userId) => {
  try {
    const response = await apiClient.get(`/notifications/preferences/${userId}`);
    return unwrapResponseData(response);
  } catch (error) {
    throw normalizeNotificationError(error, 'Failed to fetch notification preferences');
  }
};

export const updatePreferences = async (userId, preferences) => {
  try {
    const response = await apiClient.put(`/notifications/preferences/${userId}`, preferences);
    return unwrapResponseData(response);
  } catch (error) {
    throw normalizeNotificationError(error, 'Failed to update notification preferences');
  }
};

const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getPreferences,
  updatePreferences,
};

export default notificationService;
