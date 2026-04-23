import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import BookingCard from '../components/BookingCard';
import Toast from '../components/Toast';
import { getAllBookings, approveBooking, rejectBooking } from '../services/bookingService';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';

const STATUS_OPTIONS = ['All', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

// ---------- Reject Reason Modal ----------

function RejectModal({ booking, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(booking.id, reason.trim());
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to reject booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Reject Booking</h2>
        <p className="text-sm text-slate-500 mb-5">
          Provide a reason for rejecting{' '}
          <span className="font-medium text-slate-700">
            "{booking.purpose || 'this booking'}"
          </span>
          .
        </p>

        {error && (
          <div className="bg-rose-50 border border-rose-300 text-rose-700 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        <textarea
          value={reason}
          onChange={e => { setReason(e.target.value); setError(''); }}
          rows={4}
          placeholder="Enter rejection reason…"
          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 focus:border-transparent resize-none mb-5"
          id="reject-reason-input"
        />

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {loading ? 'Rejecting…' : 'Confirm Rejection'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Admin Booking Row ----------

function AdminBookingRow({ booking, onApprove, onReject, onRefresh, isHighlighted }) {
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleApprove = async () => {
    setApproving(true);
    setApproveError('');
    try {
      await onApprove(booking.id);
      onRefresh();
    } catch (err) {
      setApproveError(typeof err === 'string' ? err : 'Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectConfirm = async (id, reason) => {
    await onReject(id, reason);
    onRefresh();
  };

  const isPending = booking.status === 'PENDING';
  const rowRef = useRef(null);

  useEffect(() => {
    if (isHighlighted && rowRef.current) {
      setTimeout(() => {
        rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [isHighlighted]);

  return (
    <>
      <div 
        ref={rowRef}
        className={`bg-white rounded-2xl border transition-all duration-500 shadow-sm p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center ${
          isHighlighted 
            ? 'border-yellow-400 ring-2 ring-yellow-400 ring-offset-2 scale-[1.01] bg-yellow-50/30' 
            : 'border-slate-200'
        }`}
      >
        {/* Booking info (reuse BookingCard layout concept inline) */}
        <div className="flex-1 min-w-0">
          <BookingCard
            booking={booking}
            onRefresh={onRefresh}
            isAdmin={true}
            isHighlighted={isHighlighted}
          />
        </div>

        {/* Admin action buttons – only for PENDING bookings */}
        {isPending && (
          <div className="flex flex-col gap-2 shrink-0 sm:ml-4">
            <button
              onClick={handleApprove}
              disabled={approving}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition-colors"
              id={`approve-btn-${booking.id}`}
            >
              {approving ? 'Approving…' : '✓ Approve'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors"
              id={`reject-btn-${booking.id}`}
            >
              ✕ Reject
            </button>
            {approveError && (
              <p className="text-xs text-rose-500">{approveError}</p>
            )}
          </div>
        )}
      </div>

      {showRejectModal && (
        <RejectModal
          booking={booking}
          onConfirm={handleRejectConfirm}
          onClose={() => setShowRejectModal(false)}
        />
      )}
    </>
  );
}

// ---------- Main Admin Page ----------

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('bookings');
  const [highlightId, setHighlightId] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllBookings();
      // Service now unwraps ApiResponse → data is a plain array
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle deep linking/highlighting
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlight = params.get('highlight');
    if (highlight) {
      setHighlightId(highlight);
      // If we have a highlight, we might want to ensure it's not filtered out
      setStatusFilter('All');
    }
  }, [location.search]);

  const handleApprove = async (id) => {
    await approveBooking(id);
    setToast({ message: 'Booking approved successfully!', type: 'success' });
    fetchBookings();
  };

  const handleReject = async (id, reason) => {
    await rejectBooking(id, reason);
    setToast({ message: 'Booking rejected.', type: 'success' });
    fetchBookings();
  };

  const handleRefresh = () => {
    fetchBookings();
  };

  // Filter
  const filtered = bookings.filter(b => {
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (b.purpose || '').toLowerCase().includes(term) ||
      (b.userName || b.user?.name || '').toLowerCase().includes(term) ||
      (b.resourceName || b.resource?.name || '').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  // Stats summary
  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className={`flex-1 overflow-auto transition-all duration-300 ease-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <TopBar user={user} />

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        <div className="p-8">
          {/* Page header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">All Bookings</h1>
              <p className="text-slate-500 mt-1">Review and manage all campus facility bookings</p>
            </div>
          </div>

          {/* Stats row */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Pending', count: counts.PENDING || 0, color: 'bg-amber-50 border-amber-300 text-amber-700' },
                { label: 'Approved', count: counts.APPROVED || 0, color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
                { label: 'Rejected', count: counts.REJECTED || 0, color: 'bg-rose-50 border-rose-300 text-rose-700' },
                { label: 'Cancelled', count: counts.CANCELLED || 0, color: 'bg-slate-50 border-slate-300 text-slate-600' },
              ].map(stat => (
                <div key={stat.label} className={`rounded-2xl border px-5 py-4 ${stat.color}`}>
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-sm font-medium mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-300 text-rose-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search by user, purpose or resource…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                id="admin-search"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              id="admin-status-filter"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
              ))}
            </select>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-slate-600 font-medium text-lg">No bookings found</p>
              <p className="text-slate-400 text-sm mt-1">
                {statusFilter !== 'All' ? 'Try a different status filter' : 'No bookings have been made yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 mb-1">
                Showing {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
              </p>
              {filtered.map(booking => (
                <AdminBookingRow
                  key={booking.id}
                  booking={booking}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRefresh={handleRefresh}
                  isHighlighted={String(booking.id) === String(highlightId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
