import React from 'react';
import { AlertCircle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, isLoading, isDangerous = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        {/* Icon and Title */}
        <div className="mb-4 flex items-start gap-4">
          {isDangerous && (
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          )}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${isDangerous ? 'text-red-900' : 'text-slate-950'}`}>
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {isLoading ? 'Confirming...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
