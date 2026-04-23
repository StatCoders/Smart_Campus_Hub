import React, { useEffect, useRef, useState } from 'react';
import { CheckCheck, AlertCircle, Inbox, Settings, Filter, Flag } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationBell from './NotificationBell';
import { formatRelativeTime } from '../utils/dateFormatter';
import { useNavigate } from 'react-router-dom';
import NotificationSettingsModal from './NotificationSettingsModal';

export default function NotificationDropdown({ userId, isOpen, onClose, onToggle }) {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markingIds,
    markingAll,
    priorityFilter,
    setPriorityFilter,
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

    // Navigate based on type
    if (notification.type === 'BOOKING') {
      navigate('/dashboard'); 
    } else if (notification.type === 'TICKET' || notification.type === 'COMMENT') {
      navigate('/tickets');
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'LOW': return 'text-slate-500 bg-slate-50 border-slate-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
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
        <div className="absolute right-0 top-full z-50 mt-3 w-[24rem] overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-sky-50 px-5 py-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-bold text-slate-950">Notifications</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {loading ? 'Refreshing...' : unreadCount > 0 ? `${unreadCount} New Updates` : 'All Caught Up'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
                  title="Notification Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1.5 rounded-lg transition-all ${showFilters || priorityFilter !== 'ALL' ? 'text-sky-600 bg-sky-50' : 'text-slate-400 hover:text-slate-600 hover:bg-white'}`}
                  title="Filter by Priority"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              {showFilters ? (
                <div className="flex gap-1 animate-in slide-in-from-top-2 duration-200">
                  {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                    <button
                      key={p}
                      onClick={() => {
                        setPriorityFilter(p);
                        setShowFilters(false);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                        priorityFilter === p 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex-1" />
              )}

              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markingAll || unreadCount === 0 || loading}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-slate-200"
              >
                {markingAll ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3" />
                )}
                <span>Mark all read</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[32rem] overflow-y-auto bg-white p-2">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500 mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Syncing...</p>
              </div>
            )}

            {!loading && error && (
              <div className="p-4">
                <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                  <AlertCircle className="h-5 w-5 text-rose-600" />
                  <p className="text-xs font-medium text-rose-900">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2rem] bg-slate-50 text-slate-300">
                  <Inbox className="h-8 w-8" />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-900">No {priorityFilter !== 'ALL' ? priorityFilter.toLowerCase() : ''} notifications</p>
                <p className="mt-1 text-xs text-slate-400">Everything is up to date.</p>
              </div>
            )}

            {!loading && !error && notifications.length > 0 && (
              <div className="space-y-2">
                {notifications.map((notification) => {
                  const isMarking = markingIds.has(notification.id);
                  const pColor = getPriorityColor(notification.priority);
                  
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      disabled={isMarking || isProcessing}
                      className={`group w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                        notification.isRead
                          ? 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'
                          : 'border-sky-100 bg-white shadow-sm hover:border-sky-200 hover:shadow-md'
                      } active:scale-[0.98]`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative mt-1 flex-shrink-0">
                          <span
                            className={`block h-2 w-2 rounded-full transition-all duration-500 ${
                              notification.isRead ? 'bg-slate-200' : 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]'
                            } ${!notification.isRead && 'animate-pulse'}`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-tighter ${pColor}`}>
                              <Flag className="h-2 w-2" />
                              {notification.priority || 'NORMAL'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                          </div>
                          
                          <p className={`text-sm leading-snug ${
                            notification.isRead ? 'font-medium text-slate-500' : 'font-bold text-slate-900'
                          }`}>
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <NotificationSettingsModal 
        userId={userId}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

function Loader2(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
