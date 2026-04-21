import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTicketById, updateTicket } from '../services/ticketService';
import { uploadMultipleAttachments } from '../services/fileUploadService';
import { useAuth } from '../context/useAuth';
import TicketAttachmentGallery from './tickets/TicketAttachmentGallery';

const RESOURCE_OPTIONS = [
  { id: 'FAC-ENG-101', label: 'FAC-ENG-101 - Engineering Facility 101' },
  { id: 'FAC-ENG-205', label: 'FAC-ENG-205 - Engineering Facility 205' },
  { id: 'LAB-IT-205', label: 'LAB-IT-205 - IT Lab 205' },
  { id: 'LAB-CHEM-301', label: 'LAB-CHEM-301 - Chemistry Lab 301' },
  { id: 'LIB-MAIN-001', label: 'LIB-MAIN-001 - Main Library' },
  { id: 'GYM-FIT-001', label: 'GYM-FIT-001 - Fitness Center' },
  { id: 'CAF-MAIN-001', label: 'CAF-MAIN-001 - Main Cafeteria' },
  { id: 'DORM-A-001', label: 'DORM-A-001 - Dormitory A Block' },
];

const CATEGORIES = [
  'HVAC',
  'Plumbing',
  'Electrical',
  'IT Infrastructure',
  'Building Maintenance',
  'Safety & Security',
  'Furniture & Fixtures',
  'Landscaping',
  'Cleaning',
  'Other',
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-300' },
];

const MAX_ATTACHMENTS = 3;

