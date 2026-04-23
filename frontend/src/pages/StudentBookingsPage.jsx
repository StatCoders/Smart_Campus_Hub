import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, User, Settings, LogOut,
  MapPin, Users, Clock, Search,
  CalendarPlus, BookOpen, ChevronRight,
  Sparkles, Filter, X,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import campusLogo from '../assets/campus-logo.png';
import { getAllFacilities } from '../services/facilityService';
import CreateBookingModal from '../components/CreateBookingModal';
import Toast from '../components/Toast';
import NotificationDropdown from '../components/NotificationDropdown';

// ─────────────────────────────────────────────────────────────
// Resource type labels + icons
// ─────────────────────────────────────────────────────────────
const TYPE_META = {
  LECTURE_HALL: { label: 'Lecture Hall', icon: '🏛️', color: 'bg-purple-100 text-purple-700' },
  LAB:          { label: 'Lab',          icon: '🧪', color: 'bg-blue-100 text-blue-700'   },
  MEETING_ROOM: { label: 'Meeting Room', icon: '💼', color: 'bg-teal-100 text-teal-700'   },
  EQUIPMENT:    { label: 'Equipment',    icon: '🎥', color: 'bg-orange-100 text-orange-700'},
};

function getTypeMeta(type) {
  return TYPE_META[type] || { label: type, icon: '📦', color: 'bg-slate-100 text-slate-700' };
}

