import { useState, useCallback } from 'react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notificationService';

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [markingIds, setMarkingIds] = useState(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await getUnreadCount(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
      setError(err.message);
    }
  }, [userId]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      const [items, count] = await Promise.all([
        getNotifications(userId),
        getUnreadCount(userId),
      ]);

      setNotifications(items);
      setUnreadCount(count);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mark single notification as read
  const markNotificationAsRead = useCallback(async (notificationId) => {
    // Track this notification as being marked
    setMarkingIds((current) => new Set(current).add(notificationId));

    // Optimistic update
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item
      )
    );
    setUnreadCount((current) => Math.max(0, current - 1));

    try {
      await markAsRead(notificationId);
    } catch (err) {
      // Rollback on error
      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, isRead: false } : item
        )
      );
      setUnreadCount((current) => current + 1);
      setError(err.message || 'Failed to mark notification as read');
      throw err;
    } finally {
      // Remove from marking set
      setMarkingIds((current) => {
        const updated = new Set(current);
        updated.delete(notificationId);
        return updated;
      });
    }
  }, []);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    if (!userId || unreadCount === 0) return;

    setMarkingAll(true);
    const previousNotifications = notifications;

    // Optimistic update
    setNotifications((current) =>
      current.map((item) => ({ ...item, isRead: true }))
    );
    setUnreadCount(0);

    try {
      await markAllAsRead(userId);
    } catch (err) {
      // Rollback on error
      setNotifications(previousNotifications);
      setUnreadCount(previousNotifications.filter((item) => !item.isRead).length);
      setError(err.message || 'Failed to mark all notifications as read');
      throw err;
    } finally {
      setMarkingAll(false);
    }
  }, [userId, unreadCount, notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markingIds,
    markingAll,
    loadUnreadCount,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setUnreadCount,
  };
}
