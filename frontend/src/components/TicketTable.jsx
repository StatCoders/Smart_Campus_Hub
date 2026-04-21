import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, ChevronDown, ArrowUpDown, Loader, Users } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import AssignTechnicianModal from './AssignTechnicianModal';

const SortableHeader = ({ label, sortKey, sortConfig, handleSort }) => (
  <button
    onClick={() => handleSort(sortKey)}
    className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
  >
    {label}
    {sortConfig.key === sortKey && (
      <ArrowUpDown className={`h-3 w-3 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
    )}
  </button>
);

export default function TicketTable({ tickets, isLoading, onDelete }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [assignModalState, setAssignModalState] = useState({
    isOpen: false,
    ticketId: null,
    ticketNumber: null,
    currentAssignedTo: null,
  });

  const statusColor = {
    OPEN: 'bg-red-100 text-red-800',
    IN_PROGRESS: 'bg-amber-100 text-amber-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-slate-100 text-slate-800',
    REJECTED: 'bg-rose-100 text-rose-800'
  };

  const priorityColor = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800'
  };

  const isAdminOrTech = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';

  // Filter tickets
  let filteredTickets = tickets?.filter(ticket => {
    if (filterStatus && ticket.status !== filterStatus) return false;
    if (filterPriority && ticket.priority !== filterPriority) return false;
    return true;
  }) || [];

  // Sort tickets
  filteredTickets.sort((a, b) => {
    const key = sortConfig.key;
    let aValue = a[key];
    let bValue = b[key];

    // Handle date strings
    if (key === 'createdAt' || key === 'updatedAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    // Handle string comparisons
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleOpenAssignModal = (ticketId, ticketNumber, assignedTechnicianName) => {
    setAssignModalState({
      isOpen: true,
      ticketId,
      ticketNumber,
      currentAssignedTo: assignedTechnicianName,
    });
  };

  const handleCloseAssignModal = () => {
    setAssignModalState({
      isOpen: false,
      ticketId: null,
      ticketNumber: null,
      currentAssignedTo: null,
    });
  };

  const handleAssignSuccess = () => {
    handleCloseAssignModal();
    // React Query will auto-invalidate and refetch tickets
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-3xl">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-sky-50 to-blue-50 flex gap-4">
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-600 mb-2 block">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-bold text-slate-600 mb-2 block">Filter by Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
        <div className="flex items-end">
          <p className="text-sm text-slate-600 font-medium">
            {filteredTickets.length} of {tickets?.length || 0} tickets
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left">
                <SortableHeader label="Ticket ID" sortKey="id" sortConfig={sortConfig} handleSort={handleSort} />
              </th>
              <th className="px-6 py-4 text-left">
                <SortableHeader label="Resource Location" sortKey="resourceId" sortConfig={sortConfig} handleSort={handleSort} />
              </th>
              <th className="px-6 py-4 text-left">
                <SortableHeader label="Category" sortKey="category" sortConfig={sortConfig} handleSort={handleSort} />
              </th>
              <th className="px-6 py-4 text-left">
                <SortableHeader label="Priority" sortKey="priority" sortConfig={sortConfig} handleSort={handleSort} />
              </th>
              <th className="px-6 py-4 text-left">
                <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} handleSort={handleSort} />
              </th>
              <th className="px-6 py-4 text-left">Assigned To</th>
              <th className="px-6 py-4 text-left">
                <SortableHeader label="Created" sortKey="createdAt" sortConfig={sortConfig} handleSort={handleSort} />
              </th>
              <th className="px-6 py-4 text-left">
                <SortableHeader label="Updated" sortKey="updatedAt" sortConfig={sortConfig} handleSort={handleSort} />
              </th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center text-slate-500">
                  No tickets found
                </td>
              </tr>
            ) : (
              filteredTickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      #{ticket.id}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{ticket.resourceId}</p>
                      <p className="text-xs text-slate-500">{ticket.building} / {ticket.roomNumber}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-700 font-medium">{ticket.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${priorityColor[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${statusColor[ticket.status]}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-700 font-medium">
                      {ticket.assignedTechnicianName || <span className="text-gray-400">Unassigned</span>}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600">{new Date(ticket.updatedAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View ticket"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleOpenAssignModal(ticket.id, ticket.id, ticket.assignedTechnicianName)}
                          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                          title="Assign technician"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                      )}
                      {isAdminOrTech && (
                        <>
                          <button
                            onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit ticket"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this ticket?')) {
                                onDelete?.(ticket.id);
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete ticket"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {filteredTickets.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing <span className="font-bold">{filteredTickets.length}</span> tickets
          </p>
          <div className="flex gap-4 text-xs text-slate-600">
            <span>📋 <strong>{filteredTickets.filter(t => t.status === 'OPEN').length}</strong> Open</span>
            <span>⚙️ <strong>{filteredTickets.filter(t => t.status === 'IN_PROGRESS').length}</strong> In Progress</span>
            <span>✅ <strong>{filteredTickets.filter(t => t.status === 'RESOLVED').length}</strong> Resolved</span>
            <span>🔒 <strong>{filteredTickets.filter(t => t.status === 'CLOSED').length}</strong> Closed</span>
          </div>
        </div>
      )}

      {/* Assign Technician Modal */}
      <AssignTechnicianModal
        isOpen={assignModalState.isOpen}
        ticketId={assignModalState.ticketId}
        ticketNumber={assignModalState.ticketNumber}
        currentAssignedTo={assignModalState.currentAssignedTo}
        onClose={handleCloseAssignModal}
        onSuccess={handleAssignSuccess}
      />
    </div>
  );
}
