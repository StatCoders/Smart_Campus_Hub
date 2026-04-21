import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const CHART_COLORS = {
  Open: '#f43f5e',
  'In Progress': '#f59e0b',
  Resolved: '#10b981',
  Closed: '#64748b',
  Rejected: '#dc2626',
};

function TicketTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-slate-950">{item.name}</p>
      <p className="mt-1 text-sm text-slate-500">{item.value} tickets</p>
    </div>
  );
}

export default function StatusDistributionChart({ data, totalTickets }) {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[28px] border border-dashed border-sky-100 bg-sky-50/40 text-center">
        <div className="space-y-2 px-6">
          <p className="text-lg font-semibold text-slate-950">No ticket activity yet</p>
          <p className="text-sm leading-6 text-slate-500">
            Status distribution will appear here once maintenance requests start flowing in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
      <div className="relative w-full" style={{ minHeight: '288px', height: '288px' }}>
        <ResponsiveContainer width="100%" height={288}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={72}
              outerRadius={102}
              paddingAngle={4}
              strokeWidth={0}
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.color || CHART_COLORS[item.name] || '#1e40af'} />
              ))}
            </Pie>
            <Tooltip content={<TicketTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-white/95 px-8 py-5 text-center shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{totalTickets}</p>
            <p className="text-sm text-slate-500">active records</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: item.color || CHART_COLORS[item.name] || '#1e40af' }}
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {item.share}% of volume
                </p>
              </div>
            </div>
            <span className="text-lg font-semibold text-slate-950">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
