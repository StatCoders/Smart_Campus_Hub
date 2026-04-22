import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCheck,
  CheckCircle,
  ClipboardList,
  Clock,
  FolderKanban,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import TopBar from '../components/TopBar';
import TechnicianMaintenanceSidebar from '../components/TechnicianMaintenanceSidebar';
import PriorityBreakdown from '../components/dashboard/PriorityBreakdown';
import StatusDistributionChart from '../components/dashboard/StatusDistributionChart';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import { useTicketsByTechnician } from '../hooks/useTickets';

const formatStatusLabel = (status) => String(status || '').replace(/_/g, ' ');

const getStatusColor = (status) => {
  const colors = {
    OPEN: 'bg-red-100 text-red-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-slate-100 text-slate-800',
    REJECTED: 'bg-rose-100 text-rose-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getPriorityColor = (priority) => {
  const colors = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
  };

  return colors[priority] || 'bg-gray-100 text-gray-800';
};

const getLocationLabel = (ticket) => {
  const location = [ticket.building, ticket.roomNumber].filter(Boolean).join(' / ');
  return location || ticket.resourceId || 'Campus Resource';
};

const formatExpectedDate = (value) => {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleDateString();
};

const formatCompactDate = (value) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));

const getStatusSeries = (tickets) => {
  const colors = {
    OPEN: '#f43f5e',
    IN_PROGRESS: '#f59e0b',
    RESOLVED: '#10b981',
    CLOSED: '#64748b',
    REJECTED: '#dc2626',
  };

  return ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']
    .map((status) => {
      const value = tickets.filter((ticket) => ticket.status === status).length;
      const share = tickets.length ? Math.round((value / tickets.length) * 100) : 0;

      return {
        key: status,
        name: formatStatusLabel(status),
        value,
        share,
        color: colors[status],
      };
    })
    .filter((item) => item.value > 0);
};

const getPrioritySeries = (tickets) =>
  ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    .map((priority) => {
      const count = tickets.filter((ticket) => ticket.priority === priority).length;
      const share = tickets.length ? Math.round((count / tickets.length) * 100) : 0;

      return { label: priority, count, share };
    })
    .filter((item) => item.count > 0);

const getCategorySeries = (tickets) =>
  Object.entries(
    tickets.reduce((accumulator, ticket) => {
      const key = ticket.category || 'Uncategorized';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([name, total]) => ({ name, total }));

const getTrendSeries = (tickets) => {
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    return day;
  });

  return days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const created = tickets.filter((ticket) => {
      const createdAt = new Date(ticket.createdAt);
      return createdAt >= day && createdAt < nextDay;
    }).length;

    const resolved = tickets.filter((ticket) => {
      if (!['RESOLVED', 'CLOSED'].includes(ticket.status) || !ticket.updatedAt) {
        return false;
      }

      const resolvedAt = new Date(ticket.updatedAt);
      return resolvedAt >= day && resolvedAt < nextDay;
    }).length;

    return {
      label: formatCompactDate(day),
      created,
      resolved,
    };
  });
};

function AnalysisTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-slate-950">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="font-medium text-slate-500" style={{ color: entry.color }}>
              {entry.name}
            </span>
            <span className="font-semibold text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState('maintenance');
  const {
    data: tickets = [],
    isLoading: loading,
    error,
    refetch,
    isFetching,
  } = useTicketsByTechnician(user?.id, { enabled: !!user?.id });

  const readyToStartTickets = tickets.filter((ticket) => ticket.status === 'OPEN');
  const activeTickets = tickets.filter((ticket) => ticket.status === 'IN_PROGRESS');
  const resolvedTickets = tickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(ticket.status));
  const elevatedTickets = tickets.filter(
    (ticket) => ['HIGH', 'URGENT'].includes(ticket.priority) && !['RESOLVED', 'CLOSED'].includes(ticket.status)
  );
  const sortedTickets = [...tickets].sort(
    (left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt)
  );

  const stats = {
    totalTickets: tickets.length,
    openTickets: readyToStartTickets.length,
    inProgress: activeTickets.length,
    resolved: resolvedTickets.length,
    elevated: elevatedTickets.length,
  };

  const completionRate = stats.totalTickets > 0 ? Math.round((stats.resolved / stats.totalTickets) * 100) : 0;
  const statusDistribution = getStatusSeries(tickets);
  const priorityBreakdown = getPrioritySeries(tickets);
  const categoryBreakdown = getCategorySeries(tickets);
  const workloadTrend = getTrendSeries(tickets);
  const overdueTickets = tickets.filter(
    (ticket) =>
      ticket.expectedDate &&
      new Date(ticket.expectedDate) < new Date() &&
      !['RESOLVED', 'CLOSED'].includes(ticket.status)
  ).length;
  const feedbackCount = tickets.filter((ticket) => ticket.adminFeedback).length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TechnicianMaintenanceSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <TopBar user={user} />

        <main className="p-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold text-gray-900">Technician Dashboard</h1>
              <p className="text-gray-600">Your assigned maintenance and incident workload</p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh Queue
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-400 bg-red-100 p-4 text-red-700">
              {error.message || 'Failed to fetch data'}
            </div>
          )}

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-xl text-gray-600">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {activeTab === 'maintenance' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <div className="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Assigned to Me</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.totalTickets}</p>
                        </div>
                        <ClipboardList className="h-12 w-12 text-blue-200" />
                      </div>
                    </div>

                    <div className="rounded-lg border-l-4 border-red-500 bg-white p-6 shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Ready to Start</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.openTickets}</p>
                        </div>
                        <TriangleAlert className="h-12 w-12 text-red-200" />
                      </div>
                    </div>

                    <div className="rounded-lg border-l-4 border-yellow-500 bg-white p-6 shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">In Progress</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
                        </div>
                        <Clock className="h-12 w-12 text-yellow-200" />
                      </div>
                    </div>

                    <div className="rounded-lg border-l-4 border-green-500 bg-white p-6 shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Resolved / Closed</p>
                          <p className="text-3xl font-bold text-gray-900">{stats.resolved}</p>
                        </div>
                        <CheckCircle className="h-12 w-12 text-green-200" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                      <div className="border-b border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900">My Work Queue</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Tickets currently assigned to your technician account.
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ticket</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Priority</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Expected Date</th>
                              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {sortedTickets.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-600">
                                  No assigned tickets yet. New admin assignments will appear here automatically.
                                </td>
                              </tr>
                            ) : (
                              sortedTickets.map((ticket) => (
                                <tr key={ticket.id} className="transition-colors hover:bg-gray-50">
                                  <td className="px-6 py-4 align-top">
                                    <p className="text-sm font-semibold text-gray-900">#{ticket.id}</p>
                                    <p className="mt-1 text-xs text-gray-600">{ticket.category}</p>
                                    {ticket.adminFeedback && (
                                      <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50 p-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                                          Admin Feedback
                                        </p>
                                        <p className="mt-2 text-xs leading-5 text-slate-700">{ticket.adminFeedback}</p>
                                        {ticket.adminRating ? (
                                          <p className="mt-2 text-xs font-semibold text-amber-700">
                                            Rating: {ticket.adminRating}/5
                                          </p>
                                        ) : null}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 align-top text-sm text-gray-700">
                                    <p className="font-medium text-gray-900">{ticket.resourceId}</p>
                                    <p className="mt-1 text-xs text-gray-500">{getLocationLabel(ticket)}</p>
                                  </td>
                                  <td className="px-6 py-4 align-top text-sm">
                                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                      {ticket.priority}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 align-top text-sm">
                                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                      {formatStatusLabel(ticket.status)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 align-top text-sm text-gray-700">{formatExpectedDate(ticket.expectedDate)}</td>
                                  <td className="px-6 py-4 align-top text-sm">
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                                    >
                                      Open Ticket
                                      <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="text-xl font-bold text-gray-900">Ready to Start</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Newly assigned tickets waiting for technician action.
                        </p>
                        <div className="mt-4 space-y-3">
                          {readyToStartTickets.length === 0 ? (
                            <p className="rounded-lg bg-gray-50 px-4 py-4 text-sm text-gray-600">
                              No new tickets are waiting for pickup.
                            </p>
                          ) : (
                            readyToStartTickets.slice(0, 4).map((ticket) => (
                              <button
                                key={ticket.id}
                                type="button"
                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                className="w-full rounded-lg border border-red-100 bg-red-50 px-4 py-4 text-left transition hover:border-red-200 hover:bg-red-100"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-gray-900">
                                      #{ticket.id} - {ticket.category}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600">{getLocationLabel(ticket)}</p>
                                  </div>
                                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getPriorityColor(ticket.priority)}`}>
                                    {ticket.priority}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="text-xl font-bold text-gray-900">Active Work</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Jobs you are currently progressing through the maintenance workflow.
                        </p>
                        <div className="mt-4 space-y-3">
                          {activeTickets.length === 0 ? (
                            <p className="rounded-lg bg-gray-50 px-4 py-4 text-sm text-gray-600">
                              No tickets are currently in progress.
                            </p>
                          ) : (
                            activeTickets.slice(0, 4).map((ticket) => (
                              <button
                                key={ticket.id}
                                type="button"
                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                className="w-full rounded-lg border border-yellow-100 bg-yellow-50 px-4 py-4 text-left transition hover:border-yellow-200 hover:bg-yellow-100"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-gray-900">#{ticket.id} - {ticket.resourceId}</p>
                                    <p className="mt-1 text-sm text-gray-600">
                                      Due: {formatExpectedDate(ticket.expectedDate)}
                                    </p>
                                    {ticket.adminFeedback ? (
                                      <p className="mt-2 text-xs font-medium text-blue-700">Feedback available from admin review</p>
                                    ) : null}
                                  </div>
                                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getPriorityColor(ticket.priority)}`}>
                                    {ticket.priority}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-6 shadow">
                        <h2 className="text-xl font-bold text-gray-900">Attention Needed</h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Higher-priority work currently assigned to you.
                        </p>
                        <div className="mt-4 space-y-3">
                          {elevatedTickets.length === 0 ? (
                            <p className="rounded-lg bg-gray-50 px-4 py-4 text-sm text-gray-600">
                              No high-priority tickets need attention right now.
                            </p>
                          ) : (
                            elevatedTickets.slice(0, 4).map((ticket) => (
                              <button
                                key={ticket.id}
                                type="button"
                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                className="w-full rounded-lg border border-orange-100 bg-orange-50 px-4 py-4 text-left transition hover:border-orange-200 hover:bg-orange-100"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-gray-900">#{ticket.id} - {ticket.resourceId}</p>
                                    <p className="mt-1 text-sm text-gray-600">{ticket.description}</p>
                                  </div>
                                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getPriorityColor(ticket.priority)}`}>
                                    {ticket.priority}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  <section className="overflow-hidden rounded-[32px] border border-sky-100 bg-gradient-to-br from-[#0F172A] via-[#0b245a] to-[#1E40AF] p-8 text-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.75)]">
                    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] xl:items-start">
                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                          <BarChart3 className="h-4 w-4" />
                          Maintenance Analysis
                        </div>
                        <div>
                          <h2 className="text-3xl font-semibold tracking-tight">Technician performance snapshot</h2>
                          <p className="mt-2 max-w-2xl text-sm leading-7 text-sky-50/85">
                            Visualize your assigned maintenance flow, active workload, and service completion rhythm in one place.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[26px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                          <p className="text-xs uppercase tracking-[0.2em] text-sky-100/75">Completion Rate</p>
                          <p className="mt-3 text-4xl font-semibold text-white">{completionRate}%</p>
                        </div>
                        <div className="rounded-[26px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                          <p className="text-xs uppercase tracking-[0.2em] text-sky-100/75">Feedback Logged</p>
                          <p className="mt-3 text-4xl font-semibold text-white">{feedbackCount}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[28px] border border-sky-100 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Completion Rate</p>
                          <p className="mt-3 text-3xl font-bold text-blue-600">{completionRate}%</p>
                        </div>
                        <CheckCheck className="h-11 w-11 rounded-2xl bg-blue-50 p-2.5 text-blue-600" />
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-sky-100 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Active Tickets</p>
                          <p className="mt-3 text-3xl font-bold text-amber-600">{stats.inProgress}</p>
                        </div>
                        <Activity className="h-11 w-11 rounded-2xl bg-amber-50 p-2.5 text-amber-600" />
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-sky-100 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Pending Start</p>
                          <p className="mt-3 text-3xl font-bold text-rose-600">{stats.openTickets}</p>
                        </div>
                        <TriangleAlert className="h-11 w-11 rounded-2xl bg-rose-50 p-2.5 text-rose-600" />
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-sky-100 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Overdue / Escalated</p>
                          <p className="mt-3 text-3xl font-bold text-orange-600">{overdueTickets + stats.elevated}</p>
                        </div>
                        <FolderKanban className="h-11 w-11 rounded-2xl bg-orange-50 p-2.5 text-orange-600" />
                      </div>
                    </div>
                  </section>

                  <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                    <div className="rounded-[30px] border border-sky-100 bg-white/95 p-6 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] sm:p-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Status Distribution</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Assigned queue composition</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        See how your workload is spread across open, active, resolved, and rejected tickets.
                      </p>
                      <div className="mt-6">
                        <StatusDistributionChart data={statusDistribution} totalTickets={stats.totalTickets} />
                      </div>
                    </div>

                    <div className="rounded-[30px] border border-sky-100 bg-white/95 p-6 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] sm:p-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Priority Mix</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Urgency profile</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Higher-priority work is highlighted here so urgent campus issues never get buried.
                      </p>
                      <div className="mt-6">
                        <PriorityBreakdown items={priorityBreakdown} />
                      </div>
                    </div>
                  </section>

                  <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                    <div className="rounded-[30px] border border-sky-100 bg-white/95 p-6 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] sm:p-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Category Load</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Workload by maintenance area</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Identify which request categories are creating the most technician demand.
                      </p>
                      {categoryBreakdown.length === 0 ? (
                        <div className="mt-6 flex min-h-72 items-center justify-center rounded-[28px] border border-dashed border-sky-100 bg-sky-50/40 px-6 text-center">
                          <div className="space-y-2">
                            <p className="text-lg font-semibold text-slate-950">No category data yet</p>
                            <p className="text-sm leading-6 text-slate-500">
                              Category analysis will appear here as tickets are assigned to your queue.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-6 h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryBreakdown} margin={{ top: 8, right: 16, left: -16, bottom: 8 }}>
                              <CartesianGrid vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                              <Tooltip content={<AnalysisTooltip />} />
                              <Bar dataKey="total" name="Tickets" radius={[10, 10, 0, 0]} fill="#2563eb" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    <div className="rounded-[30px] border border-sky-100 bg-white/95 p-6 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] sm:p-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">7-Day Trend</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Recent workflow movement</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Compare new assigned work against recently resolved output over the last week.
                      </p>
                      <div className="mt-6 h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={workloadTrend} margin={{ top: 8, right: 8, left: -24, bottom: 8 }}>
                            <defs>
                              <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                              </linearGradient>
                              <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                            <Tooltip content={<AnalysisTooltip />} />
                            <Area
                              type="monotone"
                              dataKey="created"
                              name="Created"
                              stroke="#2563eb"
                              fill="url(#createdGradient)"
                              strokeWidth={3}
                            />
                            <Area
                              type="monotone"
                              dataKey="resolved"
                              name="Resolved"
                              stroke="#10b981"
                              fill="url(#resolvedGradient)"
                              strokeWidth={3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
