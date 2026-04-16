import React from 'react';
import StatusBadge from './StatusBadge';

export default function PriorityBreakdown({ items }) {
  if (!items.length) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-[28px] border border-dashed border-sky-100 bg-sky-50/40 px-6 text-center">
        <div className="space-y-2">
          <p className="text-lg font-semibold text-slate-950">Priority trends are quiet</p>
          <p className="text-sm leading-6 text-slate-500">
            Ticket urgency will be summarized here as soon as requests are created.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-[26px] border border-slate-100 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <StatusBadge value={item.label} type="priority" />
              <div>
                <p className="text-sm font-semibold text-slate-950">{item.count} tickets</p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.share}% of queue</p>
              </div>
            </div>
            <span className="text-sm font-medium text-slate-500">{item.share}%</span>
          </div>

          <div className="mt-4 h-2.5 rounded-full bg-slate-200">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-blue-700 to-sky-400"
              style={{ width: `${Math.max(item.share, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
