import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, AlertCircle, CheckCircle, Clock, TrendingUp, Ticket, 
  MessageSquare, Bell, Calendar, Zap, Activity, ShieldCheck, 
  ArrowUpRight, LayoutDashboard, Settings, Info
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import TicketTable from '../components/TicketTable';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import { useCampusOperationsData } from '../hooks/useCampusOperationsData';
import { useDeleteTicket } from '../hooks/useTicketMutations';
import TicketCommentModal from '../components/tickets/TicketCommentModal';
import { useNotifications } from '../hooks/useNotifications';
import { formatRelativeTime } from '../utils/dateFormatter';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('overview');
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const { ticketsQuery, facilitiesQuery, bookingsQuery } = useCampusOperationsData();
  const deleteTicketMutation = useDeleteTicket();

  const allTickets = ticketsQuery.data || [];
  const allBookings = bookingsQuery.data || [];
  const allFacilities = facilitiesQuery.data || [];
  const isLoading = ticketsQuery.isLoading || bookingsQuery.isLoading || facilitiesQuery.isLoading;

  // Comprehensive analytics
  const stats = useMemo(() => {
    return {
      tickets: {
        total: allTickets.length,
        open: allTickets.filter(t => t.status === 'OPEN').length,
        urgent: allTickets.filter(t => t.priority === 'URGENT').length,
        resolved: allTickets.filter(t => t.status === 'RESOLVED').length,
      },
      bookings: {
        total: allBookings.length,
        active: allBookings.filter(b => b.status === 'CONFIRMED').length,
        today: allBookings.filter(b => {
          const today = new Date().toISOString().split('T')[0];
          return b.startTime?.startsWith(today);
        }).length,
      },
      facilities: {
        total: allFacilities.length,
        active: allFacilities.filter(f => f.status === 'AVAILABLE').length,
      },
      health: 98.4, // Mock system health percentage
    };
  }, [allTickets, allBookings, allFacilities]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleDeleteTicket = async (ticketId) => {
    try {
      await deleteTicketMutation.mutateAsync(ticketId);
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  const handleOpenComments = (e, ticketId) => {
    e.stopPropagation();
    setSelectedTicketId(ticketId);
    setCommentModalOpen(true);
  };

  return (
    <div className="flex bg-mesh min-h-screen">
      <Sidebar activeTab="dashboard" setActiveTab={() => {}} />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <TopBar user={user} />
        
        <main className="p-4 lg:p-8 space-y-8">
          {/* Creative Hero Section */}
          <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white p-8 lg:p-12 shadow-2xl">
            {/* Animated Background Orbs */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                  <ShieldCheck className="h-4 w-4" />
                  Smart Campus Operations Hub
                </div>
                <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-4 leading-tight">
                  {getTimeGreeting()}, <span className="text-blue-400">{user?.name?.split(' ')[0] || 'Admin'}</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
                  The campus ecosystem is <span className="text-emerald-400 font-bold">running smoothly</span> today. 
                  You have <span className="text-white font-bold">{stats.tickets.urgent} urgent tickets</span> and 
                  <span className="text-white font-bold"> {stats.bookings.today} bookings</span> scheduled for today.
                </p>
                <div className="flex flex-wrap gap-4 mt-8">
                  <button 
                    onClick={() => navigate('/tickets')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <Zap className="h-5 w-5" />
                    Review Alerts
                  </button>
                  <button 
                    onClick={() => navigate('/facilities')}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Manage Facilities
                  </button>
                </div>
              </div>

              {/* Status Pulse Widget */}
              <div className="glass-dark p-8 rounded-[2rem] min-w-[300px]">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Workspace Snapshot</p>
                  <Activity className="h-5 w-5 text-blue-400 animate-pulse-slow" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-sm text-slate-400">Queue Coverage</span>
                    <span className="text-sm font-bold">{stats.tickets.total} live tickets</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-sm text-slate-400">Priority Load</span>
                    <span className="text-sm font-bold text-amber-400">{stats.tickets.open} elevated</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-sm text-slate-400">System Health</span>
                    <span className="text-sm font-bold text-emerald-400">{stats.health}%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bento Grid Stats */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatWidget 
              icon={<Ticket className="text-blue-600" />} 
              label="Campus Tickets" 
              value={stats.tickets.total} 
              trend="+12%" 
              color="blue"
              data={[10, 25, 15, 30, 20, 35, stats.tickets.total]}
            />
            <StatWidget 
              icon={<Calendar className="text-indigo-600" />} 
              label="Resource Bookings" 
              value={stats.bookings.total} 
              trend="+5%" 
              color="indigo"
              data={[5, 10, 8, 15, 12, 18, stats.bookings.total]}
            />
            <StatWidget 
              icon={<Users className="text-purple-600" />} 
              label="Active Users" 
              value={allTickets.length * 2 + 10} // Dummy calc for users
              trend="+8%" 
              color="purple"
              data={[40, 45, 42, 50, 48, 55, 60]}
            />
            <StatWidget 
              icon={<ShieldCheck className="text-emerald-600" />} 
              label="Facilities" 
              value={stats.facilities.total} 
              trend="Stable" 
              color="emerald"
              data={[10, 10, 11, 11, 12, 12, stats.facilities.total]}
            />
          </section>

          {/* Main Content Area: Activity & Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Dynamic Lists & Charts */}
            <div className="lg:col-span-2 space-y-8">
              {/* Tabs for content switching */}
              <div className="flex p-1 bg-white rounded-2xl border border-slate-200 w-fit">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'analytics', label: 'Analytics' },
                  { id: 'activity', label: 'Recent Activity' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                      activeTab === tab.id 
                        ? 'bg-slate-900 text-white shadow-lg' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Activity Pulse Chart (SVG Mock) */}
                  <div className="glass-card p-8 rounded-[2rem]">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Campus Activity Index</h3>
                        <p className="text-sm text-slate-500">Live operational throughput across all departments</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                          <ArrowUpRight className="h-3 w-3" />
                          18% Increase
                        </span>
                      </div>
                    </div>
                    
                    <div className="h-48 w-full relative group">
                      <svg viewBox="0 0 400 100" className="w-full h-full drop-shadow-2xl">
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path 
                          d="M0,80 Q50,20 100,50 T200,30 T300,70 T400,10" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="4" 
                          strokeLinecap="round"
                          className="animate-draw"
                        />
                        <path 
                          d="M0,80 Q50,20 100,50 T200,30 T300,70 T400,10 V100 H0 Z" 
                          fill="url(#gradient)" 
                        />
                      </svg>
                      {/* Interactive Tooltip Simulation */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl border border-slate-700">
                          Current Load: 84%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resource Occupancy Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-[2rem]">
                      <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Popular Facilities
                      </h3>
                      <div className="space-y-4">
                        {allFacilities.slice(0, 4).map((f, i) => (
                          <div key={f.id} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-slate-700">{f.name}</span>
                              <span className="font-bold text-slate-900">{70 + i * 5}% Booked</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                                style={{ width: `${70 + i * 5}%` }} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="glass-card p-6 rounded-[2rem] flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <Zap className="h-5 w-5 text-amber-500" />
                          Quick Insights
                        </h3>
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-sm leading-relaxed mb-4">
                          <strong>Note:</strong> Technical Lab usage is up by 25% this week. Consider increasing maintenance cycles.
                        </div>
                      </div>
                      <button className="w-full py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm">
                        View Detailed Report
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-8">
                  {/* Activity Pulse Chart (SVG Mock) */}
                  <div className="glass-card p-8 rounded-[2rem]">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Campus Activity Index</h3>
                        <p className="text-sm text-slate-500">Live operational throughput across all departments</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                          <ArrowUpRight className="h-3 w-3" />
                          18% Increase
                        </span>
                      </div>
                    </div>
                    
                    <div className="h-48 w-full relative group">
                      <svg viewBox="0 0 400 100" className="w-full h-full drop-shadow-2xl">
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path 
                          d="M0,80 Q50,20 100,50 T200,30 T300,70 T400,10" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="4" 
                          strokeLinecap="round"
                          className="animate-draw"
                        />
                        <path 
                          d="M0,80 Q50,20 100,50 T200,30 T300,70 T400,10 V100 H0 Z" 
                          fill="url(#gradient)" 
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-8">
                  <div className="glass-card rounded-[2rem] overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900">Recent Support Tickets</h3>
                      <button 
                        onClick={() => navigate('/tickets')}
                        className="text-blue-600 font-bold text-sm hover:underline"
                      >
                        View All
                      </button>
                    </div>
                    <TicketTable tickets={allTickets.slice(0, 5)} isLoading={isLoading} onDelete={handleDeleteTicket} />
                  </div>

                  <div className="glass-card rounded-[2rem] p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold text-slate-900">Recent Campus Bookings</h3>
                      <button 
                        onClick={() => navigate('/bookings')}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                      >
                        Manage All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allBookings.slice(0, 4).map(b => (
                        <div key={b.id} className="p-4 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors bg-slate-50/50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">#{b.id}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{formatRelativeTime(b.createdAt)}</span>
                          </div>
                          <p className="font-bold text-slate-900 mb-1">{b.facilityName || `Resource #${b.facilityId}`}</p>
                          <p className="text-xs text-slate-500 mb-3">{b.userName || 'Student'}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{b.status}</span>
                            <span className="text-xs font-bold text-slate-900">{b.startTime?.split('T')[0]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Notifications & Quick Actions */}
            <div className="space-y-8">
              {/* Quick Actions Card */}
              <div className="glass-card p-6 rounded-[2rem]">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-slate-400" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <ActionBtn icon={<Users className="h-4 w-4" />} label="Add User" onClick={() => navigate('/manage-users')} />
                  <ActionBtn icon={<Ticket className="h-4 w-4" />} label="New Ticket" onClick={() => navigate('/tickets')} />
                  <ActionBtn icon={<Bell className="h-4 w-4" />} label="Broadcast" onClick={() => {}} />
                  <ActionBtn icon={<Info className="h-4 w-4" />} label="Logs" onClick={() => {}} />
                </div>
              </div>

              {/* Redesigned Notifications Panel */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden sticky top-32">
                <div className="bg-slate-950 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Bell className="h-5 w-5 text-sky-400" />
                      Live Alerts
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                      <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Live Feed</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                  <AdminNotificationPanel />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <TicketCommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        ticketId={selectedTicketId}
      />
    </div>
  );
}

function StatWidget({ icon, label, value, trend, color, data }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  };

  return (
    <div className="glass-card p-6 rounded-[2rem] hover-lift group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]} border`}>
          {React.cloneElement(icon, { className: "h-6 w-6" })}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-50'}`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500 mb-1">{label}</p>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-black text-slate-900">{value}</p>
          {/* Mini Sparkline */}
          <div className="h-8 w-16 flex items-end gap-0.5 pb-1">
            {data.map((h, i) => (
              <div 
                key={i} 
                className={`w-full rounded-t-sm transition-all duration-500 group-hover:opacity-100 opacity-40 bg-${color}-500`}
                style={{ height: `${(h / Math.max(...data)) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-slate-600 hover:text-blue-600 font-bold"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

function AdminNotificationPanel() {
  const { user } = useAuth();
  const [priority, setPriority] = useState('ALL');
  const [type, setType] = useState('ALL');
  const { notifications, loading, loadNotifications } = useNotifications(user?.id, true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const filters = {};
    if (priority !== 'ALL') filters.priority = priority;
    if (type !== 'ALL') filters.type = type;
    loadNotifications(filters);
  }, [priority, type, loadNotifications]);

  const getPriorityStyles = (p) => {
    if (p === 'HIGH') return 'border-rose-100 bg-rose-50/30 text-rose-700';
    if (p === 'MEDIUM') return 'border-amber-100 bg-amber-50/30 text-amber-700';
    return 'border-sky-100 bg-sky-50/30 text-sky-700';
  };

  const getPriorityDot = (p) => {
    if (p === 'HIGH') return 'bg-rose-500';
    if (p === 'MEDIUM') return 'bg-amber-500';
    return 'bg-sky-500';
  };

  return (
    <div className="space-y-4">
      {/* Mini Filters */}
      <div className="flex gap-2 mb-4">
        <select 
          value={priority} 
          onChange={(e) => setPriority(e.target.value)}
          className="text-[10px] font-black border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-600 outline-none focus:border-blue-400 w-full"
        >
          <option value="ALL">All Priorities</option>
          <option value="HIGH">High (Tickets)</option>
          <option value="MEDIUM">Medium (Bookings)</option>
          <option value="LOW">Low (System)</option>
        </select>
        <select 
          value={type} 
          onChange={(e) => setType(e.target.value)}
          className="text-[10px] font-black border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-600 outline-none focus:border-blue-400 w-full"
        >
          <option value="ALL">All Categories</option>
          <option value="TICKET">Tickets</option>
          <option value="BOOKING">Bookings</option>
          <option value="SYSTEM">System</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.slice(0, 15).map(n => (
            <button
              key={n.id}
              onClick={() => {
                if (n.priority === 'HIGH') navigate(`/tickets/${n.referenceId || ''}`);
                else if (n.priority === 'MEDIUM') navigate(`/bookings?highlight=${n.referenceId || ''}`);
                else navigate('/dashboard');
              }}
              className={`w-full text-left p-4 rounded-2xl border transition-all group relative overflow-hidden ${getPriorityStyles(n.priority)}`}
            >
              <div className="flex items-start gap-3 relative z-10">
                <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 animate-pulse ${getPriorityDot(n.priority)}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">User #{n.userId}</span>
                    <span className="text-[10px] font-bold opacity-60">{formatRelativeTime(n.createdAt)}</span>
                  </div>
                  <p className="text-[11px] font-bold leading-relaxed group-hover:translate-x-1 transition-transform">
                    {n.message}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
