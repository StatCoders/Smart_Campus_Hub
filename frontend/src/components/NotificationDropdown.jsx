import React, { useEffect, useRef } from 'react';
import { CheckCheck, AlertCircle, Inbox } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationBell from './NotificationBell';
import { formatRelativeTime } from '../utils/dateFormatter';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function NotificationDropdown({ userId, isOpen, onClose, onToggle }) {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markingIds,
    markingAll,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotifications(userId);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  const handleNotificationClick = async (notification) => {
    if (!notification?.id) {
      return;
    }

    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    // Navigate based on referenceType and referenceId
    const { referenceType, referenceId, type } = notification;
    const isStudent = user?.role === 'USER';

    if (referenceType === 'BOOKING' && referenceId) {
      if (isStudent) {
        navigate(`/student-bookings?highlight=${referenceId}`);
      } else {
        // Admin dashboard bookings list
        navigate(`/bookings?highlight=${referenceId}`);
      }
    } else if (referenceType === 'TICKET' && referenceId) {
      if (isStudent) {
        navigate(`/student-tickets?highlight=${referenceId}`);
      } else {
        // Admin/Technician tickets list with highlighting
        navigate(`/tickets?highlight=${referenceId}`);
      }
    } else {
      // Fallback for older notifications or SYSTEM notifications
      if (type === 'BOOKING') {
        navigate(isStudent ? '/student-bookings' : '/bookings');
      } else if (type === 'TICKET' || type === 'COMMENT') {
        navigate(isStudent ? '/student-tickets' : '/tickets');
      }
    }

    onClose();
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) {
      return;
    }

    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const isProcessing = markingAll || markingIds.size > 0;

  return (
    <div ref={dropdownRef} className="relative">
      <NotificationBell
        userId={userId}
        isOpen={isOpen}
        onToggle={onToggle}
        unreadCount={unreadCount}
      />

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[22rem] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-sky-50 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">Notifications</p>
                <p className="mt-1 text-xs text-slate-500 transition-all duration-300">
                  {loading ? (
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
                      Loading...
                    </span>
                  ) : unreadCount > 0 ? (
                    `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}`
                  ) : (
                    'All caught up!'
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll || unreadCount === 0 || loading}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:border-sky-200 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-700 active:scale-95"
              >
                {markingAll && (
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-slate-300 border-t-sky-600 animate-spin" />
                )}
                {!markingAll && <CheckCheck className="h-3.5 w-3.5" />}
                <span>Mark all read</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto bg-white">
            {loading && (
              <div className="flex flex-col items-center justify-center px-5 py-12">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-500 border-r-sky-500 animate-spin" />
                </div>
                <p className="mt-4 text-sm text-slate-500 font-medium">Fetching notifications...</p>
              </div>
            )}

            {!loading && error && (
              <div className="px-5 py-6">
                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-rose-900 text-sm">Failed to load notifications</p>
                    <p className="text-rose-700 text-xs mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400">
                  <Inbox className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-900">No notifications</p>
                <p className="mt-1.5 text-xs text-slate-500">You're all caught up! New updates will appear here.</p>
              </div>
            )}

            {!loading && !error && notifications.length > 0 && (
              <div className="p-2">
                {notifications.map((notification) => {
                  const isMarking = markingIds.has(notification.id);

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      disabled={isMarking || isProcessing}
                      className={`mb-2 w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 last:mb-0 cursor-pointer ${notification.isRead
                          ? 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-60'
                          : 'border-sky-100 bg-sky-50/80 text-slate-800 shadow-sm hover:border-sky-200 hover:bg-sky-50 disabled:opacity-70 disabled:hover:bg-sky-50'
                        } ${isMarking ? 'opacity-75' : ''} active:scale-95`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status Indicator with Animation */}
                        <div className="relative mt-1 flex-shrink-0">
                          {isMarking ? (
                            <span className="flex h-2.5 w-2.5 items-center justify-center">
                              <span className="inline-block h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                            </span>
                          ) : (
                            <span
                              className={`block h-2.5 w-2.5 rounded-full transition-all duration-300 ${notification.isRead ? 'bg-slate-300' : 'bg-sky-500'
                                }`}
                            />
                          )}
                        </div>

                        {/* Message Content */}
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm leading-5 transition-all duration-200 ${notification.isRead ? 'font-medium text-slate-600' : 'font-semibold text-slate-900'
                            }`}>
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 transition-colors duration-200">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>

                        {/* Loading Indicator while Marking */}
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
        </div>
      )}
    </div>
  );
}
