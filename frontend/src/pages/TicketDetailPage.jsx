import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, MessageSquare, AlertCircle, CheckCircle, Send, Edit2, Trash2, Loader, Clock, User } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import { useTicketDetail } from '../hooks/useTicketDetail';
import { useComments, useAddComment, useUpdateComment, useDeleteComment } from '../hooks/useComments';
import { useUpdateTicketStatus } from '../hooks/useTicketMutations';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const { data: ticket, isLoading: ticketLoading, error: ticketError } = useTicketDetail(id);
  const { data: comments } = useComments(id);
  const addCommentMutation = useAddComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  const updateStatusMutation = useUpdateTicketStatus();

  const isAdminOrTech = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addCommentMutation.mutateAsync({ ticketId: id, content: newComment });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      await updateCommentMutation.mutateAsync({ commentId, content: editCommentText });
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteCommentMutation.mutateAsync(commentId);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ ticketId: id, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (ticketLoading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar activeTab="tickets" setActiveTab={() => {}} />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
          <TopBar user={user} />
          <main className="p-8">
            <div className="flex items-center justify-center h-96">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar activeTab="tickets" setActiveTab={() => {}} />
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
          <TopBar user={user} />
          <main className="p-8">
            <button
              onClick={() => navigate(-1)}
              className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900">Error Loading Ticket</h3>
                <p className="text-red-700 mt-1">{ticketError?.message || 'Ticket not found or access denied'}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const statusColor = {
    OPEN: 'bg-red-100 text-red-800 border-red-300',
    IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-300',
    RESOLVED: 'bg-green-100 text-green-800 border-green-300',
    CLOSED: 'bg-slate-100 text-slate-800 border-slate-300',
    REJECTED: 'bg-rose-100 text-rose-800 border-rose-300'
  };

  const priorityColor = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800'
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar activeTab="tickets" setActiveTab={() => {}} />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <TopBar user={user} />

        <main className="p-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-sky-100 via-blue-50 to-sky-50 rounded-3xl border border-sky-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-950">Ticket #{ticket.id}</h1>
                    <p className="text-slate-600 mt-1">{ticket.resourceId} - {ticket.building} / {ticket.roomNumber}</p>
                  </div>
                  <span className={`inline-block rounded-full px-4 py-2 text-xs font-bold border ${statusColor[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Created</p>
                    <p className="text-sm text-slate-900 font-semibold mt-1">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Priority</p>
                    <span className={`inline-block text-xs font-bold px-2 py-1 rounded mt-1 ${priorityColor[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Category</p>
                    <p className="text-sm text-slate-900 font-semibold mt-1">{ticket.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Last Updated</p>
                    <p className="text-sm text-slate-900 font-semibold mt-1">{new Date(ticket.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Description
                </h2>
                <p className="text-slate-700 leading-relaxed">{ticket.description}</p>
                {ticket.additionalNotes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-slate-500 font-medium mb-2">Additional Notes</p>
                    <p className="text-slate-700">{ticket.additionalNotes}</p>
                  </div>
                )}
              </div>

              {/* SLA Metrics */}
              {(ticket.minutesToFirstResponse !== null || ticket.minutesToResolution !== null) && (
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    SLA Metrics
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {ticket.minutesToFirstResponse !== null && (
                      <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                        <p className="text-xs text-slate-600 font-medium">Time to First Response</p>
                        <p className="text-2xl font-bold text-blue-600 mt-2">{ticket.minutesToFirstResponse} min</p>
                      </div>
                    )}
                    {ticket.minutesToResolution !== null && (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-xs text-slate-600 font-medium">Time to Resolution</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">{ticket.minutesToResolution} min</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Comments ({comments?.length || 0})
                </h2>

                {/* Add Comment */}
                <div className="mb-6 p-4 bg-sky-50 rounded-xl border border-sky-100">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-3 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                    rows="3"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    <Send className="h-4 w-4" />
                    {addCommentMutation.isPending ? 'Sending...' : 'Send'}
                  </button>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {!comments || comments.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No comments yet</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                              {comment.userFullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{comment.userFullName}</p>
                              <p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            {comment.userRole}
                          </span>
                        </div>

                        {editingCommentId === comment.id ? (
                          <div className="mt-3">
                            <textarea
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              rows="2"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleUpdateComment(comment.id)}
                                disabled={updateCommentMutation.isPending}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditCommentText('');
                                }}
                                className="px-3 py-1 bg-gray-300 text-slate-900 rounded text-sm hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-slate-700 text-sm">{comment.content}</p>
                            {(comment.userId === user?.id || user?.role === 'ADMIN') && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditCommentText(comment.content);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* History Timeline */}
              {ticket.history && ticket.history.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Activity History
                  </h2>
                  <div className="space-y-4">
                    {ticket.history.map((entry, idx) => (
                      <div key={idx} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">{entry.action}</p>
                          <p className="text-xs text-slate-600 mt-1">{entry.userFullName} - {new Date(entry.createdAt).toLocaleString()}</p>
                          {entry.details && <p className="text-sm text-slate-700 mt-2">{entry.details}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Assignment Card */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Assigned To
                </h3>
                {ticket.assignedTechnicianName ? (
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                    <p className="text-sm font-semibold text-slate-900">{ticket.assignedTechnicianName}</p>
                    <p className="text-xs text-slate-600 mt-1">{ticket.assignedTechnicianEmail}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 italic">Unassigned</p>
                )}
              </div>

              {/* Actions */}
              {isAdminOrTech && (
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    {ticket.status === 'OPEN' && (
                      <button
                        onClick={() => handleStatusUpdate('IN_PROGRESS')}
                        disabled={updateStatusMutation.isPending}
                        className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        {updateStatusMutation.isPending ? 'Updating...' : 'Start Work'}
                      </button>
                    )}
                    {ticket.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusUpdate('RESOLVED')}
                        disabled={updateStatusMutation.isPending}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        {updateStatusMutation.isPending ? 'Updating...' : 'Mark Resolved'}
                      </button>
                    )}
                    {ticket.status === 'RESOLVED' && (
                      <button
                        onClick={() => handleStatusUpdate('CLOSED')}
                        disabled={updateStatusMutation.isPending}
                        className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        {updateStatusMutation.isPending ? 'Updating...' : 'Close Ticket'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Details Card */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Requester</p>
                    <p className="text-slate-900 mt-1 font-medium">{ticket.userFullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Contact Email</p>
                    <p className="text-slate-900 mt-1">{ticket.contactEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Contact Phone</p>
                    <p className="text-slate-900 mt-1">{ticket.contactPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Expected Date</p>
                    <p className="text-slate-900 mt-1">
                      {ticket.expectedDate ? new Date(ticket.expectedDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
