import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTicketById, deleteTicket } from '../services/ticketService';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTicketById(id);
      setTicket(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      setDeleting(true);
      try {
        await deleteTicket(id);
        navigate('/tickets');
      } catch (err) {
        setError(err.message || 'Failed to delete ticket');
        setDeleting(false);
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-gray-600">⏳ Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-gray-600">❌ Ticket not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ticket #{ticket.id}</h1>
          <p className="text-gray-600">Category: {ticket.category}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {/* Description Section */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
        <p className="text-gray-700 text-lg leading-relaxed">{ticket.description}</p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 font-semibold mb-2">Resource Location</p>
          <p className="text-gray-900 text-lg font-medium">{ticket.resourceId}</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 font-semibold mb-2">Category</p>
          <p className="text-gray-900 text-lg">{ticket.category}</p>
        </div>

        {ticket.building && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 font-semibold mb-2">Building</p>
            <p className="text-gray-900 text-lg">{ticket.building}</p>
          </div>
        )}

        {ticket.roomNumber && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 font-semibold mb-2">Room Number</p>
            <p className="text-gray-900 text-lg">{ticket.roomNumber}</p>
          </div>
        )}

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 font-semibold mb-2">Priority</p>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority}
          </span>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 font-semibold mb-2">Status</p>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(ticket.status)}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>

        {ticket.expectedDate && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 font-semibold mb-2">Expected Completion Date</p>
            <p className="text-gray-900 text-lg">{new Date(ticket.expectedDate).toLocaleDateString()}</p>
          </div>
        )}

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 font-semibold mb-2">Created At</p>
          <p className="text-gray-900">{new Date(ticket.createdAt).toLocaleString()}</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 font-semibold mb-2">Updated At</p>
          <p className="text-gray-900">{new Date(ticket.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Additional Notes Section */}
      {ticket.additionalNotes && (
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-bold text-blue-900 mb-3">Additional Notes</h2>
          <p className="text-blue-800">{ticket.additionalNotes}</p>
        </div>
      )}

      {/* Delete Button */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate(`/tickets/${id}/edit`)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          ✏️ Edit Ticket
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {deleting ? '⏳ Deleting...' : '🗑️ Delete Ticket'}
        </button>
      </div>
    </div>
  );
}

