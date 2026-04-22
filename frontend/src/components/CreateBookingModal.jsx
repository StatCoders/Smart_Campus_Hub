import React, { useState, useEffect } from 'react';
import { createBooking } from '../services/bookingService';
import { getAllFacilities } from '../services/facilityService';

// Generate 30-minute time slots from 08:00 to 20:00
function generateTimeSlots() {
  const slots = [];
  for (let h = 8; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 20) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

function todayString() {
  return new Date().toISOString().split('T')[0];
}

const EMPTY_FORM = {
  resourceId: '',
  date: todayString(),
  startTime: '08:00',
  endTime: '09:00',
  attendees: 1,
  purpose: '',
};

export default function CreateBookingModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch resources when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setFormData({ ...EMPTY_FORM, date: todayString() });
    setError('');
    const fetchResources = async () => {
      setResourcesLoading(true);
      try {
        const data = await getAllFacilities();
        const list = Array.isArray(data) ? data : data.content ?? [];
        const bookableResources = list.filter(r => r.bookingStatus === 'CAN_BOOK_NOW');
        setResources(bookableResources);
        if (bookableResources.length > 0) {
          setFormData((prev) => ({ ...prev, resourceId: String(bookableResources[0].id) }));
        }
      } catch {
        setResources([]);
      } finally {
        setResourcesLoading(false);
      }
    };
    fetchResources();
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = () => {
    if (!formData.resourceId) return 'Please select a resource.';
    if (!formData.date) return 'Please select a date.';
    if (!formData.startTime) return 'Please select a start time.';
    if (!formData.endTime) return 'Please select an end time.';
    if (formData.startTime >= formData.endTime) return 'End time must be after start time.';
    if (!formData.attendees || Number(formData.attendees) < 1) return 'Attendees must be at least 1.';
    
    // Capacity validation
    const selectedResource = resources.find(r => String(r.id) === String(formData.resourceId));
    if (selectedResource && Number(formData.attendees) > selectedResource.capacity) {
      return `Number of attendees (${formData.attendees}) exceeds the resource capacity.`;
    }

    if (!formData.purpose.trim()) return 'Please provide a purpose for the booking.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        resourceId: Number(formData.resourceId),
        bookingDate: formData.date,                  // LocalDate  → "2026-04-13"
        startTime: `${formData.startTime}:00`,       // LocalTime  → "08:00:00"
        endTime: `${formData.endTime}:00`,           // LocalTime  → "09:00:00"
        expectedAttendees: Number(formData.attendees),
        purpose: formData.purpose.trim(),
      };

      await createBooking(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err?.response?.status === 409) {
        setError(
          err.response?.data?.message ||
            'This time slot conflicts with an existing booking. Please choose a different time or resource.'
        );
      } else {
        setError(err?.response?.data?.message || 'Failed to create booking. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-5 sticky top-0 z-10 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">New Booking</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 text-2xl font-bold leading-none"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Conflict / error banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-300 text-rose-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Resource dropdown */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Resource *
            </label>
            {resourcesLoading ? (
              <div className="text-sm text-slate-500">Loading resources…</div>
            ) : (
              <select
                name="resourceId"
                value={formData.resourceId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                id="booking-resource"
              >
                {resources.length === 0 && <option value="">No resources available</option>}
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.building ? `– ${r.building}` : ''} (Cap: {r.capacity})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              min={todayString()}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              id="booking-date"
            />
          </div>

          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Start Time *
              </label>
              <select
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                id="booking-start-time"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                End Time *
              </label>
              <select
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                id="booking-end-time"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Attendees */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Number of Attendees *
              </label>
              {formData.resourceId && (
                <span className="text-xs font-medium text-indigo-600">
                  Max Capacity: {resources.find(r => String(r.id) === String(formData.resourceId))?.capacity || 0}
                </span>
              )}
            </div>
            <input
              type="number"
              name="attendees"
              value={formData.attendees}
              onChange={handleChange}
              min="1"
              placeholder="e.g. 10"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              id="booking-attendees"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Purpose *
            </label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              rows={3}
              placeholder="Briefly describe the purpose of this booking…"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
              id="booking-purpose"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              {loading ? 'Submitting…' : 'Submit Booking'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
