import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  MoreHorizontal,
  XCircle,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Trash2,
  Info,
  BookOpen,
  Edit3
} from 'lucide-react';
import { cancelBooking } from '../services/bookingService';

// Status configuration
const STATUS_CONFIG = {
  APPROVED: {
    borderColor: 'border-l-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeIcon: CheckCircle,
    label: 'Approved',
    accentColor: 'text-emerald-600',
  },
  PENDING: {
    borderColor: 'border-l-amber-500',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeIcon: AlertCircle,
    label: 'Pending',
    accentColor: 'text-amber-600',
  },
  REJECTED: {
    borderColor: 'border-l-rose-500',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeIcon: XCircle,
    label: 'Rejected',
    accentColor: 'text-rose-600',
  },
  CANCELLED: {
    borderColor: 'border-l-slate-400',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-600',
    badgeIcon: XCircle,
    label: 'Cancelled',
    accentColor: 'text-slate-500',
  },
};

function formatBookingDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).toUpperCase();
}

function formatLocalTime(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function BookingCard({ booking, onRefresh, currentUserId, isAdmin = false, onEdit }) {
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const status = booking.status || 'PENDING';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const StatusIcon = config.badgeIcon;

  const canEdit = !isAdmin && status === 'PENDING';

  const canCancel =
    !isAdmin &&
    (status === 'APPROVED' || status === 'PENDING') &&
    (currentUserId == null || booking.userId === currentUserId);

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      await cancelBooking(booking.id);
      onRefresh?.();
      setShowConfirm(false);
    } catch (err) {
      setCancelError(typeof err === 'string' ? err : 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const bookingDate = formatBookingDate(booking.bookingDate);
  const startTime = formatLocalTime(booking.startTime);
  const endTime = formatLocalTime(booking.endTime);

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md border-l-4 ${config.borderColor}`}
    >
      {/* Top Header - Date & Status */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white shadow-sm ${config.accentColor}`}>
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
              {bookingDate}
            </p>
            <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {startTime} — {endTime}
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.badgeBg} ${config.badgeText} text-[11px] font-bold uppercase tracking-wider shadow-sm`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {config.label}
        </div>
      </div>

      {/* Middle Content */}
      <div className="p-5 flex-1 space-y-4">
        {/* Resource Name & Location */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            {booking.resourceName || 'Unnamed Resource'}
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-500 pl-10">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{booking.location || 'Main Campus'}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Attendees</p>
              <p className="text-sm font-semibold text-slate-700">{booking.expectedAttendees || '0'} People</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Purpose</p>
              <p className="text-sm font-semibold text-slate-700 truncate" title={booking.purpose}>
                {booking.purpose || 'No purpose stated'}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Rejection Reason */}
        {status === 'REJECTED' && booking.adminReason && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex gap-3">
            <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1">Reason for Rejection</p>
              <p className="text-sm text-rose-800 leading-relaxed font-medium">
                {booking.adminReason}
              </p>
            </div>
          </div>
        )}

        {cancelError && (
          <div className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1.5 bg-rose-50 p-2 rounded-lg border border-rose-100">
            <AlertCircle className="w-3.5 h-3.5" />
            {cancelError}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-end gap-3">
        {canEdit && (
          <button
            onClick={() => onEdit?.(booking)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        )}
        {canCancel && !showConfirm && (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
          >
            <Trash2 className="w-4 h-4" />
            Cancel Booking
          </button>
        )}

        <button
          onClick={() => {/* View detail logic could go here */ }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md group"
        >
          View Details
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Cancel Confirmation Overlay */}
      <AnimatePresence>
        {showConfirm && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Cancel Reservation?</h4>
            <p className="text-sm text-slate-500 mb-6 max-w-[240px]">
              This action cannot be undone. Are you sure you want to cancel your booking?
            </p>
            <div className="flex gap-3 w-full max-w-[280px]">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                No, Keep it
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  );
}


