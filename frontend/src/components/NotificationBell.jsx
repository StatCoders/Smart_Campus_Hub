import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadCount } from '../services/notificationService';

export default function NotificationBell({ userId, isOpen, onToggle, unreadCount: externalCount, onCountChange }) {
  const bellRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(externalCount || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch unread count on mount and when userId changes
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!userId) {
        setUnreadCount(0);
        return;
      }

      try {
        setLoading(true);
        const count = await getUnreadCount(userId);
        setUnreadCount(count);
        onCountChange?.(count);
      } catch (err) {
        console.error('Failed to load unread count:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();
  }, [userId, onCountChange]);

  // Update when external count changes
  useEffect(() => {
    if (externalCount !== undefined && externalCount !== unreadCount) {
      setUnreadCount(externalCount);
    }
  }, [externalCount, unreadCount]);

  const handleBellClick = () => {
    onToggle?.();
  };

  const displayCount = Math.min(unreadCount, 99); // Cap at 99 for display

  return (
    <div className="relative" ref={bellRef}>
      <button
        type="button"
        onClick={handleBellClick}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 active:scale-95"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-pressed={isOpen}
      >
        {/* Bell Icon with Loading Animation */}
        <div className={loading ? 'animate-pulse' : ''}>
          <Bell 
            className={`h-5 w-5 transition-transform ${isOpen ? 'scale-110' : 'scale-100'}`}
            strokeWidth={2} 
          />
        </div>

        {/* Unread Badge with Animation */}
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg animate-in zoom-in-50 duration-300">
            {displayCount}
            {unreadCount > 99 && '+'}
          </span>
        )}

        {/* Error indicator */}
        {error && (
          <span 
            className="absolute right-0 top-0 h-6 w-6 rounded-full bg-orange-400 animate-pulse" 
            title="Error loading notifications" 
          />
        )}
      </button>
    </div>
  );
}
