import React, { startTransition, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  CircleDashed,
  Clock3,
  Plus,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import StatCard from '../components/dashboard/StatCard';
import TicketTable from '../components/dashboard/TicketTable';
import StatusBadge from '../components/dashboard/StatusBadge';
import StatusDistributionChart from '../components/dashboard/StatusDistributionChart';
import PriorityBreakdown from '../components/dashboard/PriorityBreakdown';
import { getAllTickets } from '../services/ticketService';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import { formatRelativeTime } from '../utils/dateFormatter';

const STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
};

const STATUS_COLORS = {
  OPEN: '#f43f5e',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#10b981',
  CLOSED: '#64748b',
  REJECTED: '#dc2626',
};

const formatDate = (value) => {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

const getLocationLabel = (ticket) => {
  const location = [ticket.building, ticket.roomNumber].filter(Boolean).join(' / ');
  return location || ticket.resourceId || 'Campus Resource';
};

const getTrend = (tickets, predicate) => {
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  const currentWindow = tickets.filter((ticket) => {
    const createdAt = new Date(ticket.createdAt).getTime();
    return now - createdAt <= oneWeek && predicate(ticket);
  }).length;

  const previousWindow = tickets.filter((ticket) => {
    const createdAt = new Date(ticket.createdAt).getTime();
    return now - createdAt > oneWeek && now - createdAt <= oneWeek * 2 && predicate(ticket);
  }).length;

  if (previousWindow === 0) {
    return currentWindow > 0 ? 100 : 0;
  }

  return ((currentWindow - previousWindow) / previousWindow) * 100;
};

const getAssignedTickets = (tickets, user) => {
  const assignmentCandidates = [
    'assignedToId',
    'assigneeId',
    'technicianId',
    'assignedUserId',
  ];

  const assignedTickets = tickets.filter((ticket) =>
    assignmentCandidates.some((field) => ticket[field] && Number(ticket[field]) === Number(user?.id))
  );

  const hasAssignmentMetadata = tickets.some((ticket) =>
    assignmentCandidates.some((field) => Object.prototype.hasOwnProperty.call(ticket, field))
  );

  return {
    hasAssignmentMetadata,
    tickets: assignedTickets,
  };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [navigationTab, setNavigationTab] = useState('dashboard');
  const [activeView, setActiveView] = useState('overview');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadTickets = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const data = await getAllTickets();
      setTickets(data);
    } catch (err) {
      setError(err.message || 'Unable to load maintenance data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const sortedTickets = [...tickets].sort(
    (left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt)
  );

  const myTickets = sortedTickets.filter((ticket) => Number(ticket.userId) === Number(user?.id));
  const resolvedTickets = sortedTickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(ticket.status));
  const openTickets = sortedTickets.filter((ticket) => ticket.status === 'OPEN');
  const inProgressTickets = sortedTickets.filter((ticket) => ticket.status === 'IN_PROGRESS');
  const resolvedOnlyTickets = sortedTickets.filter((ticket) => ticket.status === 'RESOLVED');
  const allTickets = sortedTickets;
  const assignmentState = getAssignedTickets(sortedTickets, user);
  const assignedViewTickets = assignmentState.hasAssignmentMetadata
    ? assignmentState.tickets
    : sortedTickets.filter((ticket) => ['OPEN', 'IN_PROGRESS'].includes(ticket.status));

  const visibleTabs = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'my-tickets', label: 'My Tickets', count: myTickets.length },
    { id: 'assigned', label: 'Assigned to Me', count: assignedViewTickets.length },
    { id: 'all-tickets', label: 'All Tickets', count: allTickets.length },
    { id: 'resolved', label: 'Resolved / Closed', count: resolvedTickets.length },
  ];

  const tabMap = {
    'my-tickets': {
      title: 'My Tickets',
      description: 'Track the requests you created across campus resources and maintenance touchpoints.',
      tickets: myTickets,
      emptyTitle: 'No personal tickets yet',
      emptyDescription: 'Create a new ticket to start monitoring maintenance work from this dashboard.',
      note: 'This view is restricted to requests submitted by your authenticated account.',
    },
    assigned: {
      title: 'Assigned to Me',
      description: 'Operational queue for tickets routed directly into your maintenance workload.',
      tickets: assignedViewTickets,
      emptyTitle: 'Nothing assigned right now',
      emptyDescription:
        'When assignment metadata becomes available from the API, routed tickets will appear here automatically.',
      note: assignmentState.hasAssignmentMetadata
        ? 'Live assignment data is active for this account.'
        : 'The current ticket API does not expose assignee fields yet, so this operational view falls back to active work in the queue.',
    },
    'all-tickets': {
      title: 'All Tickets',
      description: 'A complete cross-campus view of the maintenance and incident pipeline currently returned by the API.',
      tickets: allTickets,
      emptyTitle: 'No tickets available',
      emptyDescription: 'The ticket API returned an empty queue for this account.',
      note: 'Role-based visibility is still enforced by the existing authentication and backend permissions.',
    },
    resolved: {
      title: 'Resolved / Closed',
      description: 'Review completed work, recently closed incidents, and service outcomes.',
      tickets: resolvedTickets,
      emptyTitle: 'No resolved work yet',
      emptyDescription: 'Resolved or closed tickets will appear once requests start moving through the workflow.',
      note: 'This view groups both resolved and closed statuses for easier auditing.',
    },
  };

  const statusDistribution = Object.keys(STATUS_LABELS)
    .map((status) => {
      const count = sortedTickets.filter((ticket) => ticket.status === status).length;
      const share = sortedTickets.length ? Math.round((count / sortedTickets.length) * 100) : 0;

      return {
        key: status,
        name: STATUS_LABELS[status],
        value: count,
        share,
        color: STATUS_COLORS[status],
      };
    })
    .filter((item) => item.value > 0);

  const priorityBreakdown = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    .map((priority) => {
      const count = sortedTickets.filter((ticket) => ticket.priority === priority).length;
      const share = sortedTickets.length ? Math.round((count / sortedTickets.length) * 100) : 0;

      return {
        label: priority,
        count,
        share,
      };
    })
    .filter((item) => item.count > 0);

  const recentTickets = sortedTickets.slice(0, 5);
  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Operations User';

  const heroHighlights = [
    {
      label: 'Queue Coverage',
      value: `${sortedTickets.length} live tickets`,
    },
    {
      label: 'Priority Load',
      value: `${sortedTickets.filter((ticket) => ['HIGH', 'URGENT'].includes(ticket.priority)).length} elevated`,
    },
    {
      label: 'Role Scope',
      value: user?.role || 'USER',
    },
  ];

  const activeTableView = tabMap[activeView];

  const overviewPanels = loading ? (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
      <div className="h-[28rem] animate-pulse rounded-[30px] bg-white/70" />
      <div className="space-y-6">
        <div className="h-[18rem] animate-pulse rounded-[30px] bg-white/70" />
        <div className="h-[18rem] animate-pulse rounded-[30px] bg-white/70" />
      </div>
    </div>
  ) : (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
      <section className="min-w-0 rounded-[30px] border border-sky-100 bg-white/95 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Recent Tickets</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Latest maintenance activity</h2>
            <p className="mt-1 text-sm text-slate-500">
              Freshly updated requests across the live maintenance queue.
            </p>
          </div>

          <button
            type="button"
            onClick={() => startTransition(() => setActiveView('all-tickets'))}
            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-sky-300 hover:bg-white"
          >
            Open Full Queue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {recentTickets.length === 0 ? (
          <div className="px-6 py-16 text-center sm:px-8">
            <h3 className="text-xl font-semibold text-slate-950">No recent maintenance activity</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Create the first ticket to populate the dashboard with operational data.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto px-3 py-4 sm:px-5">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <th className="px-4 py-2">Ticket</th>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="cursor-pointer rounded-3xl bg-slate-50/80 text-sm text-slate-600 transition hover:bg-sky-50/70"
                  >
                    <td className="rounded-l-[22px] px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-950">
                          #{ticket.id} - {ticket.category}
                        </p>
                        <p className="text-sm text-slate-500">{ticket.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">{ticket.resourceId || 'Campus Resource'}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {getLocationLabel(ticket)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      <p>{formatDate(ticket.createdAt)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                        {formatRelativeTime(ticket.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={ticket.priority} type="priority" />
                    </td>
                    <td className="rounded-r-[22px] px-4 py-4">
                      <StatusBadge value={ticket.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="min-w-0 space-y-6">
        <section className="min-w-0 rounded-[30px] border border-sky-100 bg-white/95 p-6 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Status Distribution</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Queue composition</h2>
          <p className="mt-1 text-sm text-slate-500">
            A quick operational read on where the maintenance pipeline currently sits.
          </p>
          <div className="mt-6">
            <StatusDistributionChart data={statusDistribution} totalTickets={sortedTickets.length} />
          </div>
        </section>

        <section className="min-w-0 rounded-[30px] border border-sky-100 bg-white/95 p-6 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Priority Breakdown</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Urgency profile</h2>
          <p className="mt-1 text-sm text-slate-500">
            High-urgency work is surfaced immediately so teams can triage service disruptions faster.
          </p>
          <div className="mt-6">
            <PriorityBreakdown items={priorityBreakdown} />
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(186,230,253,0.55),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)]">
      <Sidebar activeTab={navigationTab} setActiveTab={setNavigationTab} />

      <div className={`min-h-screen transition-all duration-300 ease-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <TopBar user={user} />

        <main className="px-4 pb-8 pt-6 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl space-y-8">
            <section className="overflow-hidden rounded-[36px] border border-sky-100 bg-gradient-to-br from-[#0F172A] via-[#0b245a] to-[#1E40AF] px-6 py-8 text-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.75)] sm:px-8 lg:px-10">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-start">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                    <ShieldCheck className="h-4 w-4" />
                    Smart Campus Operations Hub
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      Smart Campus Dashboard - Maintenance Hub
                    </h1>
                    <p className="max-w-2xl text-sm leading-7 text-sky-50/85 sm:text-base">
                      A polished command center for monitoring campus incidents, maintenance throughput,
                      and service quality in one premium workspace.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-sky-100/90">
                    <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
                      Welcome back, {displayName}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
                      Verified: {user?.emailVerified ? 'Yes' : 'Pending'}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
                      Role: {user?.role || 'USER'}
                    </span>
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-white/10 p-6 backdrop-blur">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/80">
                        Workspace Snapshot
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Operations at a glance</h2>
                    </div>
                    <Wrench className="h-10 w-10 text-sky-100/80" />
                  </div>

                  <div className="mt-6 grid gap-3">
                    {heroHighlights.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3"
                      >
                        <p className="text-xs uppercase tracking-[0.18em] text-sky-100/70">{item.label}</p>
                        <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {error ? (
              <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-5 text-rose-700 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em]">Data warning</p>
                <p className="mt-2 text-sm leading-6">
                  {error} The dashboard still renders, but live ticket metrics require a successful ticket API response.
                </p>
              </div>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Tickets"
                value={sortedTickets.length}
                icon={ClipboardList}
                change={getTrend(sortedTickets, () => true)}
                helperText="Compared with tickets created in the previous 7-day window."
                tone="blue"
              />
              <StatCard
                title="Open"
                value={openTickets.length}
                icon={CircleDashed}
                change={getTrend(sortedTickets, (ticket) => ticket.status === 'OPEN')}
                helperText="Fresh requests still waiting for active intervention."
                tone="amber"
              />
              <StatCard
                title="In Progress"
                value={inProgressTickets.length}
                icon={Clock3}
                change={getTrend(sortedTickets, (ticket) => ticket.status === 'IN_PROGRESS')}
                helperText="Tickets currently being worked by maintenance operations."
                tone="slate"
              />
              <StatCard
                title="Resolved"
                value={resolvedOnlyTickets.length}
                icon={BadgeCheck}
                change={getTrend(sortedTickets, (ticket) => ticket.status === 'RESOLVED')}
                helperText="Successfully resolved issues closed out in the active queue."
                tone="emerald"
              />
            </section>

            <section className="rounded-[30px] border border-sky-100 bg-white/95 px-6 py-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] sm:px-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Quick Actions</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Keep the maintenance workflow moving
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Jump into ticket creation, refresh the live queue, or continue in the full ticket workspace.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate('/tickets/create')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1E40AF] to-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Ticket
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/tickets')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
                  >
                    Open Ticket Workspace
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => loadTickets({ silent: true })}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {visibleTabs.map((tab) => {
                  const isActive = activeView === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => startTransition(() => setActiveView(tab.id))}
                      className={`inline-flex min-w-max items-center gap-3 rounded-full border px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? 'border-blue-700 bg-blue-700 text-white shadow-lg shadow-blue-200'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-slate-950'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== null ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tab.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {activeView === 'overview' ? (
                overviewPanels
              ) : (
                <TicketTable
                  tickets={activeTableView?.tickets || []}
                  title={activeTableView?.title || 'Tickets'}
                  description={activeTableView?.description || 'Live maintenance workspace'}
                  note={activeTableView?.note}
                  emptyTitle={activeTableView?.emptyTitle || 'No tickets found'}
                  emptyDescription={activeTableView?.emptyDescription || 'Try another view or create a new ticket.'}
                  onRowClick={(ticket) => navigate(`/tickets/${ticket.id}`)}
                />
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
