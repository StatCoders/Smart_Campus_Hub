import React, { useState } from 'react';
import { AlertTriangle, Loader, X } from 'lucide-react';

export default function RejectModal({ isOpen, onClose, onSubmit, isSubmitting = false, actorLabel = 'Reject Ticket' }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!reason.trim()) {
      setError('Reason for rejection is required.');
      return;
    }

    setError('');
    await onSubmit(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-rose-600 to-red-600 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{actorLabel}</h2>
            <p className="mt-1 text-sm text-rose-100">Provide a clear reason before moving this ticket to rejected.</p>
          </div>
          <button onClick={onClose} className="text-white transition hover:text-rose-200" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-8">
          <div className="flex gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4 text-sm text-rose-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p>
              Rejected tickets leave the active workflow until an admin reviews the outcome and decides the next step.
            </p>
          </div>

          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div>
            <label className="block text-sm font-semibold text-slate-900">Reason for Rejection</label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={5}
              maxLength={800}
              className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Explain why the ticket cannot proceed as requested..."
            />
            <p className="mt-2 text-right text-xs text-slate-500">{reason.length}/800</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-rose-700 hover:to-red-700 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Confirm Rejection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
