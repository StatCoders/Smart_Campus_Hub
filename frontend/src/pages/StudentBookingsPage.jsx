import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, User, Settings, LogOut,
  MapPin, Users, Clock, Search,
  CalendarPlus, BookOpen, ChevronRight,
  Sparkles, Filter, X, LayoutGrid,
  Calendar, List, Inbox, RefreshCw,
  Info, CalendarDays
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import campusLogo from '../assets/campus-logo.png';
import { getAllFacilities } from '../services/facilityService';
import { getMyBookings } from '../services/bookingService';
import CreateBookingModal from '../components/CreateBookingModal';
import BookingCard from '../components/BookingCard';
import Toast from '../components/Toast';
import NotificationDropdown from '../components/NotificationDropdown';

// ─────────────────────────────────────────────────────────────
// Resource type labels + icons
// ─────────────────────────────────────────────────────────────
const TYPE_META = {
  LECTURE_HALL: { label: 'Lecture Hall', icon: '🏛️', color: 'bg-purple-100 text-purple-700' },
  LAB: { label: 'Lab', icon: '🧪', color: 'bg-blue-100 text-blue-700' },
  MEETING_ROOM: { label: 'Meeting Room', icon: '💼', color: 'bg-teal-100 text-teal-700' },
  EQUIPMENT: { label: 'Equipment', icon: '🎥', color: 'bg-orange-100 text-orange-700' },
};

function getTypeMeta(type) {
  return TYPE_META[type] || { label: type, icon: '📦', color: 'bg-slate-100 text-slate-700' };
}

// ---------- Skeleton Loading Components ----------
const ResourceSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="h-48 bg-slate-100" />
    <div className="h-16 bg-blue-50/50" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-slate-100 rounded w-3/4" />
      <div className="h-4 bg-slate-100 rounded w-1/2" />
      <div className="h-10 bg-slate-100 rounded-xl mt-4" />
    </div>
  </div>
);

const BookingSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-4 bg-slate-100 rounded-full w-24" />
      <div className="h-6 bg-slate-100 rounded-full w-20" />
    </div>
    <div className="space-y-2">
      <div className="h-6 bg-slate-100 rounded-lg w-3/4" />
      <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
    </div>
    <div className="h-10 bg-slate-50 rounded-xl" />
  </div>
);

