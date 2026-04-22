import React from 'react';
import { CheckCircle, Clock, User, Trash2, AlertCircle } from 'lucide-react';

const getActionColor = (action) => {
  const actionLower = action?.toLowerCase() || '';
  
  if (actionLower.includes('created')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (actionLower.includes('open')) return 'bg-red-100 text-red-700 border-red-200';
  if (actionLower.includes('progress')) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (actionLower.includes('resolved')) return 'bg-green-100 text-green-700 border-green-200';
  if (actionLower.includes('closed')) return 'bg-slate-100 text-slate-700 border-slate-200';
  if (actionLower.includes('rejected')) return 'bg-rose-100 text-rose-700 border-rose-200';
  if (actionLower.includes('assigned')) return 'bg-purple-100 text-purple-700 border-purple-200';
  if (actionLower.includes('comment')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
  
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

const getActionIcon = (action) => {
  const actionLower = action?.toLowerCase() || '';
  
  if (actionLower.includes('created')) return <CheckCircle className="h-5 w-5" />;
  if (actionLower.includes('assigned')) return <User className="h-5 w-5" />;
  if (actionLower.includes('comment')) return <AlertCircle className="h-5 w-5" />;
  if (actionLower.includes('deleted')) return <Trash2 className="h-5 w-5" />;
  
  return <Clock className="h-5 w-5" />;
};

export default function TicketTimeline({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No activity recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {history.map((entry, idx) => {
        const colorClass = getActionColor(entry.action);
        
        return (
          <div key={idx} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
            {/* Timeline Icon */}
            <div className="flex-shrink-0">
              <div className={`flex items-center justify-center h-10 w-10 rounded-full ${colorClass} border`}>
                {getActionIcon(entry.action)}
              </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 break-words">{entry.action}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {entry.userFullName} - {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  
                  {/* Additional Details */}
                  {entry.details && (
                    <p className="text-sm text-slate-700 mt-2 break-words">{entry.details}</p>
                  )}

                  {/* Old Value → New Value for status changes */}
                  {entry.oldValue && entry.newValue && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <span className="text-slate-600">Changed from </span>
                      <span className="font-semibold text-slate-900">{entry.oldValue}</span>
                      <span className="text-slate-600"> to </span>
                      <span className="font-semibold text-slate-900">{entry.newValue}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
