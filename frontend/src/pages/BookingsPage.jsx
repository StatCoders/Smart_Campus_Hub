import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import BookingCard from '../components/BookingCard';
import CreateBookingModal from '../components/CreateBookingModal';
import Toast from '../components/Toast';
import { getMyBookings } from '../services/bookingService';
import { useAuth } from '../context/useAuth';

const STATUS_OPTIONS = ['All', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

// ---------- Tiny Calendar helpers ----------

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

const STATUS_CHIP_COLORS = {
  APPROVED: 'bg-emerald-500',
  PENDING: 'bg-amber-400',
  REJECTED: 'bg-rose-500',
  CANCELLED: 'bg-slate-400',
};

function CalendarView({ bookings }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // Map bookings by day of the displayed month
  const bookingsByDay = {};
  bookings.forEach(b => {
    const dateStr = b.bookingDate; // "2026-04-13" (LocalDate from backend)
    if (!dateStr) return;
    const d = new Date(`${dateStr}T00:00:00`);
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate();
      if (!bookingsByDay[day]) bookingsByDay[day] = [];
      bookingsByDay[day].push(b);
    }
  });

  const cells = [];
  // Blank cells for first week
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const isToday = (d) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="font-semibold text-slate-800">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-xs font-medium text-slate-400 text-center py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => (
          <div
            key={idx}
            className={`min-h-[64px] rounded-xl p-1.5 text-xs ${
              day ? 'bg-slate-50 hover:bg-indigo-50 transition-colors' : ''
            } ${isToday(day) ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}
          >
            {day && (
              <>
                <span className={`font-semibold ${isToday(day) ? 'text-indigo-600' : 'text-slate-600'}`}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {(bookingsByDay[day] || []).slice(0, 3).map((b, i) => (
                    <div
                      key={i}
                      className={`truncate rounded px-1 py-0.5 text-white text-[10px] ${
                        STATUS_CHIP_COLORS[b.status] || 'bg-slate-400'
                      }`}
                      title={b.purpose || b.resourceName}
                    >
                      {b.purpose || b.resourceName || 'Booking'}
                    </div>
                  ))}
                  {(bookingsByDay[day] || []).length > 3 && (
                    <div className="text-[10px] text-slate-400 pl-1">
                      +{bookingsByDay[day].length - 3} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Main Page ----------

export default function BookingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyBookings();
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

  const handleBookingCreated = () => {
    setToast({ message: 'Booking submitted successfully!', type: 'success' });
    fetchBookings();
  };

  const handleRefresh = () => {
    fetchBookings();
  };

  // Filter bookings
  const filtered = bookings.filter(b => {
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (b.purpose || '').toLowerCase().includes(term) ||
      (b.resourceName || b.resource?.name || '').toLowerCase().includes(term) ||
      (b.location || '').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 overflow-auto ml-64">
        <TopBar user={user} />

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        <div className="p-8">
          {/* Page header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
              <p className="text-slate-500 mt-1">View and manage your facility reservations</p>
            </div>
            <button
              id="new-booking-btn"
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <span className="text-lg leading-none">+</span> New Booking
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-300 text-rose-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search by purpose or resource…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              id="status-filter"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
              ))}
            </select>

            {/* View toggle */}
            <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
                id="list-view-btn"
              >
                ☰ List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
                id="calendar-view-btn"
              >
                📅 Calendar
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
          ) : viewMode === 'calendar' ? (
            <CalendarView bookings={filtered} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-5xl mb-3">📅</div>
              <p className="text-slate-600 font-medium text-lg">No bookings found</p>
              <p className="text-slate-400 text-sm mt-1">
                {statusFilter !== 'All' ? 'Try a different status filter' : 'Click "+ New Booking" to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-1">
                Showing {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
              </p>
              {filtered.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onRefresh={handleRefresh}
                  currentUserId={user?.id}
                  isAdmin={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Booking Modal */}
      {showCreateModal && (
        <CreateBookingModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleBookingCreated}
        />
      )}
    </div>
  );
}
