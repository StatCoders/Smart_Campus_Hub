import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, Loader, X } from 'lucide-react';
import { getAvailableTechnicians } from '../services/userService';
import { useAssignTechnician } from '../hooks/useTicketMutations';

export default function AssignTechnicianModal({
  isOpen,
  ticketId,
  ticketNumber,
  currentAssignedTo,
  onClose,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    selectedTechnicianId: null,
    note: '',
  });
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);

  const assignMutation = useAssignTechnician();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData({
      selectedTechnicianId: null,
      note: '',
    });
    setError('');
    setCharCount(0);

    const fetchTechs = async () => {
      setLoadingTechs(true);
      try {
        const data = await getAvailableTechnicians(ticketId);
        setTechnicians(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch technicians:', err);
        setTechnicians([]);
        setError('Failed to load technicians. Please try again.');
      } finally {
        setLoadingTechs(false);
      }
    };

    fetchTechs();
  }, [isOpen, ticketId]);

  const handleTechnicianChange = (e) => {
    const value = e.target.value ? Number(e.target.value) : null;
    setFormData((prev) => ({ ...prev, selectedTechnicianId: value }));
    setError('');
  };

  const handleNoteChange = (e) => {
    const value = e.target.value.slice(0, 500);
    setFormData((prev) => ({ ...prev, note: value }));
    setCharCount(value.length);
    setError('');
  };

  const validate = () => {
    if (!formData.selectedTechnicianId) {
      return 'Please select a technician to assign.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await assignMutation.mutateAsync({
        ticketId,
        technicianId: formData.selectedTechnicianId,
        note: formData.note.trim() || null,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Assignment error:', err);
      setError(err?.message || 'Failed to assign technician. Please try again.');
    }
  };

  if (!isOpen) {
    return null;
  }

  const isLoading = assignMutation.isPending || loadingTechs;
  const selectedTech = technicians.find((tech) => tech.id === formData.selectedTechnicianId);
  const isReassignment = Boolean(currentAssignedTo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white shadow-lg">
        <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isReassignment ? 'Reassign Technician' : 'Assign Technician'}
            </h2>
            <p className="mt-1 text-sm text-blue-100">Ticket #{ticketNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white transition hover:text-blue-200"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-8">
          {error && (
            <div className="flex gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {currentAssignedTo && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
              <p className="font-medium text-blue-900">
                Currently assigned to: <span className="font-semibold">{currentAssignedTo}</span>
              </p>
              <p className="mt-2 text-xs leading-5 text-blue-700">
                Saving this change transfers ownership to the selected technician.
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Select Technician *
            </label>
            {loadingTechs ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="h-5 w-5 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">Loading technicians...</span>
              </div>
            ) : technicians.length === 0 ? (
              <div className="py-3 text-center text-sm text-gray-600">
                No available technicians right now
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Technicians appear here when they have no open or in-progress assigned ticket.
                </p>
              </div>
            ) : (
              <select
                name="technician"
                value={formData.selectedTechnicianId || ''}
                onChange={handleTechnicianChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Technician --</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.firstName} {tech.lastName} ({tech.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedTech && (
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900">
                  {selectedTech.firstName} {selectedTech.lastName}
                </p>
                <p className="text-gray-600">{selectedTech.email}</p>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Assignment Note (Optional)
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleNoteChange}
              placeholder="Add any notes about this assignment..."
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            <p className="mt-1 text-right text-xs text-gray-500">{charCount}/500</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Only available technicians are shown. Open tickets automatically enter the active
              maintenance workflow after assignment.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 font-medium text-white transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
              disabled={isLoading || !formData.selectedTechnicianId}
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                isReassignment ? 'Save Reassignment' : 'Assign Ticket'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
