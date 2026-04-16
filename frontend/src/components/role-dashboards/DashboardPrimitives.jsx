import React from 'react';
import { AlertTriangle, ArrowUpRight, LoaderCircle } from 'lucide-react';

const TONE_STYLES = {
  blue: {
    icon: 'bg-sky-100 text-blue-700',
    accent: 'text-blue-700',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-700',
    accent: 'text-emerald-700',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-700',
    accent: 'text-amber-700',
  },
  rose: {
    icon: 'bg-rose-100 text-rose-700',
    accent: 'text-rose-700',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-700',
    accent: 'text-slate-700',
  },
};

export function DashboardCanvas({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(186,230,253,0.6),_transparent_26%),linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">{children}</div>
    </div>
  );
}

export function DashboardPanel({ title, eyebrow, description, action, children, className = '' }) {
  return (
    <section className={`rounded-[32px] border border-sky-100 bg-white/95 p-6 shadow-xl shadow-slate-200/60 ${className}`}>
      {(title || eyebrow || description || action) && (
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">{eyebrow}</p>
            ) : null}
            {title ? <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2> : null}
            {description ? <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

// eslint-disable-next-line no-unused-vars
export function MetricCard({ icon: Icon, title, value, detail, tone = 'blue', trend }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.blue;

  return (
    <div className="rounded-[30px] border border-sky-100 bg-white/95 p-5 shadow-xl shadow-slate-200/60">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <p className="text-slate-500">{detail}</p>
        {trend ? <span className={`inline-flex items-center gap-1 font-semibold ${styles.accent}`}>{trend}</span> : null}
      </div>
    </div>
  );
}

export function SegmentedTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-3 overflow-x-auto rounded-full border border-sky-100 bg-white/90 p-2 shadow-lg shadow-slate-200/50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex min-w-max items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-blue-700 text-white shadow-lg shadow-blue-200'
                : 'text-slate-600 hover:bg-sky-50 hover:text-slate-950'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' ? (
              <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/15' : 'bg-slate-100'}`}>
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
export function ActionTile({ icon: Icon, title, description, onClick, tone = 'blue' }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.blue;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[30px] border border-sky-100 bg-white/95 p-5 text-left shadow-xl shadow-slate-200/50 transition hover:-translate-y-0.5 hover:shadow-2xl"
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.icon}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <span className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${styles.accent}`}>
        Open
        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </button>
  );
}

export function EmptyPanel({ title, description }) {
  return (
    <div className="flex min-h-60 items-center justify-center rounded-[28px] border border-dashed border-sky-100 bg-sky-50/40 px-6 text-center">
      <div className="space-y-2">
        <p className="text-lg font-semibold text-slate-950">{title}</p>
        <p className="max-w-xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function DashboardAlert({ title, description }) {
  return (
    <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">{title}</p>
          <p className="mt-1 text-sm leading-6">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function LoadingPanel({ label = 'Loading workspace' }) {
  return (
    <div className="flex min-h-80 items-center justify-center rounded-[32px] border border-sky-100 bg-white/95 shadow-xl shadow-slate-200/60">
      <div className="flex items-center gap-3 text-slate-500">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

export function Pill({ children, tone = 'slate' }) {
  const palette = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-sky-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${palette[tone] || palette.slate}`}>
      {children}
    </span>
  );
}
