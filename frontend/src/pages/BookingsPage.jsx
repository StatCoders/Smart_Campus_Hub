import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Settings, LogOut, ArrowLeft } from 'lucide-react';
import BookingCard from '../components/BookingCard';
import CreateBookingModal from '../components/CreateBookingModal';
import Toast from '../components/Toast';
import { getMyBookings } from '../services/bookingService';
import { useAuth } from '../context/useAuth';
import campusLogo from '../assets/campus-logo.png';
import NotificationDropdown from '../components/NotificationDropdown';

const STATUS_OPTIONS = ['All', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

// ---------- Tiny Calendar helpers ----------

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay(); // 0=Sun
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
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyBookings();
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
    <div className="min-h-screen bg-white/95">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/98 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <img src={campusLogo} alt="Winterfall Northern University" className="h-12 w-12" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Winterfall Northern University</h1>
                <p className="text-xs text-blue-600 font-medium">My Bookings</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => navigate('/student-resources')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Resources
              </button>
              <button
                onClick={() => navigate('/home')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/student-tickets')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Tickets
              </button>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3 relative">
              <NotificationDropdown
                userId={user?.id}
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onToggle={() => setShowNotifications((current) => !current)}
              />
              
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-lg transition"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName || ''}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {user?.role || 'USER'}
                      </span>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition"
                    >
                      <User className="w-4 h-4" />
                      Your Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        {/* Page Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Your Facility Reservations</h2>
            <p className="text-gray-500 mt-1">View and manage all your bookings</p>
          </div>
          <button
            id="new-booking-btn"
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="text-lg leading-none">+</span> New Booking
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Controls bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by purpose or resource…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            id="status-filter"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
              id="list-view-btn"
            >
              ☰ List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView bookings={filtered} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-gray-600 font-medium text-lg">No bookings found</p>
            <p className="text-gray-400 text-sm mt-1">
              {statusFilter !== 'All' ? 'Try a different status filter' : 'Click "+ New Booking" to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-1">
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
