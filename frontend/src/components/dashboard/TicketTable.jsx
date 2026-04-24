import React, { useDeferredValue, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Users } from 'lucide-react';
import StatusBadge from './StatusBadge';

const STATUS_OPTIONS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
const PRIORITY_OPTIONS = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const PAGE_SIZE_OPTIONS = [5, 8, 10, 15];

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

const formatRelative = (value) => {
  if (!value) {
    return 'No updates';
  }

  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(delta / 60000);
  const hours = Math.floor(delta / 3600000);
  const days = Math.floor(delta / 86400000);

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${days}d ago`;
};

const getLocationLabel = (ticket) => {
  const location = [ticket.building, ticket.roomNumber].filter(Boolean).join(' / ');
  return location || ticket.resourceId || 'Campus resource';
};

export default function TicketTable({
  tickets,
  title,
  description,
  note,
  emptyTitle,
  emptyDescription,
  onRowClick = () => {},
  onAssign = null,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const query = deferredSearchTerm.trim().toLowerCase();
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      !query ||
      [
        ticket.id,
        ticket.category,
        ticket.description,
        ticket.resourceId,
        ticket.building,
        ticket.roomNumber,
        ticket.additionalNotes,
      ]
        .filter(Boolean)
        .some((field) => field.toString().toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  useEffect(() => {
    Promise.resolve().then(() => setCurrentPage(1));
  }, [deferredSearchTerm, priorityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTickets = filteredTickets.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <section className="rounded-[30px] border border-sky-100 bg-white/95 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)]">
      <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Ticket Workspace
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            {note ? (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-slate-600">
                {note}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[34rem] xl:grid-cols-[1fr_150px_150px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tickets, locations, or notes"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'ALL' ? 'All Statuses' : option.replace('_', ' ')}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'ALL' ? 'All Priorities' : option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="px-6 py-16 text-center sm:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-50 text-blue-700">
            <Search className="h-7 w-7" />
          </div>
          <h3 className="mt-6 text-xl font-semibold text-slate-950">{emptyTitle}</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{emptyDescription}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto px-3 py-4 sm:px-5">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <th className="px-4 py-2">Ticket</th>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2">Requested</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Updated</th>
                  {onAssign && <th className="px-4 py-2 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => onRowClick(ticket)}
                    className="cursor-pointer rounded-3xl bg-slate-50/80 text-sm text-slate-600 transition hover:bg-sky-50/70"
                  >
                    <td className="rounded-l-[22px] px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-950">
                          #{ticket.id} - {ticket.category || 'General Request'}
                        </p>
                        <p className="max-w-md text-sm leading-6 text-slate-500">
                          {ticket.description || 'No description provided.'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{ticket.resourceId || 'Campus Resource'}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                          {getLocationLabel(ticket)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(ticket.createdAt)}</td>
                    <td className="px-4 py-4">
                      <StatusBadge value={ticket.priority} type="priority" />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={ticket.status} />
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {formatRelative(ticket.updatedAt || ticket.createdAt)}
                    </td>
                    {onAssign && (
                      <td className="rounded-r-[22px] px-4 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssign(ticket);
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:shadow-xl"
                            title={ticket.status === 'REJECTED' ? "Reassign Technician" : "Assign Technician"}
                          >
                            <Users className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filteredTickets.length)} of{' '}
              {filteredTickets.length} tickets
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2">
                <span>Rows</span>
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safePage === 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-20 text-center font-medium text-slate-700">
                  Page {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safePage >= totalPages}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
