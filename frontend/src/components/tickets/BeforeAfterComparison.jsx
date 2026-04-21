import React from 'react';
import TicketAttachmentGallery from './TicketAttachmentGallery';

export default function BeforeAfterComparison({ beforeAttachments = [], afterAttachments = [] }) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Before</p>
        <h3 className="mt-2 text-xl font-bold text-slate-950">Reported Issue Images</h3>
        <p className="mt-1 text-sm text-slate-500">
          Initial evidence uploaded with the maintenance request.
        </p>
        <div className="mt-5">
          <TicketAttachmentGallery attachments={beforeAttachments} />
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">After</p>
        <h3 className="mt-2 text-xl font-bold text-slate-950">Completion Images</h3>
        <p className="mt-1 text-sm text-slate-500">
          Technician-uploaded images for admin verification and before/after review.
        </p>
        <div className="mt-5">
          <TicketAttachmentGallery attachments={afterAttachments} />
        </div>
      </section>
    </div>
  );
}
