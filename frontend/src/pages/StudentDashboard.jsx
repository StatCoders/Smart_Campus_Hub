import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Ticket, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import TicketTable from '../components/TicketTable';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import { useTickets } from '../hooks/useTickets';
import { useDeleteTicket } from '../hooks/useTicketMutations';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('tickets');

  const { data: allTickets, isLoading } = useTickets();
  const deleteTicketMutation = useDeleteTicket();

  // Filter tickets to show only student's own tickets
  const myTickets = allTickets?.filter(ticket => ticket.userId === user?.id) || [];

  // Calculate stats
  const stats = {
    total: myTickets.length,
    open: myTickets.filter(t => t.status === 'OPEN').length,
    inProgress: myTickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: myTickets.filter(t => t.status === 'RESOLVED').length,
    closed: myTickets.filter(t => t.status === 'CLOSED').length
  };

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
                <h1 className="text-4xl font-bold text-slate-950">My Dashboard</h1>
                <p className="text-slate-600 mt-2">Track and manage your maintenance tickets</p>
              </div>
              <button
                onClick={() => navigate('/tickets/create')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                <Plus className="h-5 w-5" />
                Create New Ticket
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Tickets</p>
                  <p className="text-3xl font-bold text-slate-950 mt-2">{stats.total}</p>
                </div>
                <Ticket className="h-10 w-10 text-blue-600 bg-blue-50 rounded-lg p-2" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Open</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{stats.open}</p>
                </div>
                <AlertCircle className="h-10 w-10 text-red-600 bg-red-50 rounded-lg p-2" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">In Progress</p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">{stats.inProgress}</p>
                </div>
                <Clock className="h-10 w-10 text-amber-600 bg-amber-50 rounded-lg p-2" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Resolved</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.resolved}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600 bg-green-50 rounded-lg p-2" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Closed</p>
                  <p className="text-3xl font-bold text-slate-600 mt-2">{stats.closed}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-slate-600 bg-slate-50 rounded-lg p-2" />
              </div>
            </div>
          </div>

          {/* Tickets Table */}
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-950">My Tickets</h2>
              <p className="text-slate-600 text-sm mt-1">View and manage all your submitted tickets</p>
            </div>
            <TicketTable tickets={myTickets} isLoading={isLoading} onDelete={handleDeleteTicket} />
          </div>
        </main>
      </div>
    </div>
  );
}
