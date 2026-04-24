import React, { useEffect, useRef, useState, useMemo } from 'react';
import { CheckCheck, AlertCircle, Inbox, Settings, Filter, ChevronDown, User, Layers } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationBell from './NotificationBell';
import NotificationSettingsModal from './NotificationSettingsModal';
import { formatRelativeTime } from '../utils/dateFormatter';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { normalizeRole } from '../utils/roleRedirect';

export default function NotificationDropdown({ userId, isOpen, onClose, onToggle }) {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = normalizeRole(user?.role) === 'ADMIN';

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);
  const [isGlobalView, setIsGlobalView] = useState(false);

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
  } = useNotifications(userId, isAdmin && isGlobalView);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
        setIsFilterOpen(false);
        setIsTypeFilterOpen(false);
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
      const filters = {};
      if (priorityFilter !== 'ALL') filters.priority = priorityFilter;
      if (typeFilter !== 'ALL') filters.type = typeFilter;

      loadNotifications(filters);
    }
  }, [isOpen, priorityFilter, typeFilter, loadNotifications, isGlobalView]);

  const handleNotificationClick = async (notification) => {
    if (!notification?.id) return;

    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    const { referenceId, type, priority } = notification;
    const isStudent = normalizeRole(user?.role) === 'USER';

    // Priority-based Redirection Mapping
    if (priority === 'HIGH' || type === 'TICKET' || type === 'COMMENT') {
      // Ticket-related
      if (isStudent) {
        navigate(referenceId ? `/student-tickets?highlight=${referenceId}` : '/student-tickets');
      } else {
        navigate(referenceId ? `/tickets?highlight=${referenceId}` : '/tickets');
      }
    } else if (priority === 'MEDIUM' || type === 'BOOKING') {
      // Booking-related
      if (isStudent) {
        navigate(referenceId ? `/student-bookings?highlight=${referenceId}` : '/student-bookings');
      } else {
        navigate(referenceId ? `/bookings?highlight=${referenceId}` : '/bookings');
      }
    } else if (priority === 'LOW' || type === 'SYSTEM') {
      // System-related
      if (isAdmin) {
        navigate('/dashboard'); // System logs/dashboard
      } else {
        navigate('/home'); // General announcements/home
      }
    }

    onClose();
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'LOW': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const isProcessing = markingAll || markingIds.size > 0;

  const fallbackMessage = useMemo(() => {
    if (priorityFilter === 'ALL') return 'Everything looks clear here.';
    return `No ${priorityFilter.toLowerCase()} notifications available.`;
  }, [priorityFilter]);

  return (
    <div ref={dropdownRef} className="relative">
      <NotificationBell
        userId={userId}
        isOpen={isOpen}
        onToggle={onToggle}
        unreadCount={unreadCount}
        loading={loading && !isOpen} // Only show loading on bell if dropdown is closed (initial load)
        error={error}
      />

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[26rem] overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-sky-50/30 px-5 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-950 uppercase tracking-tight">
                      {isAdmin && isGlobalView ? 'System Notifications' : 'My Notifications'}
                    </p>
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-sky-600 hover:shadow-sm transition-all"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  {isAdmin && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => setIsGlobalView(false)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-all ${!isGlobalView ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                      >
                        Personal
                      </button>
                      <button
                        onClick={() => setIsGlobalView(true)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-all ${isGlobalView ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                      >
                        Global View
                      </button>
                    </div>
                  )}

                  <p className="mt-2 text-[11px] font-medium text-slate-500">
                    {loading ? 'Refreshing...' : unreadCount > 0 ? `${unreadCount} new updates` : 'All caught up!'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll || unreadCount === 0 || loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-sky-200 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                >
                  {markingAll ? (
                    <span className="h-3 w-3 rounded-full border-2 border-slate-300 border-t-sky-600 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3.5 w-3.5" />
                  )}
                  <span>Mark all read</span>
                </button>
              </div>

              {/* Filters Row */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => { setIsFilterOpen(!isFilterOpen); setIsTypeFilterOpen(false); }}
                    className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition-all duration-200 ${priorityFilter !== 'ALL'
                        ? 'border-sky-200 bg-sky-50 text-sky-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    <Filter className="h-3 w-3" />
                    <span>Priority: {priorityFilter === 'ALL' ? 'All' : priorityFilter}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isFilterOpen && (
                    <div className="absolute left-0 top-full z-[60] mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.12)] ring-1 ring-slate-200/50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</p>
                      {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                        <button
                          key={p}
                          onClick={() => { setPriorityFilter(p); setIsFilterOpen(false); }}
                          className={`w-full rounded-xl px-3 py-2 text-left text-[11px] font-bold transition-all duration-200 ${priorityFilter === p ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          {p === 'ALL' ? 'All' : p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isAdmin && isGlobalView && (
                  <div className="relative">
                    <button
                      onClick={() => { setIsTypeFilterOpen(!isTypeFilterOpen); setIsFilterOpen(false); }}
                      className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-bold transition-all duration-200 ${typeFilter !== 'ALL'
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                    >
                      <Layers className="h-3 w-3" />
                      <span>Type: {typeFilter === 'ALL' ? 'All' : typeFilter}</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${isTypeFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isTypeFilterOpen && (
                      <div className="absolute left-0 top-full z-[60] mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.12)] ring-1 ring-slate-200/50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</p>
                        {['ALL', 'TICKET', 'BOOKING', 'SYSTEM', 'COMMENT'].map((t) => (
                          <button
                            key={t}
                            onClick={() => { setTypeFilter(t); setIsTypeFilterOpen(false); }}
                            className={`w-full rounded-xl px-3 py-2 text-left text-[11px] font-bold transition-all duration-200 ${typeFilter === t ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                              }`}
                          >
                            {t === 'ALL' ? 'All Types' : t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[32rem] overflow-y-auto bg-white p-2 custom-scrollbar">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-100 border-t-sky-500" />
                <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Loading...</p>
              </div>
            )}

            {!loading && error && (
              <div className="p-4">
                <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-600">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-xs font-bold leading-tight">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-slate-50 text-slate-300">
                  <Inbox className="h-7 w-7" />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-900">{fallbackMessage}</p>
                <p className="mt-1 text-[11px] text-slate-400">Everything looks clear here.</p>
              </div>
            )}

            {!loading && !error && notifications.length > 0 && (
              <div className="space-y-2">
                {notifications.map((notification) => {
                  const isMarking = markingIds.has(notification.id);

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      disabled={isMarking || isProcessing}
                      className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${notification.isRead
                          ? 'border-transparent bg-white text-slate-500 hover:bg-slate-50'
                          : 'border-sky-100 bg-gradient-to-br from-sky-50/50 to-white text-slate-800 shadow-sm hover:border-sky-200'
                        } ${isMarking ? 'opacity-60' : ''} active:scale-[0.98]`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Priority Badge Indicator */}
                        <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${notification.priority === 'HIGH' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse' :
                            notification.priority === 'MEDIUM' ? 'bg-amber-500' :
                              notification.priority === 'LOW' ? 'bg-blue-400' : 'bg-slate-300'
                          }`} />

                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-center gap-2">
                            <span className={`rounded-lg border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${getPriorityStyles(notification.priority)}`}>
                              {notification.priority}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                          </div>

                          {isAdmin && isGlobalView && (
                            <div className="mb-1 flex items-center gap-1.5">
                              <User className="h-3 w-3 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">User ID: {notification.userId}</span>
                              <span className="h-1 w-1 rounded-full bg-slate-200" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{notification.type}</span>
                            </div>
                          )}

                          <p className={`text-xs leading-relaxed ${notification.isRead ? 'font-medium' : 'font-bold text-slate-900'}`}>
                            {notification.message}
                          </p>
                        </div>

                        {/* Read Indicator */}
                        {!notification.isRead && (
                          <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
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

      {/* Settings Modal */}
      <NotificationSettingsModal
        userId={userId}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