// ─────────────────────────────────────────────────────────────
// Resource card — matches StudentResourcesPage.jsx design
// ─────────────────────────────────────────────────────────────
function ResourceCard({ resource, onBook }) {
  const meta = getTypeMeta(resource.type);

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden
                    hover:shadow-xl transition-all duration-300 flex flex-col group"
    >
      <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {resource.imageUrl ? (
          <img
            src={resource.imageUrl}
            alt={resource.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-60">{meta.icon}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-indigo-600/70 opacity-0 group-hover:opacity-100
                        transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white font-bold text-lg flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" /> Book Now
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-white leading-snug truncate">{resource.name}</h3>
          <p className="text-blue-200 text-xs mt-0.5 uppercase tracking-wide">{meta.label}</p>
        </div>
        <span className="flex-shrink-0 px-2.5 py-1 rounded bg-white/20 text-white text-xs font-semibold border border-white/30">
          Active
        </span>
      </div>

      <div className="px-5 py-4 space-y-3 flex-1">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500">Location</p>
            <p className="text-sm font-semibold text-slate-800">
              {resource.building}{resource.floor ? ` — ${resource.floor}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Users className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500">Capacity</p>
            <p className="text-sm font-semibold text-slate-800">{resource.capacity || 'N/A'}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500">Available Hours</p>
            <p className="text-sm font-semibold text-slate-800">{resource.availabilityWindows || 'Standard Hours'}</p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-0">
        <button
          onClick={() => onBook(resource)}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700
                     text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md
                     flex items-center justify-center gap-2 group/btn"
        >
          <CalendarPlus className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
          New Booking
          <ChevronRight className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </Motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function StudentBookingsPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'my-bookings'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [resources, setResources] = useState([]);
  const [personalBookings, setPersonalBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedResource, setSelectedResource] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'book') {
        const data = await getAllFacilities();
        let list = Array.isArray(data) ? data : data?.content || data?.data || [];
        setResources(list.filter((r) => r.bookingStatus === 'CAN_BOOK_NOW'));
      } else {
        const data = await getMyBookings();
        setPersonalBookings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load data. Please try again.');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtering Logic
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (typeFilter !== 'All' && r.type !== typeFilter) return false;
      const term = searchTerm.toLowerCase();
      return r.name.toLowerCase().includes(term) || (r.building || '').toLowerCase().includes(term);
    });
  }, [resources, typeFilter, searchTerm]);

  const processedMyBookings = useMemo(() => {
    const filtered = personalBookings.filter(b => {
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      const term = searchTerm.toLowerCase();
      return matchesStatus && ((b.purpose || '').toLowerCase().includes(term) || (b.resourceName || '').toLowerCase().includes(term));
    });

    const sorted = filtered.sort((a, b) => new Date(`${b.bookingDate}T00:00:00`) - new Date(`${a.bookingDate}T00:00:00`));

    return Object.entries(sorted.reduce((acc, b) => {
      if (!acc[b.bookingDate]) acc[b.bookingDate] = [];
      acc[b.bookingDate].push(b);
      return acc;
    }, {}));
  }, [personalBookings, searchTerm, statusFilter]);

  const handleBook = (resource) => {
    setEditBooking(null);
    setSelectedResource(resource);
    setShowModal(true);
  };

  const handleEdit = (booking) => {
    setEditBooking(booking);
    setSelectedResource(null);
    setShowModal(true);
  };

  const handleBookingSuccess = () => {
    setToast({ message: editBooking ? 'Booking updated successfully!' : 'Booking submitted successfully!', type: 'success' });
    setShowModal(false);
    setSelectedResource(null);
    setEditBooking(null);
    if (activeTab === 'my-bookings') fetchData();
    else setActiveTab('my-bookings');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedResource(null);
    setEditBooking(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
                onClick={() => navigate('/home')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/student-resources')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Resources
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
                onToggle={() => {
                  setShowNotifications((c) => !c);
                  setIsMenuOpen(false);
                }}
              />

              {/* Profile Button */}
              <button
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setShowNotifications(false);
                }}
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {activeTab === 'book' ? 'Book Campus Spaces and Equipments' : 'My Bookings'}
            </h2>
            <p className="text-gray-600 mt-1">
              {activeTab === 'book'
                ? 'Browse and book available university resources'
                : 'Track and manage your space reservations'}
            </p>
          </div>

          {/* ── Custom Tab Switcher ── */}
          <div className="mt-4 sm:mt-0 flex p-1 bg-gray-100 rounded-xl w-fit">
            <button
              onClick={() => { setActiveTab('book'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'book' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Book
            </button>
            <button
              onClick={() => { setActiveTab('my-bookings'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'my-bookings' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Calendar className="w-4 h-4" /> My Bookings
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'book' ? "Search resources..." : "Search your history..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex gap-3">
              {activeTab === 'book' ? (
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-700 bg-white"
                >
                  <option value="All">All Types</option>
                  {Object.keys(TYPE_META).map(t => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
                </select>
              ) : (
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-700 bg-white"
                >
                  {['All', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
                </select>
              )}
              <button
                onClick={fetchData}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => activeTab === 'book' ? <ResourceSkeleton key={i} /> : <BookingSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center">
            <Info className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-rose-800 font-bold">{error}</p>
          </div>
        ) : activeTab === 'book' ? (
          /* ── Book Tab ── */
          filteredResources.length === 0 ? (
            <div className="py-20 text-center"><Inbox className="w-16 h-16 text-slate-200 mx-auto mb-4" /><p className="text-slate-400 font-bold">No resources found</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredResources.map(r => <ResourceCard key={r.id} resource={r} onBook={handleBook} />)}
            </div>
          )
        ) : (
          /* ── My Bookings Tab ── */
          processedMyBookings.length === 0 ? (
            <div className="py-20 text-center"><Inbox className="w-16 h-16 text-slate-200 mx-auto mb-4" /><p className="text-slate-400 font-bold">No reservation history found</p></div>
          ) : (
            <div className="space-y-12">
              {processedMyBookings.map(([date, group]) => (
                <div key={date} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" /> {date}
                    </h3>
                    <div className="h-px bg-slate-200 w-full" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {group.map(b => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        onRefresh={fetchData}
                        currentUserId={user?.id}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {showModal && (
        <CreateBookingModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSuccess={handleBookingSuccess}
          preSelectedResource={selectedResource}
          editBooking={editBooking}
        />
      )}

    </div>
  );
}

