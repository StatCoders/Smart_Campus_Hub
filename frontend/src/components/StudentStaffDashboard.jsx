import React, { useState, useCallback, useEffect } from 'react';
import { Search, AlertCircle, LogOut, Bell, ChevronRight, Calendar, Package } from 'lucide-react';
import { createTicket, getAllTickets } from '../services/ticketService';
import { useAuth } from '../context/useAuth';
import Toast from './Toast';
import { useNavigate } from 'react-router-dom';
import campusLogo from '../assets/campus-logo.png';
import NotificationDropdown from './NotificationDropdown';

const SYSTEM_NAME = 'Winterfall Northern University';
const CAMPUS_NAME = 'Winterfall Northern University';

const RESOURCES = [
  'HVAC System',
  'Electrical',
  'Plumbing',
  'Furniture',
  'IT Equipment',
  'Lighting',
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'LOW' },
  { value: 'MEDIUM', label: 'MEDIUM' },
  { value: 'HIGH', label: 'HIGH' },
  { value: 'URGENT', label: 'CRITICAL' },
];

const PRIORITY_COLORS = {
  LOW: 'text-green-700 bg-green-50',
  MEDIUM: 'text-yellow-700 bg-yellow-50',
  HIGH: 'text-red-700 bg-red-50',
  URGENT: 'text-red-900 bg-red-100',
};

const STATUS_BADGE = {
  OPEN: { bg: 'bg-slate-100', text: 'text-slate-800' },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-800' },
  RESOLVED: { bg: 'bg-green-100', text: 'text-green-800' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800' },
};

export default function StudentStaffDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tickets');
  const [showNotifications, setShowNotifications] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({
    title: '',
    description: '',
    resourceType: '',
    priority: 'MEDIUM',
    location: '',
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllTickets();
      // Handle both direct array response and wrapped response
      const ticketsData = Array.isArray(response) ? response : (response?.data || []);
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setToast({ type: 'error', message: 'Failed to fetch tickets' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setToast({ type: 'error', message: 'Please enter a title' });
      return;
    }
    
    try {
      await createTicket(form);
      setToast({ type: 'success', message: 'Ticket created successfully!' });
      setForm({ title: '', description: '', resourceType: '', priority: 'MEDIUM', location: '' });
      fetchTickets();
    } catch {
      setToast({ type: 'error', message: 'Failed to create ticket' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={campusLogo} alt="Campus Logo" className="h-12 w-12" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{SYSTEM_NAME}</h1>
                <p className="text-slate-500 text-sm">{CAMPUS_NAME}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationDropdown
                userId={user?.id}
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onToggle={() => setShowNotifications((current) => !current)}
              />
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.email || 'User'}</p>
                <p className="text-xs text-slate-500">Student</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 px-4 py-4 font-medium text-center transition flex items-center justify-center gap-2 ${
                activeTab === 'bookings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Bookings
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex-1 px-4 py-4 font-medium text-center transition flex items-center justify-center gap-2 ${
                activeTab === 'tickets'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Tickets
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex-1 px-4 py-4 font-medium text-center transition flex items-center justify-center gap-2 ${
                activeTab === 'resources'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              Resources
            </button>
          </div>
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Facility Bookings</h3>
              <p className="text-slate-500 text-center">
                Book study rooms, labs, and other campus facilities here. Coming soon!
              </p>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            {/* Create Ticket Form */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Ticket</h2>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="title"
                    placeholder="Ticket Title"
                    value={form.title}
                    onChange={handleFormChange}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <select
                    name="resourceType"
                    value={form.resourceType}
                    onChange={handleFormChange}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Resource Type</option>
                    {RESOURCES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="location"
                    placeholder="Location"
                    value={form.location}
                    onChange={handleFormChange}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleFormChange}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  name="description"
                  placeholder="Description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Create Ticket
                </button>
              </form>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priorities</option>
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading tickets...</div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No tickets found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Resource</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Priority</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredTickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-sm text-slate-700 font-medium">{ticket.id}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{ticket.title}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{ticket.resourceType || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.LOW}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_BADGE[ticket.status]?.bg} ${STATUS_BADGE[ticket.status]?.text}`}>
                              {ticket.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Campus Resources</h3>
              <p className="text-slate-500 text-center">
                Browse and manage campus resources, equipment, and facilities. Coming soon!
              </p>
            </div>
          </div>
        )}
      </main>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
