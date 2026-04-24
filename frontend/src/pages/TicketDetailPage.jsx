import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  FileText,
  Loader,
  MessageSquare,
  ShieldCheck,
  UploadCloud,
  User,
  Users,
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import TechnicianMaintenanceSidebar from '../components/TechnicianMaintenanceSidebar';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import { useTicketDetail } from '../hooks/useTicketDetail';
import { useAddAdminFeedback, useUpdateTicketStatus } from '../hooks/useTicketMutations';
import { useSLATimer, formatMinutesToTime, getSLAStatusColor } from '../hooks/useSLATimer';
import TicketCommentThread from '../components/tickets/TicketCommentThread';
import TicketTimeline from '../components/tickets/TicketTimeline';
import TicketAttachmentGallery from '../components/tickets/TicketAttachmentGallery';
import AssignTechnicianModal from '../components/AssignTechnicianModal';
import BeforeAfterComparison from '../components/tickets/BeforeAfterComparison';
import FeedbackModal from '../components/tickets/FeedbackModal';
import RejectModal from '../components/tickets/RejectModal';
import { uploadMultipleAttachments } from '../services/fileUploadService';

const formatStatusLabel = (status) => String(status || '').replace(/_/g, ' ');

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadingAfterImages, setUploadingAfterImages] = useState(false);

  const { data: ticket, isLoading: ticketLoading, error: ticketError, refetch: refetchTicket } = useTicketDetail(id);
  const updateStatusMutation = useUpdateTicketStatus();
  const addFeedbackMutation = useAddAdminFeedback();
  const slaMetrics = useSLATimer(ticket);

  const userRole = String(user?.role || '').toUpperCase();
  const isAdmin = userRole === 'ADMIN';
  const isTechnician = userRole === 'TECHNICIAN';
  const isStudent = userRole === 'USER';
  const isAdminOrTech = isAdmin || isTechnician;
  const isAssignedToCurrentTechnician =
    isTechnician &&
    (Number(ticket?.assignedTechnicianId) === Number(user?.id) ||
      (ticket?.assignedTechnicianEmail &&
        user?.email &&
        ticket.assignedTechnicianEmail.toLowerCase() === user.email.toLowerCase()));

  useEffect(() => {
    setResolutionNotes(ticket?.resolutionNotes || '');
  }, [ticket?.resolutionNotes]);

  const handleBack = () => {
    if (isTechnician) {
      navigate('/technician-dashboard');
      return;
    }
    if (isStudent) {
      navigate('/student-tickets');
      return;
    }
    navigate('/tickets');
  };

  const handleStatusUpdate = async (newStatus, payload = {}) => {
    try {
      await updateStatusMutation.mutateAsync({ ticketId: id, status: newStatus, ...payload });
      if (newStatus === 'RESOLVED') {
        setResolutionNotes(payload.notes || '');
      }
      refetchTicket();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAssignSuccess = () => {
    setAssignModalOpen(false);
    refetchTicket();
  };

  const handleReject = async (reason) => {
    await handleStatusUpdate('REJECTED', { rejectionReason: reason });
    setRejectModalOpen(false);
  };

  const handleFeedbackSubmit = async ({ feedback, rating }) => {
    try {
      await addFeedbackMutation.mutateAsync({ ticketId: id, feedback, rating });
      setFeedbackModalOpen(false);
      refetchTicket();
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const handleAfterUpload = async (files) => {
    setUploadError('');
    setUploadSuccess('');
    setUploadingAfterImages(true);

    try {
      await uploadMultipleAttachments(files, ticket.id, 'AFTER');
      setUploadSuccess('Completion images uploaded for admin review.');
      refetchTicket();
    } catch (error) {
      setUploadError(error.message || 'Failed to upload completion images');
    } finally {
      setUploadingAfterImages(false);
    }
  };

  if (ticketLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {isTechnician ? (
          <TechnicianMaintenanceSidebar activeTab="maintenance" setActiveTab={() => {}} />
        ) : (
          <Sidebar activeTab="tickets" setActiveTab={() => {}} />
        )}
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
          <TopBar user={user} />
          <main className="p-8">
            <div className="flex h-96 items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {isTechnician ? (
          <TechnicianMaintenanceSidebar activeTab="maintenance" setActiveTab={() => {}} />
        ) : (
          <Sidebar activeTab="tickets" setActiveTab={() => {}} />
        )}
        <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
          <TopBar user={user} />
          <main className="p-8">
            <button onClick={handleBack} className="mb-6 flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-6">
              <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
              <div>
                <h3 className="font-bold text-red-900">Error Loading Ticket</h3>
                <p className="mt-1 text-red-700">{ticketError?.message || 'Ticket not found or access denied'}</p>
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
    REJECTED: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  const priorityColor = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
  };

  const workflowSteps = [
    {
      key: 'OPEN',
      title: 'Ticket Submitted',
      description: ticket.assignedTechnicianName
        ? 'A technician has been assigned and the ticket is now in active maintenance flow.'
        : 'Waiting for an admin to assign this request to a technician.',
    },
    {
      key: 'IN_PROGRESS',
      title: 'Technician Working',
      description: ticket.assignedTechnicianName
        ? `${ticket.assignedTechnicianName} owns the current maintenance work.`
        : 'A technician should be assigned before work begins.',
    },
    {
      key: 'RESOLVED',
      title: 'Work Completed',
      description: 'The technician has finished the task and marked the issue resolved.',
    },
    {
      key: 'CLOSED',
      title: 'Ticket Closed',
      description: 'The maintenance and incident workflow is fully complete.',
    },
  ];

  const currentWorkflowIndex = {
    OPEN: 0,
    IN_PROGRESS: 1,
    RESOLVED: 2,
    CLOSED: 3,
    REJECTED: 0,
  }[ticket.status] ?? 0;

  let nextStepCopy = 'Review the latest ticket updates.';

  if (ticket.status === 'REJECTED') {
    nextStepCopy = 'This ticket has been rejected and is outside the normal maintenance workflow.';
  } else if (isAdmin) {
    nextStepCopy = ticket.assignedTechnicianName
      ? 'Review technician progress, verify before/after evidence, or record final feedback.'
      : 'Assign a technician to move this ticket into active maintenance handling.';
  } else if (isAssignedToCurrentTechnician) {
    if (ticket.status === 'OPEN') {
      nextStepCopy = 'Start work to acknowledge the assignment and begin handling the issue.';
    } else if (ticket.status === 'IN_PROGRESS') {
      nextStepCopy = 'Complete the repair, add resolution notes, and upload completion images for admin review.';
    } else if (ticket.status === 'RESOLVED') {
      nextStepCopy = 'Wait for admin review or final closure after the completed work is verified.';
    } else if (ticket.status === 'CLOSED') {
      nextStepCopy = 'No further technician action is required on this ticket.';
    }
  } else if (isTechnician) {
    nextStepCopy = 'This ticket is not assigned to your account, so technician workflow actions are unavailable.';
  }

  const canGiveFeedback = isAdmin && ['RESOLVED', 'CLOSED'].includes(ticket.status);
  const canReject = (isAdmin || isAssignedToCurrentTechnician) && ticket.status !== 'CLOSED';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isTechnician ? (
        <TechnicianMaintenanceSidebar activeTab="maintenance" setActiveTab={() => {}} />
      ) : (
        <Sidebar activeTab="tickets" setActiveTab={() => {}} />
      )}

      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <TopBar user={user} />

        <main className="p-8">
          <button onClick={handleBack} className="mb-6 flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-100 via-blue-50 to-sky-50 p-6 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-950">Ticket #{ticket.id}</h1>
                      <p className="mt-1 text-slate-600">
                        {ticket.resourceId} - {ticket.building} / {ticket.roomNumber}
                      </p>
                    </div>
                    <span className={`inline-block rounded-full border px-4 py-2 text-xs font-bold ${statusColor[ticket.status]}`}>
                      {formatStatusLabel(ticket.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Created</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Priority</p>
                      <span className={`mt-1 inline-block rounded px-2 py-1 text-xs font-bold ${priorityColor[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Category</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{ticket.category}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Last Updated</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{new Date(ticket.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {(slaMetrics.minutesToFirstResponse !== null || slaMetrics.minutesToResolution !== null) && (
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                      {slaMetrics.minutesToFirstResponse !== null && (
                        <div className={`rounded-2xl border p-4 ${getSLAStatusColor(slaMetrics.isOverdueFirstResponse, slaMetrics.status)}`}>
                          <p className="text-xs font-medium uppercase tracking-[0.16em]">Time to First Response</p>
                          <p className="mt-2 text-2xl font-bold">{formatMinutesToTime(slaMetrics.minutesToFirstResponse)}</p>
                          <p className="mt-1 text-xs">SLA target: 4 hours</p>
                        </div>
                      )}
                      {slaMetrics.minutesToResolution !== null && (
                        <div className={`rounded-2xl border p-4 ${getSLAStatusColor(false, slaMetrics.status)}`}>
                          <p className="text-xs font-medium uppercase tracking-[0.16em]">Time to Resolution</p>
                          <p className="mt-2 text-2xl font-bold">{formatMinutesToTime(slaMetrics.minutesToResolution)}</p>
                          <p className="mt-1 text-xs">SLA target: 24 hours</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Description
                </h2>
                <p className="leading-relaxed text-slate-700">{ticket.description}</p>
                {ticket.additionalNotes ? (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <p className="mb-2 text-xs font-medium text-slate-500">Additional Notes</p>
                    <p className="text-slate-700">{ticket.additionalNotes}</p>
                  </div>
                ) : null}
              </div>

              {ticket.rejectionReason ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-bold text-rose-950">Rejection Reason</h2>
                  <p className="leading-relaxed text-rose-900">{ticket.rejectionReason}</p>
                </div>
              ) : null}

              {ticket.adminFeedback ? (
                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Admin Review</p>
                      <h2 className="mt-2 text-lg font-bold text-slate-950">Feedback & Rating</h2>
                    </div>
                    {ticket.adminRating ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                        {ticket.adminRating}/5
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 leading-relaxed text-slate-700">{ticket.adminFeedback}</p>
                  {ticket.feedbackByAdminName ? (
                    <p className="mt-3 text-xs text-slate-500">
                      Reviewed by {ticket.feedbackByAdminName}
                      {ticket.adminFeedbackAt ? ` on ${new Date(ticket.adminFeedbackAt).toLocaleString()}` : ''}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {isAdminOrTech ? (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-bold text-slate-900">Before / After Comparison</h2>
                  <BeforeAfterComparison
                    beforeAttachments={ticket.attachments || []}
                    afterAttachments={ticket.technicianAttachments || []}
                  />
                </div>
              ) : (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-bold text-slate-900">Issue Attachments</h2>
                  <TicketAttachmentGallery attachments={ticket.attachments || []} />
                </div>
              )}

              {ticket.resolutionNotes ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-bold text-emerald-950">Resolution Notes</h2>
                  <p className="leading-relaxed text-emerald-900">{ticket.resolutionNotes}</p>
                </div>
              ) : null}

              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Comments
                </h2>
                <TicketCommentThread ticketId={id} />
              </div>

              {ticket.history && ticket.history.length > 0 ? (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Activity History
                  </h2>
                  <TicketTimeline history={ticket.history} />
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <User className="h-4 w-4 text-blue-600" />
                  Technician Assignment
                </h3>
                {ticket.assignedTechnicianName ? (
                  <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{ticket.assignedTechnicianName}</p>
                        <p className="mt-1 text-xs text-slate-600 truncate">{ticket.assignedTechnicianEmail}</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => setAssignModalOpen(true)}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 border border-sky-100"
                          title="Reassign Technician"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm italic text-slate-600">Unassigned</p>
                    {isAdmin && (
                      <button
                        onClick={() => setAssignModalOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-blue-800"
                      >
                        <Users className="h-4 w-4" />
                        Assign Technician
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isAdminOrTech ? (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-bold text-slate-900">Maintenance Workflow</h3>
                  <div className="space-y-3">
                    {workflowSteps.map((step, index) => {
                      const isComplete = currentWorkflowIndex >= index;
                      const isCurrent = currentWorkflowIndex === index;

                      return (
                        <div
                          key={step.key}
                          className={`rounded-2xl border p-4 ${
                            isComplete ? 'border-sky-200 bg-sky-50' : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-600">{step.description}</p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                                isCurrent
                                  ? 'bg-blue-600 text-white'
                                  : isComplete
                                    ? 'bg-sky-100 text-blue-700'
                                    : 'bg-white text-slate-400'
                              }`}
                            >
                              {isCurrent ? 'Current' : isComplete ? 'Done' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Next Step</p>
                    <p className="mt-2 text-sm leading-6 text-amber-950">{nextStepCopy}</p>
                  </div>
                </div>
              ) : null}

              {isAdmin ? (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-bold text-slate-900">Admin Actions</h3>
                  <div className="space-y-2">
                    {canReject ? (
                      <button
                        onClick={() => setRejectModalOpen(true)}
                        className="w-full rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      >
                        Reject Ticket
                      </button>
                    ) : null}
                    {canGiveFeedback ? (
                      <button
                        onClick={() => setFeedbackModalOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {ticket.adminFeedback ? 'Update Feedback' : 'Give Feedback'}
                      </button>
                    ) : null}
                    <button
                      onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit Ticket Details
                    </button>
                  </div>
                </div>
              ) : null}

              {isTechnician ? (
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-bold text-slate-900">Technician Actions</h3>

                  {!isAssignedToCurrentTechnician ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-950">Waiting for technician ownership</p>
                      <p className="mt-2 text-xs leading-5 text-amber-800">
                        This ticket is not assigned to your account yet. Workflow actions are locked until ownership is assigned to you.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(ticket.status === 'IN_PROGRESS' || ticket.status === 'RESOLVED') ? (
                        <div>
                          <label className="block text-sm font-semibold text-slate-900">Resolution Notes</label>
                          <textarea
                            value={resolutionNotes}
                            onChange={(event) => setResolutionNotes(event.target.value)}
                            rows={5}
                            placeholder="Document the work completed, materials used, and final outcome..."
                            className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="mt-2 text-xs text-slate-500">
                            Resolution notes are mandatory before a technician can mark this ticket as resolved.
                          </p>
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        {ticket.status === 'OPEN' ? (
                          <button
                            onClick={() => handleStatusUpdate('IN_PROGRESS')}
                            disabled={updateStatusMutation.isPending}
                            className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:bg-gray-400"
                          >
                            {updateStatusMutation.isPending ? 'Updating...' : 'Start Work'}
                          </button>
                        ) : null}

                        {ticket.status === 'IN_PROGRESS' ? (
                          <button
                            onClick={() => handleStatusUpdate('RESOLVED', { notes: resolutionNotes })}
                            disabled={updateStatusMutation.isPending || !resolutionNotes.trim()}
                            className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
                          >
                            {updateStatusMutation.isPending ? 'Updating...' : 'Mark as Resolved'}
                          </button>
                        ) : null}

                        {ticket.status === 'RESOLVED' ? (
                          <button
                            onClick={() => handleStatusUpdate('CLOSED')}
                            disabled={updateStatusMutation.isPending}
                            className="w-full rounded-lg bg-slate-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:bg-gray-400"
                          >
                            {updateStatusMutation.isPending ? 'Updating...' : 'Close Ticket'}
                          </button>
                        ) : null}

                        {canReject ? (
                          <button
                            onClick={() => setRejectModalOpen(true)}
                            disabled={updateStatusMutation.isPending}
                            className="w-full rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                          >
                            Reject Ticket
                          </button>
                        ) : null}
                      </div>

                      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                        <div className="flex items-center gap-2">
                          <UploadCloud className="h-4 w-4 text-blue-700" />
                          <p className="text-sm font-semibold text-slate-900">Completion Images</p>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          Upload up to 3 after-work images for admin-only verification. These images are hidden from students and technicians after upload.
                        </p>
                        {uploadError ? (
                          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{uploadError}</div>
                        ) : null}
                        {uploadSuccess ? (
                          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{uploadSuccess}</div>
                        ) : null}
                        <div className="mt-4">
                          <TicketAttachmentGallery
                            attachments={ticket.technicianAttachments || []}
                            onUpload={handleAfterUpload}
                            isLoading={uploadingAfterImages}
                            emptyMessage="No completion images uploaded yet."
                            helperMessage="Upload up to 3 completion images for admin review."
                            maxAttachments={3}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-slate-900">Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-slate-600">Requester</p>
                    <p className="mt-1 font-medium text-slate-900">{ticket.userFullName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600">Contact Email</p>
                    <p className="mt-1 text-slate-900">{ticket.contactEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600">Contact Phone</p>
                    <p className="mt-1 text-slate-900">{ticket.contactPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600">Expected Date</p>
                    <p className="mt-1 text-slate-900">
                      {ticket.expectedDate ? new Date(ticket.expectedDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600">Current Status</p>
                    <p className="mt-1 font-medium text-slate-900">{formatStatusLabel(ticket.status)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AssignTechnicianModal
            isOpen={assignModalOpen}
            ticketId={ticket.id}
            ticketNumber={ticket.id}
            currentAssignedTo={ticket.assignedTechnicianName}
            onClose={() => setAssignModalOpen(false)}
            onSuccess={handleAssignSuccess}
          />

          <FeedbackModal
            isOpen={feedbackModalOpen}
            onClose={() => setFeedbackModalOpen(false)}
            onSubmit={handleFeedbackSubmit}
            isSubmitting={addFeedbackMutation.isPending}
            initialFeedback={ticket.adminFeedback || ''}
            initialRating={ticket.adminRating || 0}
          />

          <RejectModal
            isOpen={rejectModalOpen}
            onClose={() => setRejectModalOpen(false)}
            onSubmit={handleReject}
            isSubmitting={updateStatusMutation.isPending}
            actorLabel={isAdmin ? 'Reject Ticket' : 'Reject Assigned Ticket'}
          />
        </main>
      </div>
    </div>
  );
}
