import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { cancelBooking } from '../services/bookingService';

// Status configuration
const STATUS_CONFIG = {
  APPROVED: {
    borderColor: 'border-emerald-500',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    label: 'Approved',
  },
  PENDING: {
    borderColor: 'border-amber-500',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    label: 'Pending',
  },
  REJECTED: {
    borderColor: 'border-rose-500',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700',
    label: 'Rejected',
  },
  CANCELLED: {
    borderColor: 'border-slate-400',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    label: 'Cancelled',
  },
};

// BookingResponseDto fields:
//   id, resourceId, resourceName, userId, userFullName,
//   bookingDate (LocalDate → "2026-04-13"),
//   startTime   (LocalTime → "08:00:00"),
//   endTime     (LocalTime → "09:00:00"),
//   purpose, expectedAttendees, status,
//   adminReason, reviewedBy (Long), createdAt

function formatBookingDate(dateStr) {
  // dateStr is "2026-04-13"
  if (!dateStr) return { month: '—', day: '—', weekday: '' };
  const d = new Date(`${dateStr}T00:00:00`); // force local time parse
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }),
    day: d.getDate(),
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
  };
}

function formatLocalTime(timeStr) {
  // timeStr is "08:00:00" or "09:30:00"
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function BookingCard({ booking, onRefresh, currentUserId, isAdmin = false }) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const status = booking.status || 'PENDING';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

  // Only show Cancel button to the booking owner when status allows it
  const canCancel =
    !isAdmin &&
    (status === 'APPROVED' || status === 'PENDING') &&
    (currentUserId == null || booking.userId === currentUserId);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    setCancelError('');
    try {
      await cancelBooking(booking.id);
      onRefresh?.();
    } catch (err) {
      setCancelError(typeof err === 'string' ? err : 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const { month, day, weekday } = formatBookingDate(booking.bookingDate);
  const timeRange = `${formatLocalTime(booking.startTime)} – ${formatLocalTime(booking.endTime)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`bg-white rounded-2xl shadow-sm border border-slate-200 border-l-4 ${config.borderColor} flex items-stretch overflow-hidden`}
    >
      {/* Left – Date column */}
      <div className="flex flex-col items-center justify-center px-5 py-4 min-w-[88px] bg-slate-50 border-r border-slate-100">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{month}</span>
        <span className="text-3xl font-bold text-indigo-600 leading-none">{day}</span>
        <span className="text-xs text-slate-500 mt-0.5">{weekday}</span>
        <span className="text-[11px] text-slate-400 mt-2 text-center leading-tight">{timeRange}</span>
      </div>

      {/* Middle – Details */}
      <div className="flex-1 px-5 py-4 flex flex-col justify-center gap-1 min-w-0">
        <p className="font-semibold text-slate-800 truncate text-base">{booking.purpose || '(No purpose)'}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
          {booking.resourceName && (
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <span>📦</span> {booking.resourceName}
            </span>
          )}
          {booking.expectedAttendees != null && (
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <span>👥</span> {booking.expectedAttendees} attendees
            </span>
          )}
        </div>

        {/* Rejection reason */}
        {status === 'REJECTED' && booking.adminReason && (
          <p className="text-xs text-rose-600 mt-1 italic">Reason: {booking.adminReason}</p>
        )}

        {/* Admin view – show requester's full name */}
        {isAdmin && booking.userFullName && (
          <p className="text-xs text-slate-500 mt-0.5">
            Requested by: <span className="font-medium text-slate-700">{booking.userFullName}</span>
          </p>
        )}

        {cancelError && <p className="text-xs text-rose-500 mt-1">{cancelError}</p>}
      </div>

      {/* Right – Status badge + actions */}
      <div className="flex flex-col items-end justify-center px-5 py-4 gap-2 shrink-0">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.badgeBg} ${config.badgeText}`}
        >
          {config.label}
        </span>

        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors disabled:opacity-60"
          >
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
