import React, { useState } from 'react';
import { Loader, Star, X } from 'lucide-react';

export default function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  initialFeedback = '',
  initialRating = 0,
}) {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [rating, setRating] = useState(initialRating);
  const [error, setError] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!feedback.trim()) {
      setError('Feedback is required.');
      return;
    }

    if (!rating) {
      setError('Please choose a rating.');
      return;
    }

    setError('');
    await onSubmit({ feedback: feedback.trim(), rating });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Give Feedback</h2>
            <p className="mt-1 text-sm text-blue-100">Review the completed maintenance work.</p>
          </div>
          <button onClick={onClose} className="text-white transition hover:text-blue-200" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-8">
          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div>
            <p className="text-sm font-semibold text-slate-900">Rating</p>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded-full p-2 transition hover:bg-amber-50"
                >
                  <Star
                    className={`h-7 w-7 ${
                      value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900">Feedback</label>
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows={5}
              maxLength={800}
              className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Summarize the quality of the technician's work, communication, and completion outcome..."
            />
            <p className="mt-2 text-right text-xs text-slate-500">{feedback.length}/800</p>
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
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Feedback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
