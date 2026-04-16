import React from 'react';

const STATUS_STYLES = {
  OPEN: 'border-rose-200 bg-rose-50 text-rose-700',
  IN_PROGRESS: 'border-amber-200 bg-amber-50 text-amber-700',
  RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CLOSED: 'border-slate-200 bg-slate-100 text-slate-700',
  REJECTED: 'border-red-200 bg-red-50 text-red-700',
};

const PRIORITY_STYLES = {
  LOW: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  MEDIUM: 'border-sky-200 bg-sky-50 text-sky-700',
  HIGH: 'border-orange-200 bg-orange-50 text-orange-700',
  URGENT: 'border-red-200 bg-red-50 text-red-700',
};

const LABELS = {
  IN_PROGRESS: 'In Progress',
};

const SIZE_STYLES = {
  sm: 'px-2.5 py-1 text-[11px]',
  md: 'px-3 py-1.5 text-xs',
};

const formatLabel = (value) => {
  if (!value) {
    return 'Unknown';
  }

  if (LABELS[value]) {
    return LABELS[value];
  }

  return value
    .toString()
    .toLowerCase()
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
};

export default function StatusBadge({ value, type = 'status', size = 'md' }) {
  const toneMap = type === 'priority' ? PRIORITY_STYLES : STATUS_STYLES;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold tracking-[0.12em] uppercase ${
        toneMap[value] || 'border-slate-200 bg-slate-100 text-slate-700'
      } ${SIZE_STYLES[size] || SIZE_STYLES.md}`}
    >
      {formatLabel(value)}
    </span>
  );
}
