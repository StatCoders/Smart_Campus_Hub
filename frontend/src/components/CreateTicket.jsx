import React, { useState } from 'react';
import { createTicket } from '../services/ticketService';
import { uploadMultipleAttachments } from '../services/fileUploadService';

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

export default function CreateTicket({ onSuccess }) {
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
  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchResource, setSearchResource] = useState('');
  const [showResourceDropdown, setShowResourceDropdown] = useState(false);

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
    if (!files?.length) {
      return;
    }

    const availableSlots = Math.max(MAX_ATTACHMENTS - attachments.length, 0);
    const nextFiles = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, availableSlots)
      .map((file) => ({ file, id: Math.random() }));

    setAttachments((prev) => [...prev, ...nextFiles]);
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    appendFiles(event.dataTransfer.files);
  };

  const handleFileInput = (event) => {
    appendFiles(event.target.files);
  };

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
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

      const createdTicket = await createTicket({
        resourceId: formData.resourceId,
        category: formData.category,
        description: formData.description,
        priority: formData.priority,
        building: formData.building || null,
        roomNumber: formData.roomNumber || null,
        expectedDate: formData.expectedDate || null,
        additionalNotes: formData.additionalNotes || null,
      });

      if (attachments.length > 0) {
        await uploadMultipleAttachments(attachments.map((attachment) => attachment.file), createdTicket.id, 'BEFORE');
      }

      setSuccess('Ticket created successfully.');
      setFormData({
        resourceId: '',
        category: '',
        building: '',
        roomNumber: '',
        description: '',
        priority: 'MEDIUM',
        expectedDate: '',
        additionalNotes: '',
      });
      setAttachments([]);
      setSearchResource('');

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl overflow-hidden rounded-2xl border border-sky-100/80 bg-white shadow-2xl">
      <div className="relative border-b border-sky-200/80 bg-gradient-to-br from-sky-100 via-blue-50 to-sky-50 px-8 py-8">
        <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-blue-300/10 blur-xl" />
        <div className="absolute -bottom-12 -left-12 h-24 w-24 rounded-full bg-sky-300/10 blur-lg" />

        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-700" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Report Issue</p>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-slate-950">Report an Issue</h1>
          <p className="font-medium text-slate-600">Describe the problem and we&apos;ll prioritize it for resolution</p>
        </div>
      </div>

      <div className="p-8">
        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <div>{error}</div>
          </div>
        ) : null}

        {success ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
            <div>{success}</div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span className="text-blue-700">*</span> Required Information
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block font-semibold text-slate-900">Resource Location *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search or select resource (e.g., FAC-ENG-101)"
                    value={searchResource}
                    onChange={(event) => {
                      setSearchResource(event.target.value);
                      setShowResourceDropdown(true);
                    }}
                    onFocus={() => setShowResourceDropdown(true)}
                    className="w-full rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 shadow-sm transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {showResourceDropdown && (
                    <div className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-sky-100 bg-white shadow-lg">
                      {filteredResources.length > 0 ? (
                        filteredResources.map((resource) => (
                          <button
                            key={resource.id}
                            type="button"
                            onClick={() => handleResourceSelect(resource)}
                            className="w-full border-b border-sky-50 px-4 py-3 text-left transition-colors hover:bg-sky-50 last:border-b-0"
                          >
                            <div className="font-medium text-slate-900">{resource.id}</div>
                            <div className="text-sm text-slate-500">{resource.label.split(' - ')[1]}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-slate-500">No resources found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-900">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 shadow-sm transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block font-semibold text-slate-900">Building</label>
                  <input
                    type="text"
                    name="building"
                    placeholder="e.g., Block A"
                    value={formData.building}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 shadow-sm transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-semibold text-slate-900">Room</label>
                  <input
                    type="text"
                    name="roomNumber"
                    placeholder="e.g., 101"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 shadow-sm transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block font-semibold text-slate-900">
              Description * <span className="text-sm font-normal text-slate-500">({formData.description.length}/1000)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
              maxLength="1000"
              rows="5"
              className="w-full resize-none rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 shadow-sm transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-3 block font-semibold text-slate-900">Priority *</label>
            <div className="flex flex-wrap gap-3">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePriorityChange(option.value)}
                  className={`rounded-lg border-2 px-4 py-2 font-medium transition-all ${
                    formData.priority === option.value
                      ? `${option.color} border-current ring-2 ring-current ring-offset-2 shadow-md`
                      : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-blue-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-sky-100 pt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span className="text-slate-300">o</span> Additional Information (Optional)
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-semibold text-slate-900">Expected Completion Date</label>
                <input
                  type="date"
                  name="expectedDate"
                  value={formData.expectedDate}
                  onChange={handleChange}
                  min={todayString}
                  className="w-full rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 shadow-sm transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div />
            </div>

            <div className="mt-6">
              <label className="mb-2 block font-semibold text-slate-900">
                Additional Notes <span className="text-sm font-normal text-slate-500">({formData.additionalNotes.length}/500)</span>
              </label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                placeholder="Any additional information..."
                maxLength="500"
                rows="3"
                className="w-full resize-none rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 shadow-sm transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-sky-100 pt-8">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Attachments (Optional)</h2>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                dragActive ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-sky-200 bg-sky-50/50 hover:border-sky-300'
              }`}
            >
              <input
                type="file"
                id="file-input"
                multiple
                onChange={handleFileInput}
                className="hidden"
                accept="image/*"
              />
              <label htmlFor="file-input" className="block cursor-pointer">
                <div className="mb-2 text-4xl">+</div>
                <p className="mb-1 font-semibold text-slate-900">Drag and drop images here</p>
                <p className="text-sm text-slate-500">or click to browse (Max 3 images)</p>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/50 p-3 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">+</span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{attachment.file.name}</p>
                        <p className="text-xs text-slate-500">{(attachment.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="font-bold text-red-600 transition-colors hover:text-red-700"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-sky-100 pt-8">
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl px-6 py-4 text-lg font-bold text-white transition-all ${
                loading
                  ? 'cursor-not-allowed bg-slate-400'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:-translate-y-0.5 hover:from-blue-500 hover:to-blue-600 hover:shadow-lg active:translate-y-0'
              }`}
            >
              {loading ? 'Creating Ticket...' : 'Create Maintenance Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
