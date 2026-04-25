import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  ClipboardList,
  CircleDashed,
  RefreshCw,
  ShieldCheck,
  Activity,
  Zap,
  LayoutDashboard,
  Calendar,
  Settings,
  Bell,
  PieChart,
  BarChart3,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import { useCampusOperationsData } from '../hooks/useCampusOperationsData';
import { formatRelativeTime } from '../utils/dateFormatter';
import { useNotifications } from '../hooks/useNotifications';

// Trend calculation
const getTrend = (items, predicate) => {
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const currentWindow = items.filter((item) => {
    const createdAt = new Date(item.createdAt).getTime();
    return now - createdAt <= oneWeek && predicate(item);
  }).length;
  const previousWindow = items.filter((item) => {
    const createdAt = new Date(item.createdAt).getTime();
    return now - createdAt > oneWeek && now - createdAt <= oneWeek * 2 && predicate(item);
  }).length;
  if (previousWindow === 0) return currentWindow > 0 ? 100 : 0;
  return Math.round(((currentWindow - previousWindow) / previousWindow) * 100);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const { ticketsQuery, facilitiesQuery, bookingsQuery } = useCampusOperationsData();
  
  const allTickets = useMemo(() => ticketsQuery.data || [], [ticketsQuery.data]);
  const allBookings = useMemo(() => bookingsQuery.data || [], [bookingsQuery.data]);
  const allFacilities = useMemo(() => facilitiesQuery.data || [], [facilitiesQuery.data]);
  const isLoading = ticketsQuery.isLoading || bookingsQuery.isLoading || facilitiesQuery.isLoading;

  const stats = useMemo(() => ({
    tickets: {
      total: allTickets.length,
      open: allTickets.filter(t => t.status === 'OPEN').length,
      resolved: allTickets.filter(t => t.status === 'RESOLVED').length,
      urgent: allTickets.filter(t => t.priority === 'URGENT').length,
      high: allTickets.filter(t => t.priority === 'HIGH').length,
      medium: allTickets.filter(t => t.priority === 'MEDIUM').length,
      low: allTickets.filter(t => t.priority === 'LOW').length,
    },
    bookings: {
      total: allBookings.length,
      today: allBookings.filter(b => b.startTime?.startsWith(new Date().toISOString().split('T')[0])).length,
      upcoming: allBookings.filter(b => new Date(b.startTime) > new Date()).slice(0, 5),
    },
    facilities: {
      total: allFacilities.length,
      utilization: allFacilities.map(f => ({
        name: f.name,
        bookings: allBookings.filter(b => b.resourceId === f.id).length
      })).sort((a, b) => b.bookings - a.bookings).slice(0, 4)
    },
    trends: {
      tickets: getTrend(allTickets, () => true),
      bookings: getTrend(allBookings, () => true),
    }
  }), [allTickets, allBookings, allFacilities]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-sans antialiased text-slate-900">
      <Sidebar activeTab="dashboard" setActiveTab={() => {}} />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <TopBar user={user} />
        
        <main className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
          {/* Elegant & Compact Hero */}
          <section className="relative overflow-hidden rounded-3xl bg-[#0F172A] text-white p-8 lg:p-10 shadow-xl border border-white/5">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <ShieldCheck className="h-3 w-3" />
                  Campus Intelligence Hub
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                  {getTimeGreeting()}, <span className="text-blue-400 font-medium">{user?.name?.split(' ')[0] || 'Admin'}</span>
                </h1>
                <p className="text-slate-400 text-base max-w-md leading-relaxed">
                  Monitoring <span className="text-white font-semibold">{stats.tickets.total} incidents</span> and 
                  <span className="text-white font-semibold"> {stats.bookings.total} resources</span>. System flow is <strong>optimal</strong>.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <button 
                    onClick={() => { ticketsQuery.refetch(); bookingsQuery.refetch(); facilitiesQuery.refetch(); }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Sync Dashboard
                  </button>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400/80 uppercase tracking-wider">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    All Nodes Live
                  </div>
                </div>
              </div>

              {/* Refined Pulse Widget */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl min-w-[300px] backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Efficiency Metrics</span>
                  <TrendingUp className="h-4 w-4 text-emerald-500/70" />
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <HealthMetric label="Queue Flow" value="Steady" />
                  <HealthMetric label="Utility" value="High" />
                  <HealthMetric label="Resolution" value="89%" />
                  <HealthMetric label="Uptime" value="99.9%" />
                </div>
              </div>
            </div>
          </section>

          {/* Minimalist Stat Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniCard 
              icon={<ClipboardList className="text-blue-500" />} 
              label="Active Tickets" 
              value={stats.tickets.total} 
              trend={stats.trends.tickets}
              sub={`+${stats.tickets.open} pending`}
            />
            <MiniCard 
              icon={<Calendar className="text-indigo-500" />} 
              label="Resource Bookings" 
              value={stats.bookings.total} 
              trend={stats.trends.bookings}
              sub={`${stats.bookings.today} today`}
            />
            <MiniCard 
              icon={<LayoutDashboard className="text-purple-500" />} 
              label="Active Facilities" 
              value={stats.facilities.total} 
              trend={0}
              sub="Global pool"
            />
            <MiniCard 
              icon={<Zap className="text-amber-500" />} 
              label="Urgent Alerts" 
              value={stats.tickets.urgent} 
              trend={-2}
              sub="Immediate action"
            />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Analytics (7 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Operations Analytics Section */}
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Operational Throughput</h3>
                    <p className="text-xs text-slate-400">Comparing resolution flow vs resource utilization</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-slate-200" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <MinimalProgress label="Resolved Incidents" value={stats.tickets.resolved} total={stats.tickets.total} color="bg-emerald-500" />
                    <MinimalProgress label="Active Maintenance" value={stats.tickets.total - stats.tickets.resolved} total={stats.tickets.total} color="bg-blue-500" />
                    <MinimalProgress label="Facility Utility" value={stats.bookings.total} total={stats.bookings.total + 10} color="bg-indigo-400" />
                  </div>
                  
                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Priority Distribution</h4>
                    <div className="space-y-4">
                      <PriorityBar label="Urgent" count={stats.tickets.urgent} total={stats.tickets.total} color="bg-rose-500" />
                      <PriorityBar label="High" count={stats.tickets.high} total={stats.tickets.total} color="bg-amber-500" />
                      <PriorityBar label="Medium" count={stats.tickets.medium} total={stats.tickets.total} color="bg-blue-500" />
                      <PriorityBar label="Low" count={stats.tickets.low} total={stats.tickets.total} color="bg-slate-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resource Utilization Feed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-indigo-500" />
                    Most Booked Resources
                  </h3>
                  <div className="space-y-4">
                    {stats.facilities.utilization.length > 0 ? stats.facilities.utilization.map((f, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                            {i + 1}
                          </div>
                          <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">{f.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-900">{f.bookings} bookings</span>
                      </div>
                    )) : (
                      <p className="text-xs text-slate-400 text-center py-4">No utilization data available</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    Operational Health
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <HealthInsight label="Server" status="Healthy" color="text-emerald-500" />
                    <HealthInsight label="Database" status="Active" color="text-emerald-500" />
                    <HealthInsight label="Email API" status="Online" color="text-emerald-500" />
                    <HealthInsight label="Security" status="Shielded" color="text-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Feeds (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Upcoming Bookings Section */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    Upcoming Bookings
                  </h3>
                  <button onClick={() => navigate('/bookings')} className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1">
                    View All <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {stats.bookings.upcoming.length > 0 ? stats.bookings.upcoming.map((b, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{b.resourceName || 'Resource'}</span>
                        <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Upcoming</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{b.userName || 'Guest User'}</p>
                      <div className="flex items-center gap-2 mt-2 text-[9px] font-bold text-slate-500">
                        <Clock className="h-3 w-3" />
                        {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-xs text-slate-400 py-6">No upcoming bookings</p>
                  )}
                </div>
              </div>

              {/* Global Update Feed */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-500" />
                    Global Updates
                  </h3>
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <div className="p-4 flex-1 max-h-[360px] overflow-y-auto space-y-3 custom-scrollbar">
                  <SimpleFeed />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function HealthMetric({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">{label}</p>
      <p className="text-sm font-bold text-white tracking-tight">{value}</p>
    </div>
  );
}

function MiniCard({ icon, label, value, trend, sub }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-slate-50 rounded-xl">{React.cloneElement(icon, { size: 18 })}</div>
        {trend !== 0 && (
          <span className={`text-[10px] font-bold ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
      <p className="text-[10px] font-medium text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function MinimalProgress({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px] font-bold text-slate-600">
        <span>{label}</span>
        <span className="text-slate-900">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PriorityBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-[9px] font-black text-slate-400 uppercase">{label}</span>
      <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden border border-slate-100">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-[10px] font-bold text-slate-900">{count}</span>
    </div>
  );
}

function HealthInsight({ label, status, color }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className={`h-3 w-3 ${color}`} />
        <span className="text-[10px] font-black text-slate-800">{status}</span>
      </div>
    </div>
  );
}

function SimpleFeed() {
  const { user } = useAuth();
  const { notifications, loading } = useNotifications(user?.id, true);
  return (
    <div className="space-y-2.5">
      {loading ? (
        <div className="h-20 flex items-center justify-center"><div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : notifications.length === 0 ? (
        <p className="text-center text-[10px] text-slate-400 py-6">No recent updates</p>
      ) : (
        notifications.slice(0, 8).map(n => (
          <div key={n.id} className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-blue-100 transition-colors">
            <div className="flex justify-between mb-1 opacity-50 text-[9px] font-bold">
              <span className="uppercase">{n.priority}</span>
              <span>{formatRelativeTime(n.createdAt)}</span>
            </div>
            <p className="text-[11px] font-medium text-slate-600 leading-snug">{n.message}</p>
          </div>
        ))
      )}
    </div>
  );
}
