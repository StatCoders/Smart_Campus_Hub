/**
 * Example: Standalone Notification Bell with Custom Dropdown
 * 
 * This example shows how to use NotificationBell independently
 * with a custom dropdown implementation and enhanced UX.
 */

import React, { useState, useRef, useEffect } from 'react';
import NotificationBell from './NotificationBell';
import { useNotifications } from '../hooks/useNotifications';
import { formatRelativeTime } from '../utils/dateFormatter';
import { CheckCheck, AlertCircle, Inbox } from 'lucide-react';

export default function CustomNotificationBell({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markingIds,
    markingAll,
    markNotificationAsRead,
    loadNotifications,
    markAllNotificationsAsRead,
  } = useNotifications(userId);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification) => {
    if (!notification?.id || notification.isRead) return;

    try {
      await markNotificationAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;

    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const isProcessing = markingAll || markingIds.size > 0;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <NotificationBell
        userId={userId}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        unreadCount={unreadCount}
      />

      {/* Custom Dropdown with Enhanced UX */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-sky-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                <p className="mt-0.5 text-xs text-slate-500 transition-all duration-300">
                  {loading ? (
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-1 w-1 rounded-full bg-slate-400 animate-pulse" />
                      Loading...
                    </span>
                  ) : unreadCount > 0 ? (
                    `${unreadCount} new`
                  ) : (
                    'All caught up'
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0 || loading || markingAll}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-all duration-200 hover:border-sky-200 hover:text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                title="Mark all notifications as read"
              >
                {markingAll ? (
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-slate-300 border-t-sky-600 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center px-4 py-12">
                <div className="relative h-10 w-10">
                  <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-500 border-r-sky-500 animate-spin" />
                </div>
                <p className="mt-3 text-xs text-slate-500 font-medium">Fetching notifications...</p>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="px-4 py-4">
                <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-rose-900">Failed to load</p>
                    <p className="text-rose-700 text-xs mt-0.5">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && notifications.length === 0 && (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <Inbox className="h-5 w-5 text-slate-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-900">No notifications</p>
                <p className="mt-1 text-xs text-slate-500">You're all caught up!</p>
              </div>
            )}

            {/* Notifications List */}
            {!loading && !error && notifications.length > 0 && (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const isMarking = markingIds.has(notification.id);

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      disabled={isMarking || isProcessing}
                      className={`w-full px-4 py-3 text-left transition-all duration-200 hover:bg-slate-50 disabled:opacity-60 active:scale-95 ${notification.isRead
                          ? 'bg-white'
                          : 'bg-blue-50 hover:bg-blue-100'
                        }`}
                    >
                      <div className="flex gap-3">
                        {/* Status Indicator */}
                        <div className="mt-0.5 flex-shrink-0">
                          {isMarking ? (
                            <span className="inline-block h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                          ) : (
                            <span
                              className={`block h-2 w-2 rounded-full transition-all duration-300 ${notification.isRead ? 'bg-slate-300' : 'bg-sky-600'
                                }`}
                            />
                          )}
                        </div>

                        {/* Message */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm transition-all duration-200 ${notification.isRead
                                ? 'text-slate-600 font-normal'
                                : 'text-slate-900 font-semibold'
                              }`}
                          >
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 transition-colors duration-200">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>

                        {/* Loading Spinner */}
                        {isMarking && (
                          <span className="mt-0.5 flex-shrink-0">
                            <span className="inline-block h-3 w-3 rounded-full border-2 border-sky-300 border-t-sky-600 animate-spin" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && !loading && (
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
              <button
                type="button"
                className="w-full rounded py-1.5 text-xs text-sky-600 transition hover:text-sky-700 hover:underline font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