// ─────────────────────────────────────────────────────────────
// Resource card — matches StudentResourcesPage.jsx design
// ─────────────────────────────────────────────────────────────
function ResourceCard({ resource, onBook }) {
  const meta = getTypeMeta(resource.type);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden
                    hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">

      {/* ── Image ── */}
      <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {resource.imageUrl ? (
          <img
            src={resource.imageUrl}
            alt={resource.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : resource.imagePath ? (
          <img
            src={`/uploads/${resource.imagePath}`}
            alt={resource.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-60">{meta.icon}</span>
          </div>
        )}

        {/* "Book Now" ribbon on hover */}
        <div className="absolute inset-0 bg-indigo-600/70 opacity-0 group-hover:opacity-100
                        transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white font-bold text-lg flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" /> Book Now
          </span>
        </div>
      </div>

      {/* ── Blue gradient header ── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-white leading-snug truncate">{resource.name}</h3>
          <p className="text-blue-200 text-xs mt-0.5 uppercase tracking-wide">
            {meta.label}
          </p>
        </div>
        <span className="flex-shrink-0 px-2.5 py-1 rounded bg-white/20 text-white text-xs font-semibold border border-white/30">
          Active
        </span>
      </div>

      {/* ── Details ── */}
      <div className="px-5 py-4 space-y-3 flex-1">
        {/* Location */}
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500">Location</p>
            <p className="text-sm font-semibold text-slate-800">
              {resource.building}
              {resource.floor
                ? ` — ${resource.floor.includes('Floor') || resource.floor.includes('floor')
                    ? resource.floor
                    : `${resource.floor} Floor`}`
                : ''}
            </p>
          </div>
        </div>

        {/* Capacity */}
        <div className="flex items-start gap-2.5">
          <Users className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500">Capacity</p>
            <p className="text-sm font-semibold text-slate-800">
              {resource.capacity ? `${resource.capacity} people` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Availability windows */}
        {resource.availabilityWindows && (
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500">Available Hours</p>
              <p className="text-sm font-semibold text-slate-800">{resource.availabilityWindows}</p>
            </div>
          </div>
        )}

        {/* Booking status badge */}
        <div>
          <p className="text-xs text-slate-500 mb-1.5">Booking Status</p>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                           bg-emerald-100 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Available for Booking
          </span>
        </div>
      </div>

      {/* ── Footer — "New Booking" button ── */}
      <div className="px-5 pb-5 pt-0">
        <button
          onClick={() => onBook(resource)}
          id={`book-resource-${resource.id}`}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600
                     hover:from-indigo-700 hover:to-blue-700
                     text-white font-bold py-3 px-4 rounded-xl
                     transition-all duration-200 shadow-sm hover:shadow-md
                     flex items-center justify-center gap-2 group/btn"
        >
          <CalendarPlus className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
          New Booking
          <ChevronRight className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stats bar
// ─────────────────────────────────────────────────────────────
function StatPill({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
      <span className="text-lg">{icon}</span>
      <div>
        <p className="text-xs text-slate-500 leading-none">{label}</p>
        <p className="text-sm font-bold text-slate-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function StudentBookingsPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [isMenuOpen, setIsMenuOpen]         = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [resources, setResources]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');

  const [searchTerm, setSearchTerm]         = useState('');
  const [typeFilter, setTypeFilter]         = useState('All');

  const [selectedResource, setSelectedResource] = useState(null);
  const [showModal, setShowModal]           = useState(false);
  const [toast, setToast]                   = useState(null);

  // ── Logout ────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ── Fetch resources (CAN_BOOK_NOW only) ───────────────────
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAllFacilities();
        let list = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data?.content && Array.isArray(data.content)) {
          list = data.content;
        } else if (data?.data && Array.isArray(data.data)) {
          list = data.data;
        }
        // Only show resources that are open for booking
        setResources(list.filter((r) => r.bookingStatus === 'CAN_BOOK_NOW'));
      } catch (err) {
        setError(err?.message || 'Failed to load resources. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ── Filtering ─────────────────────────────────────────────
  const typeOptions = ['All', ...new Set(resources.map((r) => r.type))];

  const filtered = resources.filter((r) => {
    if (typeFilter !== 'All' && r.type !== typeFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        r.name.toLowerCase().includes(term) ||
        (r.building || '').toLowerCase().includes(term) ||
        (r.floor || '').toLowerCase().includes(term)
      );
    }
    return true;
  });

  // ── Open booking modal ────────────────────────────────────
  const handleBook = (resource) => {
    setSelectedResource(resource);
    setShowModal(true);
  };

  const handleBookingSuccess = () => {
    setToast({ message: 'Booking submitted successfully! It is pending approval.', type: 'success' });
    setShowModal(false);
    setSelectedResource(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Navigation Header ── */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/98 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={campusLogo} alt="Winterfall Northern University" className="h-12 w-12" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Winterfall Northern University</h1>
                <p className="text-xs text-blue-600 font-medium">Book a Resource</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => navigate('/home')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/student-bookings')}
                className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-0.5"
              >
                Bookings
              </button>
              <button
                onClick={() => navigate('/student-tickets')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Tickets
              </button>
            </nav>

            {/* User area */}
            <div className="flex items-center gap-3 relative">
              <NotificationDropdown
                userId={user?.id}
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onToggle={() => setShowNotifications((c) => !c)}
              />

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-lg transition"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
              </button>

              {/* Dropdown */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName || ''}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {user?.role || 'USER'}
                      </span>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition"
                    >
                      <User className="w-4 h-4" /> Your Profile
                    </button>
                    <button
                      onClick={() => { navigate('/settings'); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Toast */}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        {/* ── Hero section ── */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">
                  Student Booking Portal
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Book a Campus Resource
              </h2>
              <p className="text-slate-500 mt-1.5 text-sm">
                Browse available spaces and equipment — select a resource to make a new reservation.
              </p>
            </div>

            {/* Stats */}
            {!loading && !error && (
              <div className="flex flex-wrap gap-2">
                <StatPill icon="🏢" label="Available" value={`${resources.length} resources`} />
                <StatPill icon="📋" label="Showing" value={`${filtered.length} results`} />
              </div>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
            <X className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Search & filter bar ── */}
        {!loading && !error && (
          <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, building or floor…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  id="student-bookings-search"
                />
              </div>

              {/* Type filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  id="student-bookings-type-filter"
                  className="pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none"
                >
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t === 'All' ? 'All Types' : getTypeMeta(t).label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear */}
              {(searchTerm || typeFilter !== 'All') && (
                <button
                  onClick={() => { setSearchTerm(''); setTypeFilter('All'); }}
                  className="flex items-center gap-1 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900
                             border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Loading state ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="h-16 bg-blue-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-10 bg-slate-200 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No resources found</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              {searchTerm || typeFilter !== 'All'
                ? 'No resources match your search. Try adjusting your filters.'
                : 'There are currently no resources available for booking.'}
            </p>
            {(searchTerm || typeFilter !== 'All') && (
              <button
                onClick={() => { setSearchTerm(''); setTypeFilter('All'); }}
                className="mt-4 text-sm text-indigo-600 hover:underline font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          /* ── Resource grid ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onBook={handleBook}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Booking Modal ── */}
      {showModal && selectedResource && (
        <CreateBookingModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setSelectedResource(null); }}
          onSuccess={handleBookingSuccess}
          preSelectedResource={selectedResource}
        />
      )}
    </div>
  );
}