export default function EditTicket({ ticketId, onSuccess, onCancel }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStudent = String(user?.role || '').toUpperCase() === 'USER';
  const todayString = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    resourceId: '',
    category: '',
    building: '',
    roomNumber: '',
    description: '',
    priority: 'MEDIUM',
    expectedDate: '',
    additionalNotes: '',
  });
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchResource, setSearchResource] = useState('');
  const [showResourceDropdown, setShowResourceDropdown] = useState(false);

  const fetchTicketData = useCallback(async () => {
    try {
      const ticket = await getTicketById(ticketId);
      setFormData({
        resourceId: ticket.resourceId || '',
        category: ticket.category || '',
        building: ticket.building || '',
        roomNumber: ticket.roomNumber || '',
        description: ticket.description || '',
        priority: ticket.priority || 'MEDIUM',
        expectedDate: ticket.expectedDate || '',
        additionalNotes: ticket.additionalNotes || '',
      });
      setSearchResource(ticket.resourceId || '');
      setExistingAttachments(Array.isArray(ticket.attachments) ? ticket.attachments : []);
    } catch (err) {
      setError(err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicketData();
  }, [fetchTicketData]);

  const filteredResources = RESOURCE_OPTIONS.filter((resource) =>
    resource.id.toLowerCase().includes(searchResource.toLowerCase()) ||
    resource.label.toLowerCase().includes(searchResource.toLowerCase())
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (priority) => {
    setFormData((prev) => ({ ...prev, priority }));
  };

  const handleResourceSelect = (resource) => {
    setFormData((prev) => ({ ...prev, resourceId: resource.id }));
    setSearchResource(resource.id);
    setShowResourceDropdown(false);
  };

  const appendFiles = (files) => {
    const remainingSlots = Math.max(MAX_ATTACHMENTS - existingAttachments.length - pendingAttachments.length, 0);
    const nextFiles = Array.from(files || [])
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, remainingSlots)
      .map((file) => ({ id: Math.random(), file }));

    setPendingAttachments((prev) => [...prev, ...nextFiles]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.resourceId.trim()) {
        throw new Error('Resource ID is required');
      }
      if (!formData.category.trim()) {
        throw new Error('Category is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (formData.expectedDate && formData.expectedDate < todayString) {
        throw new Error('Expected date cannot be in the past');
      }

      await updateTicket(ticketId, {
        resourceId: formData.resourceId,
        category: formData.category,
        description: formData.description,
        priority: formData.priority,
        building: formData.building || null,
        roomNumber: formData.roomNumber || null,
        expectedDate: formData.expectedDate || null,
        additionalNotes: formData.additionalNotes || null,
      });

      if (pendingAttachments.length > 0) {
        await uploadMultipleAttachments(pendingAttachments.map((attachment) => attachment.file), ticketId, 'BEFORE');
      }

      setSuccess('Ticket updated successfully.');

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
          return;
        }

        const redirectPath = isStudent ? '/student-tickets' : `/tickets/${ticketId}`;
        navigate(redirectPath);
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-xl text-gray-600">Loading ticket...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {error ? (
        <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-red-700">
          <div className="font-medium">{error}</div>
        </div>
      ) : null}

      {success ? (
        <div className="mb-6 rounded-lg border-l-4 border-green-500 bg-green-50 p-4 text-green-700">
          <div className="font-medium">{success}</div>
        </div>
      ) : null}

      <div className="mb-8 border-b border-gray-200 pb-8">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">1</div>
          Resource Location
        </h3>

        <div className="space-y-5">
          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-900">Resource Location *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search facility (e.g., FAC-ENG-101)"
                value={searchResource}
                onChange={(event) => {
                  setSearchResource(event.target.value);
                  setShowResourceDropdown(true);
                }}
                onFocus={() => setShowResourceDropdown(true)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showResourceDropdown && (
                <div className="absolute z-10 mt-2 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  {filteredResources.length > 0 ? (
                    filteredResources.map((resource) => (
                      <button
                        key={resource.id}
                        type="button"
                        onClick={() => handleResourceSelect(resource)}
                        className="w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-blue-50 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{resource.id}</div>
                        <div className="text-sm text-gray-500">{resource.label.split(' - ')[1]}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-sm text-gray-500">No resources found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-3 block text-sm font-semibold text-gray-900">Building</label>
              <input
                type="text"
                name="building"
                value={formData.building}
                onChange={handleChange}
                placeholder="e.g., Block A"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-3 block text-sm font-semibold text-gray-900">Room</label>
              <input
                type="text"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                placeholder="e.g., 101"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 border-b border-gray-200 pb-8">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">2</div>
          Issue Details
        </h3>

        <div className="space-y-5">
          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-900">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-900">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
              rows="4"
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      </div>

      <div className="mb-8 border-b border-gray-200 pb-8">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">3</div>
          Priority & Timeline
        </h3>

        <div className="space-y-6">
          <div>
            <label className="mb-4 block text-sm font-semibold text-gray-900">Priority Level *</label>
            <div className="flex flex-wrap gap-3">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePriorityChange(option.value)}
                  className={`rounded-full px-6 py-2 font-medium transition-all ${
                    formData.priority === option.value
                      ? `${option.color} ring-2 ring-current ring-offset-2`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-900">Expected Completion Date</label>
            <input
              type="date"
              name="expectedDate"
              value={formData.expectedDate}
              onChange={handleChange}
              min={todayString}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="mb-8 border-b border-gray-200 pb-8">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">4</div>
          Additional Notes
        </h3>

        <div>
          <label className="mb-3 block text-sm font-semibold text-gray-900">
            Notes <span className="text-xs font-normal text-gray-500">({formData.additionalNotes.length}/500)</span>
          </label>
          <textarea
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleChange}
            placeholder="Any additional information..."
            maxLength="500"
            rows="3"
            className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">5</div>
          Issue Images
        </h3>
        <TicketAttachmentGallery
          attachments={existingAttachments}
          onUpload={(files) => appendFiles(files)}
          isLoading={saving}
          emptyMessage="No issue images uploaded yet."
          helperMessage="Upload up to 3 total issue images."
          maxAttachments={MAX_ATTACHMENTS}
        />

        {pendingAttachments.length > 0 && (
          <div className="mt-4 space-y-2">
            {pendingAttachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{attachment.file.name}</p>
                  <p className="text-xs text-slate-500">{(attachment.file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingAttachments((prev) => prev.filter((item) => item.id !== attachment.id))}
                  className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 border-t border-gray-200 pt-8">
        <button
          type="button"
          onClick={() => onCancel?.()}
          className="flex-1 rounded-xl border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white transition hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
