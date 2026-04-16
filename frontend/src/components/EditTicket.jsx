import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getTicketById, updateTicket } from '../services/ticketService';

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

export default function EditTicket({ ticketId, onSuccess, onCancel }) {
  const id = ticketId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStudent = user?.role === 'USER';
  
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchResource, setSearchResource] = useState('');
  const [showResourceDropdown, setShowResourceDropdown] = useState(false);

  const fetchTicketData = useCallback(async () => {
    try {
      const ticket = await getTicketById(id);
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
      setLoading(false);
    } catch {
      setError('Failed to load ticket');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicketData();
  }, [fetchTicketData]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.resourceId.trim()) {
        setError('Resource ID is required');
        setSaving(false);
        return;
      }
      if (!formData.category.trim()) {
        setError('Category is required');
        setSaving(false);
        return;
      }
      if (!formData.description.trim()) {
        setError('Description is required');
        setSaving(false);
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

      await updateTicket(id, ticketData);
      setSuccess('✓ Ticket updated successfully!');
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          const redirectPath = isStudent ? '/student-tickets' : `/tickets/${id}`;
          navigate(redirectPath);
        }
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-gray-600">⏳ Loading ticket...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* Error & Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-start gap-3">
          <span className="text-lg mt-0.5">⚠️</span>
          <div className="font-medium">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg flex items-start gap-3">
          <span className="text-lg mt-0.5">✓</span>
          <div className="font-medium">{success}</div>
        </div>
      )}

      {/* Section 1: Location & Resource */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">1</div>
          Resource Location
        </h3>
        
        <div className="space-y-5">
          {/* Resource ID - Full Width */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Resource Location *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search facility (e.g., FAC-ENG-101)"
                value={searchResource}
                onChange={(e) => {
                  setSearchResource(e.target.value);
                  setShowResourceDropdown(true);
                }}
                onFocus={() => setShowResourceDropdown(true)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              {showResourceDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredResources.length > 0 ? (
                    filteredResources.map(resource => (
                      <button
                        key={resource.id}
                        type="button"
                        onClick={() => handleResourceSelect(resource)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{resource.id}</div>
                        <div className="text-sm text-gray-500">{resource.label.split(' - ')[1]}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center text-sm">No resources found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Building & Room - Two Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Building</label>
              <input
                type="text"
                name="building"
                value={formData.building}
                onChange={handleChange}
                placeholder="e.g., Block A"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Room</label>
              <input
                type="text"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                placeholder="e.g., 101"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Issue Details */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">2</div>
          Issue Details
        </h3>

        <div className="space-y-5">
          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            >
              <option value="">Select category...</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              required
            />
          </div>
        </div>
      </div>

      {/* Section 3: Priority & Timeline */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">3</div>
          Priority & Timeline
        </h3>

        <div className="space-y-6">
          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-4">Priority Level *</label>
            <div className="flex flex-wrap gap-3">
              {PRIORITY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePriorityChange(option.value)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    formData.priority === option.value
                      ? `${option.color} ring-2 ring-offset-2 ring-current`
                      : `bg-gray-100 text-gray-700 hover:bg-gray-200`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Expected Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Expected Completion Date</label>
            <input
              type="date"
              name="expectedDate"
              value={formData.expectedDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Notes */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">4</div>
          Additional Notes
        </h3>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Notes <span className="text-xs font-normal text-gray-500">({formData.additionalNotes.length}/500)</span>
          </label>
          <textarea
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleChange}
            placeholder="Any additional information..."
            maxLength="500"
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-8 border-t border-gray-200">
        <button
          type="button"
          onClick={() => {
            if (onCancel) {
              onCancel();
            }
          }}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-xl transition"
        >
          {saving ? '⏳ Saving...' : '💾 Save Changes'}
        </button>
      </div>
    </form>
  );
}
