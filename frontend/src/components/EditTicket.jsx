import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function EditTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  
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
        navigate(`/tickets/${id}`);
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
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Required Information */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Resource ID */}
          <div className="md:col-span-2">
            <label className="block text-gray-900 font-semibold mb-2">Resource Location *</label>
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

          {/* Category */}
          <div>
            <label className="block text-gray-900 font-semibold mb-2">Category *</label>
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

          {/* Building & Room */}
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

      {/* Priority */}
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

      {/* Optional Fields */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

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

      {/* Buttons */}
      <div className="border-t pt-6 flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {saving ? '⏳ Saving...' : '💾 Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => navigate(`/tickets/${id}`)}
          className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          ✕ Cancel
        </button>
      </div>
    </form>
  );
}
