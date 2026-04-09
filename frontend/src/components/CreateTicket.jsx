import React, { useState } from 'react';
import { createTicket } from '../services/ticketService';

// Sample resource IDs for searchable dropdown
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

export default function CreateTicket({ onSuccess }) {
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

  const filteredResources = RESOURCE_OPTIONS.filter(r =>
    r.id.toLowerCase().includes(searchResource.toLowerCase()) ||
    r.label.toLowerCase().includes(searchResource.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePriorityChange = (priority) => {
    setFormData(prev => ({
      ...prev,
      priority
    }));
  };

  const handleResourceSelect = (resource) => {
    setFormData(prev => ({
      ...prev,
      resourceId: resource.id
    }));
    setSearchResource(resource.id);
    setShowResourceDropdown(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).slice(0, 5 - attachments.length);
      setAttachments(prev => [...prev, ...newFiles.map(f => ({ file: f, id: Math.random() }))]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).slice(0, 5 - attachments.length);
      setAttachments(prev => [...prev, ...newFiles.map(f => ({ file: f, id: Math.random() }))]);
    }
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.resourceId.trim()) {
        setError('Resource ID is required');
        setLoading(false);
        return;
      }
      if (!formData.category.trim()) {
        setError('Category is required');
        setLoading(false);
        return;
      }
      if (!formData.description.trim()) {
        setError('Description is required');
        setLoading(false);
        return;
      }

      const ticketData = {
        resourceId: formData.resourceId,
        category: formData.category,
        description: formData.description,
        priority: formData.priority,
        building: formData.building || null,
        roomNumber: formData.roomNumber || null,
        expectedDate: formData.expectedDate || null,
        additionalNotes: formData.additionalNotes || null,
      };

      await createTicket(ticketData);
      setSuccess('✓ Ticket created successfully!');
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
    <div className="max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Maintenance Ticket</h1>
        <p className="text-indigo-100">Report an issue or request maintenance for campus facilities</p>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-3">
            <span className="text-lg">✓</span>
            <div>{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Required Fields Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-indigo-600">★</span> Required Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resource ID - Searchable Dropdown */}
              <div className="md:col-span-2">
                <label className="block text-gray-900 font-semibold mb-2">
                  Resource Location *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search or select resource (e.g., FAC-ENG-101)"
                    value={searchResource}
                    onChange={(e) => {
                      setSearchResource(e.target.value);
                      setShowResourceDropdown(true);
                    }}
                    onFocus={() => setShowResourceDropdown(true)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {showResourceDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredResources.length > 0 ? (
                        filteredResources.map(resource => (
                          <button
                            key={resource.id}
                            type="button"
                            onClick={() => handleResourceSelect(resource)}
                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-gray-900">{resource.id}</div>
                            <div className="text-sm text-gray-500">{resource.label.split(' - ')[1]}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">No resources found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Category - Dropdown */}
              <div>
                <label className="block text-gray-900 font-semibold mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Building / Room Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Building</label>
                  <input
                    type="text"
                    name="building"
                    placeholder="e.g., Block A"
                    value={formData.building}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-900 font-semibold mb-2">Room</label>
                  <input
                    type="text"
                    name="roomNumber"
                    placeholder="e.g., 101"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-900 font-semibold mb-2">
              Description * <span className="text-sm font-normal text-gray-500">({formData.description.length}/1000)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
              maxLength="1000"
              rows="5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Priority - Chips */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">Priority *</label>
            <div className="flex flex-wrap gap-3">
              {PRIORITY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePriorityChange(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium border-2 transition-all ${
                    formData.priority === option.value
                      ? `${option.color} border-current ring-2 ring-offset-2 ring-current`
                      : `bg-gray-100 text-gray-700 border-gray-300 hover:border-indigo-300`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-gray-400">○</span> Additional Information (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expected Completion Date */}
              <div>
                <label className="block text-gray-900 font-semibold mb-2">Expected Completion Date</label>
                <input
                  type="date"
                  name="expectedDate"
                  value={formData.expectedDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Placeholder for future fields */}
              <div />
            </div>

            {/* Additional Notes */}
            <div className="mt-6">
              <label className="block text-gray-900 font-semibold mb-2">
                Additional Notes <span className="text-sm font-normal text-gray-500">({formData.additionalNotes.length}/500)</span>
              </label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                placeholder="Any additional information..."
                maxLength="500"
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* File Attachments */}
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments (Optional)</h2>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
              }`}
            >
              <input
                type="file"
                id="file-input"
                multiple
                onChange={handleFileInput}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <div className="text-4xl mb-2">📎</div>
                <p className="text-gray-900 font-semibold mb-1">Drag & drop files here</p>
                <p className="text-gray-500 text-sm">or click to browse (Max 5 files)</p>
              </label>
            </div>

            {/* Attached Files List */}
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📄</span>
                      <div>
                        <p className="text-gray-900 font-medium text-sm">{att.file.name}</p>
                        <p className="text-gray-500 text-xs">{(att.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="text-red-600 hover:text-red-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="border-t pt-8">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-lg font-bold text-white text-lg transition-all transform ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Creating Ticket...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>✓</span> Create Maintenance Ticket
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

