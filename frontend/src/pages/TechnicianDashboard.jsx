import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/SidebarContext';
import { getAllTickets } from '../services/ticketService';
import { BarChart3, Clock, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, X, Wrench } from 'lucide-react';
import campusLogo from '../assets/campus-logo.png';

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('maintenance');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch tickets
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAllTickets();
        setTickets(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate statistics
  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
  };

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'bg-red-100 text-red-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Technician Sidebar - Only Maintenance Tabs */}
      <TechnicianSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <TopBar user={user} />

        {/* Content Area */}
        <main className="p-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Technician Dashboard</h1>
            <p className="text-gray-600">Manage and analyze maintenance tickets</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-xl text-gray-600">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Maintenance Tab */}
              {activeTab === 'maintenance' && (
                <div className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm font-medium">Total Tickets</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.totalTickets}</p>
                        </div>
                        <AlertCircle className="w-12 h-12 text-blue-200" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm font-medium">Open Tickets</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.openTickets}</p>
                        </div>
                        <AlertCircle className="w-12 h-12 text-red-200" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm font-medium">In Progress</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
                        </div>
                        <Clock className="w-12 h-12 text-yellow-200" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm font-medium">Resolved</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.resolved}</p>
                        </div>
                        <CheckCircle className="w-12 h-12 text-green-200" />
                      </div>
                    </div>
                  </div>

                  {/* Tickets Table */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900">Recent Tickets</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Priority</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Resource</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {tickets.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="px-6 py-8 text-center text-gray-600">
                                No tickets found
                              </td>
                            </tr>
                          ) : (
                            tickets.slice(0, 10).map(ticket => (
                              <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">#{ticket.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{ticket.category}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{ticket.description}</td>
                                <td className="px-6 py-4 text-sm">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                    {ticket.priority}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                    {ticket.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">{ticket.resourceId}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Tab */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Distribution */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">Status Distribution</h2>
                      </div>
                      <div className="space-y-4">
                        {[
                          { label: 'Open', count: stats.openTickets, color: 'bg-red-500' },
                          { label: 'In Progress', count: stats.inProgress, color: 'bg-yellow-500' },
                          { label: 'Resolved', count: stats.resolved, color: 'bg-green-500' },
                        ].map(item => (
                          <div key={item.label}>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">{item.label}</span>
                              <span className="text-sm font-bold text-gray-900">{item.count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`${item.color} h-2 rounded-full`}
                                style={{ width: `${(item.count / stats.totalTickets) * 100 || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Priority Distribution */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">Priority Distribution</h2>
                      </div>
                      <div className="space-y-4">
                        {[
                          { label: 'Low', count: tickets.filter(t => t.priority === 'LOW').length },
                          { label: 'Medium', count: tickets.filter(t => t.priority === 'MEDIUM').length },
                          { label: 'High', count: tickets.filter(t => t.priority === 'HIGH').length },
                          { label: 'Urgent', count: tickets.filter(t => t.priority === 'URGENT').length },
                        ].map(item => (
                          <div key={item.label} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">{item.label}</span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-full text-sm font-bold">
                              {item.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-gray-600 text-sm mb-2">Completion Rate</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {stats.totalTickets > 0 ? Math.round((stats.resolved / stats.totalTickets) * 100) : 0}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 text-sm mb-2">Active Tickets</p>
                        <p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600 text-sm mb-2">Pending</p>
                        <p className="text-3xl font-bold text-red-600">{stats.openTickets}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// Technician-specific Sidebar with only Maintenance tabs
function TechnicianSidebar({ activeTab, setActiveTab }) {
  const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } = useSidebar();

  const menuItems = [
    { id: 'maintenance', label: 'Maintenance', Icon: Wrench },
    { id: 'analysis', label: 'Maintenance Analysis', Icon: BarChart3 },
  ];

  const handleTabChange = (itemId) => {
    setActiveTab(itemId);
    closeMobile();
  };

  return (
    <>
      <div
        onClick={closeMobile}
        className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm transition lg:hidden ${
          isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-white/10 bg-gradient-to-b from-[#0F172A] via-[#0B245A] to-[#1E40AF] text-slate-100 shadow-2xl transition-all duration-300 ease-out ${
          isCollapsed ? 'lg:w-24' : 'lg:w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} w-[18.5rem] lg:translate-x-0`}
      >
        <div className={`border-b border-white/10 p-5 ${isCollapsed ? 'lg:px-4' : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
              <img src={campusLogo} alt="Winterfall Northern University" className="h-11 w-11 rounded-2xl shadow-lg shadow-slate-950/20" />
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100/75">
                    Winterfall Northern
                  </p>
                  <h1 className="truncate text-lg font-semibold text-white">University</h1>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={closeMobile}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-slate-200 transition hover:bg-white/10 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-6">
          {menuItems.map((item) => {
            const { Icon } = item;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-lg shadow-slate-950/20'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className={`border-t border-white/10 p-4 ${isCollapsed ? 'lg:flex lg:justify-center' : ''}`}>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`hidden items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 lg:flex ${
              isCollapsed ? 'h-11 w-11 p-0' : 'w-full gap-2 px-4 py-3'
            }`}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
