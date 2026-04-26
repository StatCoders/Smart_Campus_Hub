import React, { useEffect, useState, useCallback } from 'react';
import { Search, Calendar as CalendarIcon, Clock, MapPin, Users, FileText, Info, BookOpen } from 'lucide-react';
import TechnicianMaintenanceSidebar from '../components/TechnicianMaintenanceSidebar';
import TopBar from '../components/TopBar';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';

// Skeletons
function BookingSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-l-4 border-emerald-500 animate-pulse">
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-200 w-8 h-8"></div>
          <div className="space-y-2">
            <div className="h-2 bg-slate-200 rounded w-20"></div>
            <div className="h-3 bg-slate-200 rounded w-32"></div>
          </div>
        </div>
        <div className="h-6 bg-emerald-100 rounded-full w-24"></div>
      </div>
      <div className="p-5 space-y-4">
        <div className="h-5 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-slate-100 rounded"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
        </div>
      </div>
    </div>
  );
}

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

export default function TechnicianBookingsPage() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('bookings');
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/bookings');
      const data = response.data?.data || response.data || [];
      const approved = (Array.isArray(data) ? data : []).filter(b => b.status === 'APPROVED');
      setBookings(approved);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bookings. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filtered = bookings.filter(b => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      !term ||
      (b.resourceName || '').toLowerCase().includes(term) ||
      (b.purpose || '').toLowerCase().includes(term) ||
      (b.userFullName || b.userName || b.user?.name || '').toLowerCase().includes(term);
    
    const matchesDate = !dateFilter || b.bookingDate === dateFilter;
    
    return matchesSearch && matchesDate;
  });

  // Group by date
  const grouped = filtered.sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate))
    .reduce((acc, b) => {
      const date = b.bookingDate;
      if (!acc[date]) acc[date] = [];
      acc[date].push(b);
      return acc;
    }, {});

  return (
    <div className="flex h-screen bg-slate-50 font-inter">
      <TechnicianMaintenanceSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className={`flex-1 overflow-auto transition-all duration-300 ease-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <TopBar user={user} />

        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Approved Bookings</h1>
            <p className="text-slate-500 mt-1">View all approved campus resource bookings</p>
          </div>

          {/* Info Banner */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 mb-8 flex gap-4 items-start shadow-sm">
            <div className="bg-white p-2 rounded-xl shadow-sm text-sky-600 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sky-900 font-semibold text-sm">You are viewing approved bookings in read-only mode.</p>
              <p className="text-sky-700 text-xs mt-0.5">Use this to plan maintenance around confirmed reservations.</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-300 text-rose-700 px-5 py-4 rounded-2xl mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 font-bold">
                !
              </div>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by resource, purpose or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all outline-none"
              />
            </div>
            <div className="relative">
              <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all outline-none"
              />
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <BookingSkeleton />
              <BookingSkeleton />
              <BookingSkeleton />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                📅
              </div>
              <h3 className="text-xl font-bold text-slate-900">No approved bookings found</h3>
              <p className="text-slate-500 mt-2">There are no confirmed reservations matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.keys(grouped).sort().map(date => (
                <div key={date}>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-3">
                    {formatBookingDate(date)}
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grouped[date].map(booking => (
                      <div 
                        key={booking.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md border-l-4 border-emerald-500"
                      >
                        {/* Card Header */}
                        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white shadow-sm text-emerald-600">
                              <CalendarIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                                {formatBookingDate(booking.bookingDate)}
                              </p>
                              <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {formatLocalTime(booking.startTime)} — {formatLocalTime(booking.endTime)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            APPROVED
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 flex-1 space-y-4">
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <span className="truncate">{booking.resourceName || 'Unnamed Resource'}</span>
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500 pl-10">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate">{booking.location || 'Main Building'}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 pl-10">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                <Users className="w-3.5 h-3.5" />
                              </div>
                              <p className="text-sm font-semibold text-slate-700">{booking.expectedAttendees || '0'} attendees</p>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 text-xs">
                                👤
                              </div>
                              <p className="text-sm font-semibold text-slate-700 truncate">
                                <span className="text-slate-400 font-medium">Booked by:</span> {booking.userFullName || booking.userName || booking.user?.name || 'Unknown'}
                              </p>
                            </div>
                            <div className="flex items-start gap-2.5 pt-1">
                              <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <p className="text-sm font-medium text-slate-600 italic leading-relaxed">
                                {booking.purpose || 'No purpose stated'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
