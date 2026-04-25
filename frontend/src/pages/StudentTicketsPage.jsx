import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit2, Trash2, Bell, User, LogOut, X, MoreHorizontal, Loader } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import campusLogo from '../assets/campus-logo.png';
import { getAllTickets, deleteTicket, getTicketById } from '../services/ticketService';
import EditTicket from '../components/EditTicket';
import TicketAttachmentGallery from '../components/tickets/TicketAttachmentGallery';
import NotificationDropdown from '../components/NotificationDropdown';

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{value || 'N/A'}</p>
    </div>
  );
}

export default function StudentTicketsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [detailTicketId, setDetailTicketId] = useState(null);
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [highlightId, setHighlightId] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  // Fetch tickets - backend returns user's tickets based on role
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await getAllTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Handle deep linking/highlighting
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlight = params.get('highlight');
    if (highlight) {
      setHighlightId(highlight);
      setStatusFilter('All');
    }
  }, [location.search]);

  const handleDeleteTicket = async (ticketId) => {
    try {
      await deleteTicket(ticketId);
      setTickets(tickets.filter(t => t.id !== ticketId));
      setShowDeleteConfirm(null);
    } catch {
      setError('Failed to delete ticket');
    }
  };

  const handleOpenTicketDetails = async (ticketId) => {
    setDetailTicketId(ticketId);
    setDetailTicket(null);
    setDetailError('');
    setDetailLoading(true);

    try {
      const ticket = await getTicketById(ticketId);
      setDetailTicket(ticket);
    } catch (err) {
      setDetailError(err.message || 'Failed to load ticket details');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setDetailTicketId(null);
    setDetailTicket(null);
    setDetailError('');
  };

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter === 'All') return true;
    return ticket.status === statusFilter;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'bg-blue-100 text-blue-800',
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canEditTicket = (ticket) => {
    const createdAt = new Date(ticket.createdAt).getTime();
    return Date.now() - createdAt <= 20 * 60 * 1000;
  };

  // ─────────────────────────────────────────────────────────────
  // TicketCard Sub-component for Highlighting & Scrolling
  // ─────────────────────────────────────────────────────────────
  function TicketCard({
    ticket,
    isHighlighted,
    getStatusColor,
    getPriorityColor,
    formatDate,
    canEditTicket,
    setEditingTicketId,
    setShowDeleteConfirm,
    handleOpenTicketDetails
  }) {
    const cardRef = useRef(null);

    useEffect(() => {
      if (isHighlighted && cardRef.current) {
        setTimeout(() => {
          cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      }
    }, [isHighlighted]);

    const isEditable = canEditTicket(ticket);

    return (
      <div
        ref={cardRef}
        className={`bg-white rounded-lg border overflow-hidden transition-all duration-500 flex flex-col ${
          isHighlighted
            ? 'border-yellow-400 ring-2 ring-yellow-400 ring-offset-2 scale-[1.02] shadow-xl z-10'
            : 'border-gray-200 hover:shadow-lg shadow-sm'
        }`}
        style={isHighlighted ? { backgroundColor: '#fffbeb' } : {}}
      >
        {/* Card Header - Gradient Background */}
        <div className={`px-6 py-4 transition-colors ${
          isHighlighted ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-blue-600 to-blue-700'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{ticket.category}</h3>
              <p className="text-blue-100 text-sm mt-1">{ticket.resourceId}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleOpenTicketDetails(ticket.id)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                title="View more ticket details"
                aria-label={`View details for ticket ${ticket.id}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                {ticket.status === 'IN_PROGRESS' ? 'In Progress' : ticket.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6 flex-1 space-y-4">
          {/* Description */}
          <div>
            <p className="text-sm text-gray-600 line-clamp-3">{ticket.description}</p>
            {ticket.status === 'REJECTED' && ticket.rejectionReason ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Rejection Reason</p>
                <p className="mt-2 text-sm text-rose-900">{ticket.rejectionReason}</p>
              </div>
            ) : null}
          </div>

          {/* Details Grid */}
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Building:</span>
              <span className="font-medium text-gray-900">{ticket.building || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Room:</span>
              <span className="font-medium text-gray-900">{ticket.roomNumber || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Raised On:</span>
              <span className="font-medium text-gray-900">{formatDate(ticket.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Card Footer - Action Buttons */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => isEditable && setEditingTicketId(ticket.id)}
            disabled={!isEditable}
            title={!isEditable ? "You can't edit ticket now and it's timed out" : 'Edit ticket'}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition font-medium text-sm ${isEditable
                ? 'text-blue-600 hover:bg-blue-50'
                : 'text-slate-400 cursor-not-allowed bg-slate-100'
              }`}
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(ticket.id)}
            className="flex-1 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition font-medium text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/98 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <img src={campusLogo} alt="Winterfall Northern University" className="h-12 w-12" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Winterfall Northern University</h1>
                <p className="text-xs text-blue-600 font-medium">My Tickets</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => handleNavigate('/student-resources')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Resources
              </button>
              <button
                onClick={() => handleNavigate('/student-bookings')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Bookings
              </button>
              <button
                onClick={() => handleNavigate('/home')}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                Home
              </button>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3 relative">
              <NotificationDropdown
                userId={user?.id}
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onToggle={() => {
                  setShowNotifications((c) => !c);
                  setIsMenuOpen(false);
                }}
              />

              {/* Profile Button */}
              <button
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-lg transition"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName || ''}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {user?.role || 'USER'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition"
                    >
                      <User className="w-4 h-4" />
                      Your Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Tickets</h2>
            <p className="text-gray-600 mt-1">Track and manage your maintenance requests</p>
          </div>
          <button
            onClick={() => navigate('/tickets/create')}
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Report Issue
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-3 flex-wrap">
          {['All', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300'
                }`}
            >
              {status === 'IN_PROGRESS' ? 'In Progress' : status}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">No tickets found</p>
            <button
              onClick={() => navigate('/tickets/create')}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Report Your First Issue
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                isHighlighted={String(ticket.id) === String(highlightId)}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                canEditTicket={canEditTicket}
                setEditingTicketId={setEditingTicketId}
                setShowDeleteConfirm={setShowDeleteConfirm}
                handleOpenTicketDetails={handleOpenTicketDetails}
              />
            ))}
          </div>
        )}
      </main>

      {/* Edit Ticket Modal - Modern Clean Design */}
      {editingTicketId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header - Clean and Simple */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">Edit Ticket</h2>
                <p className="text-blue-100 text-sm mt-2">Make changes to your issue report</p>
              </div>
              <button
                onClick={() => setEditingTicketId(null)}
                className="p-2 hover:bg-white/20 rounded-xl transition text-white hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8">
              <EditTicket
                ticketId={editingTicketId}
                onSuccess={() => {
                  setEditingTicketId(null);
                  fetchTickets();
                }}
                onCancel={() => setEditingTicketId(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {detailTicketId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white sm:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">Ticket Details</p>
                <h3 className="mt-2 text-2xl font-bold">
                  Ticket #{detailTicket?.id || detailTicketId}
                </h3>
                {detailTicket ? (
                  <p className="mt-1 text-sm text-blue-100">
                    {detailTicket.category} - {detailTicket.resourceId}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closeDetailsModal}
                className="rounded-full p-2 text-white transition hover:bg-white/15"
                aria-label="Close ticket details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 sm:p-8">
              {detailLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader className="h-7 w-7 animate-spin text-blue-600" />
                  <span className="ml-3 text-sm font-medium text-slate-600">Loading ticket details...</span>
                </div>
              ) : detailError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {detailError}
                </div>
              ) : detailTicket ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailItem label="Status" value={String(detailTicket.status || '').replace(/_/g, ' ')} />
                    <DetailItem label="Priority" value={detailTicket.priority} />
                    <DetailItem label="Created" value={formatDate(detailTicket.createdAt)} />
                    <DetailItem
                      label="Expected Date"
                      value={detailTicket.expectedDate ? formatDate(detailTicket.expectedDate) : 'Not set'}
                    />
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h4 className="text-lg font-bold text-slate-950">Issue Summary</h4>
                    <p className="mt-3 leading-7 text-slate-700">{detailTicket.description}</p>
                    {detailTicket.additionalNotes ? (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Additional Notes</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{detailTicket.additionalNotes}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailItem label="Resource" value={detailTicket.resourceId} />
                    <DetailItem label="Building" value={detailTicket.building} />
                    <DetailItem label="Room" value={detailTicket.roomNumber} />
                    <DetailItem label="Requester" value={detailTicket.userFullName} />
                    <DetailItem label="Contact Email" value={detailTicket.contactEmail} />
                    <DetailItem label="Contact Phone" value={detailTicket.contactPhone} />
                    <DetailItem label="Technician" value={detailTicket.assignedTechnicianName || 'Unassigned'} />
                    <DetailItem label="Updated" value={formatDate(detailTicket.updatedAt)} />
                    <DetailItem label="Category" value={detailTicket.category} />
                  </div>

                  {detailTicket.rejectionReason ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Rejection Reason</p>
                      <p className="mt-2 text-sm leading-6">{detailTicket.rejectionReason}</p>
                    </div>
                  ) : null}

                  {detailTicket.resolutionNotes ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Resolution Notes</p>
                      <p className="mt-2 text-sm leading-6">{detailTicket.resolutionNotes}</p>
                    </div>
                  ) : null}

                  {detailTicket.adminFeedback ? (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-slate-900">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Admin Feedback</p>
                      <p className="mt-2 text-sm leading-6">{detailTicket.adminFeedback}</p>
                      {detailTicket.adminRating ? (
                        <p className="mt-2 text-xs font-bold text-amber-700">Rating: {detailTicket.adminRating}/5</p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h4 className="text-lg font-bold text-slate-950">Attached Images</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Images uploaded with your maintenance request.
                    </p>
                    <div className="mt-5">
                      <TicketAttachmentGallery
                        attachments={detailTicket.attachments || []}
                        emptyMessage="No images were attached to this ticket."
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Delete Ticket</h3>
            <p className="text-gray-600 text-center mb-8">Are you sure you want to delete this ticket? This action cannot be undone.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTicket(showDeleteConfirm)}
                className="flex-1 px-6 py-3 text-white bg-red-600 rounded-xl hover:bg-red-700 transition font-semibold shadow-lg shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
