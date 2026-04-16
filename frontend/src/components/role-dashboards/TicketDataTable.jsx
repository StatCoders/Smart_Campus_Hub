import React, { useDeferredValue, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import StatusBadge from '../dashboard/StatusBadge';

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

export default function TicketDataTable({
  tickets,
  title,
  subtitle,
  selectedTicketId,
  onSelectTicket,
  actionRenderer,
  pageSize = 6,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const query = deferredSearchTerm.trim().toLowerCase();
  const filteredTickets = tickets.filter((ticket) => {
    if (!query) {
      return true;
    }

    return [
      ticket.id,
      ticket.category,
      ticket.description,
      ticket.resourceId,
      ticket.building,
      ticket.roomNumber,
      ticket.status,
      ticket.priority,
    ]
      .filter(Boolean)
      .some((field) => field.toString().toLowerCase().includes(query));
  });

  useEffect(() => {
    Promise.resolve().then(() => setCurrentPage(1));
  }, [deferredSearchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTickets = filteredTickets.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <label className="relative block lg:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search tickets"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <th className="px-4 py-2">Ticket</th>
              <th className="px-4 py-2">Location</th>
              <th className="px-4 py-2">Requested</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Status</th>
              {actionRenderer ? <th className="px-4 py-2 text-right">Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.map((ticket) => {
              const isSelected = selectedTicketId === ticket.id;

              return (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className={`cursor-pointer rounded-[26px] text-sm transition ${
                    isSelected ? 'bg-sky-50 text-slate-800' : 'bg-slate-50/80 text-slate-600 hover:bg-sky-50/70'
                  }`}
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
                    <p className="font-medium text-slate-800">{ticket.resourceId || 'Campus Resource'}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{getLocationLabel(ticket)}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-500">{formatDate(ticket.createdAt)}</td>
                  <td className="px-4 py-4">
                    <StatusBadge value={ticket.priority} type="priority" />
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge value={ticket.status} />
                  </td>
                  {actionRenderer ? (
                    <td className="rounded-r-[22px] px-4 py-4 text-right">{actionRenderer(ticket)}</td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div>
          Showing {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filteredTickets.length)} of {filteredTickets.length} tickets
        </div>

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
  );
}
