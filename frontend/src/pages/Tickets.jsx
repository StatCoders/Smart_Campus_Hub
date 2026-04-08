import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { getAllTickets } from '../services/ticketService';
import { useAuth } from '../context/useAuth';

export default function Tickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllTickets();
      setTickets(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...tickets];

    // Apply status filter
    if (statusFilter !== 'All Statuses') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'All Priorities') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.category.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term)
      );
    }

    setFilteredTickets(filtered);
  }, [tickets, statusFilter, priorityFilter, searchTerm]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-green-100 text-green-700',
      'MEDIUM': 'bg-yellow-100 text-yellow-700',
      'HIGH': 'bg-orange-100 text-orange-700',
      'URGENT': 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'LOW': 'LOW',
      'MEDIUM': 'MEDIUM',
      'HIGH': 'HIGH',
      'URGENT': 'CRITICAL',
    };
    return labels[priority] || priority;
  };

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'bg-red-500',
      'IN_PROGRESS': 'bg-yellow-500',
      'RESOLVED': 'bg-green-500',
      'CLOSED': 'bg-gray-500',
      'REJECTED': 'bg-red-600',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const time = new Date(date);
    const diff = now - time;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours === 0) return 'Just now';
    if (hours === 1) return '1h ago';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return '1d ago';
    return `${days}d ago`;
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Bar */}
        <TopBar user={user} />

        {/* Content Area */}
        <main className="p-8">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Tickets</h1>
              <p className="text-gray-600">Manage maintenance and IT requests</p>
            </div>
            <button
              onClick={() => navigate('/tickets/create')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              <span className="text-xl">+</span>
              Create Ticket
            </button>
          </div>

          {/* Filters Section */}
          <div className="flex gap-4 mb-8">
            {/* Search Bar */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>All Statuses</option>
              <option>OPEN</option>
              <option>IN_PROGRESS</option>
              <option>RESOLVED</option>
              <option>CLOSED</option>
              <option>REJECTED</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>All Priorities</option>
              <option>LOW</option>
              <option>MEDIUM</option>
              <option>HIGH</option>
              <option>URGENT</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Tickets Count */}
          <p className="text-gray-600 mb-6">
            Showing {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
          </p>

          {/* Tickets Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-xl text-gray-600">Loading tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg mb-4">No tickets found</p>
              <button
                onClick={() => navigate('/tickets/create')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg"
              >
                Create Your First Ticket
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                >
                  {/* Card Header with Priority and Time */}
                  <div className="flex justify-between items-start p-5 border-b border-gray-200">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                      {getPriorityLabel(ticket.priority)}
                    </span>
                    <span className="text-xs text-gray-500">🕐 {getTimeAgo(ticket.createdAt)}</span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {ticket.category}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {ticket.description}
                    </p>

                    {/* Resource ID / Location */}
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
                      <span>📍</span>
                      <span>Resource {ticket.resourceId}</span>
                    </div>

                    {/* Footer with Status and User */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 ${getStatusColor(ticket.status)} rounded-full`}></span>
                        <span className="text-sm font-medium text-gray-700">
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        U
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
