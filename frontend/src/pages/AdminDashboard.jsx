import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, CheckCircle, Clock, TrendingUp, Ticket } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import TicketTable from '../components/TicketTable';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import { useTickets } from '../hooks/useTickets';
import { useDeleteTicket } from '../hooks/useTicketMutations';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('tickets');

  const { data: allTickets, isLoading } = useTickets();
  const deleteTicketMutation = useDeleteTicket();

  // Calculate comprehensive stats
  const stats = {
    total: allTickets?.length || 0,
    open: allTickets?.filter(t => t.status === 'OPEN').length || 0,
    inProgress: allTickets?.filter(t => t.status === 'IN_PROGRESS').length || 0,
    resolved: allTickets?.filter(t => t.status === 'RESOLVED').length || 0,
    closed: allTickets?.filter(t => t.status === 'CLOSED').length || 0,
    rejected: allTickets?.filter(t => t.status === 'REJECTED').length || 0,
    unassigned: allTickets?.filter(t => !t.assignedTechnicianId).length || 0,
    urgent: allTickets?.filter(t => t.priority === 'URGENT').length || 0,
    high: allTickets?.filter(t => t.priority === 'HIGH').length || 0
  };

  // Get unassigned tickets and urgent items
  const unassignedTickets = allTickets?.filter(t => !t.assignedTechnicianId) || [];
  const urgentTickets = allTickets?.filter(t => t.priority === 'URGENT' && t.status !== 'CLOSED') || [];

  const handleDeleteTicket = async (ticketId) => {
    try {
      await deleteTicketMutation.mutateAsync(ticketId);
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <TopBar user={user} />
        
        <main className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-950">Admin Dashboard</h1>
                <p className="text-slate-600 mt-2">System-wide ticket management and monitoring</p>
              </div>
              <button
                onClick={() => navigate('/tickets')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                <Ticket className="h-5 w-5" />
                View Tickets
              </button>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Total Tickets</p>
                  <p className="text-2xl font-bold text-slate-950 mt-2">{stats.total}</p>
                </div>
                <Ticket className="h-8 w-8 text-blue-600 bg-blue-50 rounded-lg p-1" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Open</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">{stats.open}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600 bg-red-50 rounded-lg p-1" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-medium">In Progress</p>
                  <p className="text-2xl font-bold text-amber-600 mt-2">{stats.inProgress}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-600 bg-amber-50 rounded-lg p-1" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Resolved</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">{stats.resolved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 bg-green-50 rounded-lg p-1" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Closed</p>
                  <p className="text-2xl font-bold text-slate-600 mt-2">{stats.closed}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-slate-600 bg-slate-50 rounded-lg p-1" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 font-medium">Rejected</p>
                  <p className="text-2xl font-bold text-rose-600 mt-2">{stats.rejected}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-rose-600 bg-rose-50 rounded-lg p-1" />
              </div>
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Unassigned Tickets */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
              <h3 className="font-bold text-orange-900 flex items-center gap-2 mb-4">
                <Users className="h-5 w-5" />
                Unassigned Tickets ({stats.unassigned})
              </h3>
              {unassignedTickets.length === 0 ? (
                <p className="text-sm text-orange-800">All tickets are assigned</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {unassignedTickets.slice(0, 5).map(ticket => (
                    <button
                      key={ticket.id}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="block w-full text-left text-sm bg-white p-3 rounded-lg hover:bg-orange-100 transition-colors border border-orange-100"
                    >
                      <div className="font-medium text-slate-900">#{ticket.id}: {ticket.resourceId}</div>
                      <div className="text-xs text-slate-600 mt-1">{ticket.description?.substring(0, 60)}...</div>
                    </button>
                  ))}
                  {unassignedTickets.length > 5 && (
                    <p className="text-xs text-orange-700 text-center py-2">+{unassignedTickets.length - 5} more</p>
                  )}
                </div>
              )}
            </div>

            {/* Urgent Tickets */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="font-bold text-red-900 flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5" />
                Urgent/Open ({stats.urgent + stats.high})
              </h3>
              {urgentTickets.length === 0 ? (
                <p className="text-sm text-red-800">No urgent open tickets</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {urgentTickets.slice(0, 5).map(ticket => (
                    <button
                      key={ticket.id}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="block w-full text-left text-sm bg-white p-3 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                    >
                      <div className="font-medium text-slate-900">#{ticket.id}: {ticket.category}</div>
                      <div className="text-xs text-slate-600 mt-1">{ticket.description?.substring(0, 60)}...</div>
                    </button>
                  ))}
                  {urgentTickets.length > 5 && (
                    <p className="text-xs text-red-700 text-center py-2">+{urgentTickets.length - 5} more</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Tickets
            </button>
            <button
              onClick={() => setActiveTab('open')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'open'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Management
            </button>
          </div>

          {/* Content */}
          {activeTab === 'all' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-950">System Tickets</h2>
              <TicketTable tickets={allTickets} isLoading={isLoading} onDelete={handleDeleteTicket} />
            </div>
          )}

          {activeTab === 'open' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-950">Ticket Management</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => navigate('/tickets')}
                  className="bg-white border-2 border-blue-200 rounded-2xl p-6 hover:bg-blue-50 transition-colors text-center"
                >
                  <Ticket className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <p className="font-bold text-slate-900">View All</p>
                  <p className="text-xs text-slate-600 mt-1">{stats.total} tickets</p>
                </button>
                <button
                  onClick={() => navigate('/tickets')}
                  className="bg-white border-2 border-red-200 rounded-2xl p-6 hover:bg-red-50 transition-colors text-center"
                >
                  <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
                  <p className="font-bold text-slate-900">Open</p>
                  <p className="text-xs text-slate-600 mt-1">{stats.open} tickets</p>
                </button>
                <button
                  onClick={() => navigate('/tickets')}
                  className="bg-white border-2 border-amber-200 rounded-2xl p-6 hover:bg-amber-50 transition-colors text-center"
                >
                  <Clock className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                  <p className="font-bold text-slate-900">In Progress</p>
                  <p className="text-xs text-slate-600 mt-1">{stats.inProgress} tickets</p>
                </button>
                <button
                  onClick={() => navigate('/tickets')}
                  className="bg-white border-2 border-green-200 rounded-2xl p-6 hover:bg-green-50 transition-colors text-center"
                >
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                  <p className="font-bold text-slate-900">Resolved</p>
                  <p className="text-xs text-slate-600 mt-1">{stats.resolved} tickets</p>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
