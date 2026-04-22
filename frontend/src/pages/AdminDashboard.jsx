import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Ticket,
  Activity,
  ShieldCheck,
  Zap,
  PlusCircle,
  LayoutDashboard,
  Settings,
  Bell,
  ArrowRight,
  MoreVertical,
  Wrench,
  Search,
  ChevronRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import TicketTable from '../components/TicketTable';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import { useTickets } from '../hooks/useTickets';


export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: allTickets } = useTickets();

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const t = allTickets || [];
    return {
      total: t.length,
      open: t.filter(ticket => ticket.status === 'OPEN').length,
      inProgress: t.filter(ticket => ticket.status === 'IN_PROGRESS').length,
      resolved: t.filter(ticket => ticket.status === 'RESOLVED').length,
      closed: t.filter(ticket => ticket.status === 'CLOSED').length,
      rejected: t.filter(ticket => ticket.status === 'REJECTED').length,
      unassigned: t.filter(ticket => !ticket.assignedTechnicianId).length,
      urgent: t.filter(ticket => ticket.priority === 'URGENT').length,
      high: t.filter(ticket => ticket.priority === 'HIGH').length,
      mine: t.filter(ticket => ticket.createdBy === user?.id).length,
      assignedToMe: t.filter(ticket => ticket.assignedTechnicianId === user?.id).length,
      resolvedOrClosed: t.filter(ticket => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length
    };
  }, [allTickets, user?.id]);

  const chartData = [
    { name: 'Open', value: stats.open, color: '#EF4444' },
    { name: 'Closed', value: stats.closed, color: '#64748B' },
    { name: 'Rejected', value: stats.rejected, color: '#F43F5E' },
    { name: 'In Progress', value: stats.inProgress, color: '#F59E0B' },
  ].filter(d => d.value > 0);



  const tabs = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'mine', label: 'My Tickets', count: stats.mine },
    { id: 'assigned', label: 'Assigned to Me', count: stats.assignedToMe },
    { id: 'all', label: 'All Tickets', count: stats.total },
    { id: 'resolved', label: 'Resolved / Closed', count: stats.resolvedOrClosed },
  ];

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-sans antialiased text-slate-900">
      <Sidebar activeTab="dashboard" setActiveTab={() => { }} />

      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <TopBar user={user} />

        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Premium Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] rounded-[2.5rem] p-8 lg:p-12 mb-8 shadow-2xl shadow-slate-900/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-6 transition-all hover:bg-white/20">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold tracking-wider text-blue-100 uppercase">Smart Campus Operations Hub</span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4 tracking-tight">
                  Smart Campus Dashboard - <span className="text-blue-400">Maintenance Hub</span>
                </h1>

                <p className="text-lg text-slate-300 mb-8 max-w-xl leading-relaxed">
                  A polished command center for monitoring campus incidents, maintenance throughput, and service quality in one premium workspace.
                </p>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/90 text-sm font-medium">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    Welcome back, {user?.name || 'Admin'}
                  </div>
                  <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/90 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4 text-blue-400" />
                    Verified: Yes
                  </div>
                  <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/90 text-sm font-medium uppercase tracking-widest">
                    Role: {user?.role}
                  </div>
                </div>
              </div>

              {/* Workspace Snapshot Card */}
              <div className="lg:w-80 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Workspace Snapshot</h3>
                  <Wrench className="h-5 w-5 text-slate-400" />
                </div>

                <h2 className="text-2xl font-bold mb-6">Operations at a glance</h2>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-default">
                    <p className="text-xs font-medium text-slate-400 mb-1 group-hover:text-blue-300 transition-colors">Queue Coverage</p>
                    <p className="text-lg font-bold">{stats.total} live tickets</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-default">
                    <p className="text-xs font-medium text-slate-400 mb-1 group-hover:text-red-300 transition-colors">Priority Load</p>
                    <p className="text-lg font-bold">{stats.urgent + stats.high} elevated</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-default">
                    <p className="text-xs font-medium text-slate-400 mb-1 group-hover:text-purple-300 transition-colors">Role Scope</p>
                    <p className="text-lg font-bold">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Total Tickets ', value: stats.total, icon: Ticket, color: 'blue', trend: '+12%' },
              { label: 'Open', value: stats.open, icon: AlertCircle, color: 'red', trend: '5 active' },
              { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'amber', trend: '3 updated' },
              { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'green', trend: '+8% today' },
            ].map((stat, idx) => (
              <div key={idx} className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-${stat.color}-50 text-${stat.color}-600`}>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-tight">{stat.label}</p>
                <h4 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</h4>
              </div>
            ))}
          </div>

          {/* Pill Tabs Navigation */}
          <div className="flex flex-wrap gap-3 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Tickets Section */}
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Recent Tickets</h3>
                  <h2 className="text-2xl font-extrabold text-slate-900">Latest maintenance activity</h2>
                  <p className="text-sm text-slate-500 mt-1">Freshly updated requests across the live maintenance queue.</p>
                </div>
                <button
                  onClick={() => navigate('/tickets')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-blue-100 text-blue-600 text-xs font-bold hover:bg-blue-50 transition-all"
                >
                  Open Full Queue
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-left border-b border-slate-50">
                      <th className="pb-4">Ticket</th>
                      <th className="pb-4">Location</th>
                      <th className="pb-4">Created</th>
                      <th className="pb-4">Priority</th>
                      <th className="pb-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allTickets?.slice(0, 5).map(ticket => (
                      <tr key={ticket.id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="py-5 pr-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">#{ticket.id} - {ticket.category}</span>
                            <span className="text-xs text-slate-500 mt-1 truncate max-w-[150px]">{ticket.description}</span>
                          </div>
                        </td>
                        <td className="py-5 pr-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">{ticket.resourceId}</span>
                            <span className="text-[10px] text-slate-400 mt-1 uppercase">{ticket.building} / {ticket.roomNumber}</span>
                          </div>
                        </td>
                        <td className="py-5 pr-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-600">{new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span className="text-[10px] text-blue-500 font-bold uppercase mt-1">Just Now</span>
                          </div>
                        </td>
                        <td className="py-5 pr-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${ticket.priority === 'URGENT' ? 'bg-red-50 text-red-600 border-red-100' :
                            ticket.priority === 'HIGH' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                              'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="py-5">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${ticket.status === 'OPEN' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-green-50 text-green-600 border-green-100'
                            }`}>
                            {ticket.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Queue Composition Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-2">Status Distribution</h3>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Queue composition</h2>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">A quick operational read on where the maintenance pipeline currently sits.</p>

              <div className="h-64 relative mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Stats */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-3xl font-extrabold text-slate-900">{stats.total}</span>
                  <span className="text-[10px] font-medium text-slate-500">active records</span>
                </div>
              </div>

              <div className="space-y-4">
                {chartData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-bold text-slate-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900 block">{item.value}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {Math.round((item.value / stats.total) * 100) || 0}% of volume
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
