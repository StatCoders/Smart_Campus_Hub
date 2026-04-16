import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

const TONE_STYLES = {
  blue: {
    icon: 'bg-sky-100 text-blue-700',
    accent: 'text-blue-700',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-700',
    accent: 'text-amber-700',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-700',
    accent: 'text-emerald-700',
  },
  slate: {
    icon: 'bg-slate-200 text-slate-700',
    accent: 'text-slate-700',
  },
};

export default function StatCard({
  title,
  value,
  // eslint-disable-next-line no-unused-vars
  icon: Icon,
  change,
  helperText,
  tone = 'blue',
}) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.blue;
  const changeValue = Number.isFinite(change) ? change : 0;
  const isPositive = changeValue >= 0;

  return (
    <div className="rounded-[28px] border border-sky-100/80 bg-white/95 p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-semibold tracking-tight text-slate-950">{value}</h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(changeValue).toFixed(changeValue % 1 === 0 ? 0 : 1)}%
            </span>
          </div>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <p className={`mt-4 text-sm ${styles.accent}`}>{helperText}</p>
    </div>
  );
}
