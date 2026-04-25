import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  User,
  Settings,
  LogOut,
  Search,
  Filter,
  Calendar,
  List,
  Plus,
  RefreshCw,
  CalendarDays,
  ChevronRight,
  Inbox,
  LayoutGrid,
  Info
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import BookingCard from '../components/BookingCard';
import CreateBookingModal from '../components/CreateBookingModal';
import Toast from '../components/Toast';
import { getMyBookings } from '../services/bookingService';
import { useAuth } from '../context/useAuth';
import campusLogo from '../assets/campus-logo.png';
import NotificationDropdown from '../components/NotificationDropdown';

const STATUS_OPTIONS = ['All', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

// ---------- Skeleton Loading Component ----------
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-4 bg-slate-100 rounded-full w-24" />
      <div className="h-6 bg-slate-100 rounded-full w-20" />
    </div>
    <div className="space-y-2">
      <div className="h-6 bg-slate-100 rounded-lg w-3/4" />
      <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="h-10 bg-slate-50 rounded-xl" />
      <div className="h-10 bg-slate-50 rounded-xl" />
    </div>
  </div>
);

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

  const bookingsByDay = {};
  bookings.forEach(b => {
    const dateStr = b.bookingDate;
    if (!dateStr) return;
    const d = new Date(`${dateStr}T00:00:00`);
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate();
      if (!bookingsByDay[day]) bookingsByDay[day] = [];
      bookingsByDay[day].push(b);
    }
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
    >
      <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-600">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{monthLabel}</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <button onClick={nextMonth} className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-7 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-xs font-bold text-slate-400 text-center py-2 uppercase tracking-widest">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {cells.map((day, idx) => (
            <div
              key={idx}
              className={`min-h-[100px] rounded-2xl p-2.5 transition-all ${day ? 'bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5' : 'bg-transparent'
                } ${isToday(day) ? 'ring-2 ring-indigo-500 bg-white shadow-lg shadow-indigo-500/10' : ''}`}
            >
              {day && (
                <>
                  <span className={`text-sm font-bold ${isToday(day) ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {day}
                  </span>
                  <div className="mt-2 space-y-1">
                    {(bookingsByDay[day] || []).slice(0, 3).map((b, i) => (
                      <div
                        key={i}
                        className={`truncate rounded-lg px-2 py-1 text-white text-[10px] font-bold ${STATUS_CHIP_COLORS[b.status] || 'bg-slate-400'
                          } shadow-sm`}
                        title={b.purpose || b.resourceName}
                      >
                        {b.purpose || b.resourceName || 'Booking'}
                      </div>
                    ))}
                    {(bookingsByDay[day] || []).length > 3 && (
                      <div className="text-[10px] text-slate-400 font-bold pl-1 italic">
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
    </Motion.div>
  );
}

// ---------- Main Page ----------
export default function BookingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState('list');
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
      // Simulate slight delay for premium feel of skeletons
      setTimeout(() => setLoading(false), 600);
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
      setStatusFilter('All');
    }
  }, [location.search]);

  const handleBookingCreated = () => {
    setToast({ message: 'Booking submitted successfully!', type: 'success' });
    fetchBookings();
  };

  const handleRefresh = () => {
    fetchBookings();
  };

  // Group and Sort Logic
  const processedBookings = useMemo(() => {
    // 1. Filter
    const filtered = bookings.filter(b => {
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        (b.purpose || '').toLowerCase().includes(term) ||
        (b.resourceName || b.resource?.name || '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });

    // 2. Sort by date (descending) and then time
    const sorted = filtered.sort((a, b) => {
      const dateDiff = new Date(`${b.bookingDate}T00:00:00`) - new Date(`${a.bookingDate}T00:00:00`);
      if (dateDiff !== 0) return dateDiff;
      return b.startTime.localeCompare(a.startTime);
    });

    // 3. Group by date
    const groups = sorted.reduce((acc, booking) => {
      const date = booking.bookingDate;
      if (!acc[date]) acc[date] = [];
      acc[date].push(booking);
      return acc;
    }, {});

    return Object.entries(groups);
  }, [bookings, searchTerm, statusFilter]);

  const formatDateHeader = (dateStr) => {
    const d = new Date(`${dateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (d.getTime() === today.getTime()) return 'Today';

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-1 bg-indigo-50 rounded-2xl">
                <img src={campusLogo} alt="Logo" className="h-12 w-12 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">WNU <span className="text-indigo-600 font-medium tracking-normal text-base ml-1 border-l border-slate-300 pl-2">Operations Hub</span></h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-none mt-1">My Reservation Dashboard</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl">
              {[
                { label: 'Resources', path: '/student-resources' },
                { label: 'Home', path: '/home' },
                { label: 'Tickets', path: '/student-tickets' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <NotificationDropdown
                userId={user?.id}
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onToggle={() => setShowNotifications((c) => !c)}
              />

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-200 flex items-center justify-center hover:scale-105 transition-transform"
              >
                {user?.firstName?.charAt(0)}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence>
          {toast && (
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <Motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Facility Reservations</h2>
            <div className="flex items-center gap-4 text-slate-500 font-medium">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm text-xs">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{processedBookings.length} Active Days</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm text-xs">
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
                <span>{bookings.length} Total Bookings</span>
              </div>
            </div>
          </Motion.div>

          <Motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all group"
          >
            <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            Create New Booking
          </Motion.button>
        </div>

        {/* Filters & Controls */}
        <div className="bg-white p-4 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 mb-10">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by purpose or resource…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all text-slate-700 font-medium placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-4">
              <div className="relative min-w-[200px]">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full pl-11 pr-10 py-4 bg-slate-50 border-transparent rounded-2xl appearance-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all font-bold text-slate-600 text-sm"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <Calendar className="w-4 h-4" />
                  Calendar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {error && (
          <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl text-center">
            <Info className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-rose-800 font-bold">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView bookings={bookings} />
        ) : processedBookings.length === 0 ? (
          <Motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 px-8 bg-white rounded-[3rem] border border-dashed border-slate-300 text-center"
          >
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Inbox className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No bookings found</h3>
            <p className="text-slate-500 max-w-sm mb-8 font-medium">
              {searchTerm || statusFilter !== 'All'
                ? "We couldn't find any bookings matching your current filters. Try adjusting them!"
                : "Your reservation list is currently empty. Start by booking a campus resource today."}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              Make Your First Booking
            </button>
          </Motion.div>
        ) : (
          <div className="space-y-12">
            {processedBookings.map(([date, dayBookings]) => (
              <section key={date} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                    {formatDateHeader(date)}
                  </h3>
                  <div className="h-px bg-slate-200 w-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dayBookings.map(booking => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onRefresh={handleRefresh}
                      currentUserId={user?.id}
                      isAdmin={false}
                      isHighlighted={String(booking.id) === String(highlightId)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Modal & Overlays */}
      {showCreateModal && (
        <CreateBookingModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleBookingCreated}
        />
      )}

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute right-8 top-20 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 transform origin-top-right transition-all">
            <div className="p-4 border-b border-slate-50">
              <p className="font-black text-slate-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{user?.role}</p>
            </div>
            <div className="p-2 space-y-1">
              <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                <User className="w-4 h-4" /> Profile Settings
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

