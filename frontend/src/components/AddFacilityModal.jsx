import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFacility, updateFacility, uploadImage } from '../services/facilityService';

export default function AddFacilityModal({ isOpen, onClose, facilityToEdit, onSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'LECTURE_HALL',
    capacity: '',
    building: '',
    floor: '',
    status: 'ACTIVE',
    features: '',
    imageUrl: '',
    availabilityWindows: '',
    imagePath: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (facilityToEdit) {
      setFormData({
        name: facilityToEdit.name || '',
        type: facilityToEdit.type || 'LECTURE_HALL',
        capacity: facilityToEdit.capacity || '',
        building: facilityToEdit.building || '',
        floor: facilityToEdit.floor || '',
        status: facilityToEdit.status || 'ACTIVE',
        features: Array.isArray(facilityToEdit.features) ? facilityToEdit.features.join(', ') : '',
        imageUrl: facilityToEdit.imageUrl || '',
        availabilityWindows: facilityToEdit.availabilityWindows || '',
        imagePath: facilityToEdit.imagePath || ''
      });
      // Set image preview for editing
      if (facilityToEdit.imagePath) {
        setImagePreview(`/uploads/${facilityToEdit.imagePath}`);
      } else if (facilityToEdit.imageUrl) {
        setImagePreview(facilityToEdit.imageUrl);
      }
    } else {
      // Reset for new facility
      setImagePreview('');
      setSelectedFile(null);
    }
  }, [facilityToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError('');
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const uploadSelectedImage = async () => {
    if (!selectedFile) {
      setError('No file selected');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const result = await uploadImage(selectedFile);
      setFormData(prev => ({ 
        ...prev, 
        imagePath: result.filename 
      }));
      setSelectedFile(null);
      // Keep preview showing
    } catch (err) {
      setError(err.message || 'Failed to upload image');
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImagePreview('');
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, imagePath: '', imageUrl: '' }));
  };

  const isEquipment = formData.type === 'EQUIPMENT';

  const validateForm = () => {
    if (!formData.name.trim()) return 'Facility name is required';
    if (!isEquipment && (!formData.capacity || formData.capacity <= 0)) return 'Capacity must be greater than 0';
    if (!formData.building.trim()) return 'Building is required';
    if (!formData.floor.trim()) return 'Floor is required';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // If file is selected but not uploaded yet, upload it first
    if (selectedFile && !formData.imagePath) {
      setError('Please upload the selected image first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submissionData = {
        name: formData.name.trim(),
        type: formData.type,
        capacity: isEquipment ? 0 : (formData.capacity ? parseInt(formData.capacity) : 0),
        building: formData.building.trim(),
        floor: formData.floor.trim(),
        status: formData.status,
        features: formData.features
          ? formData.features.split(',').map(f => f.trim()).filter(f => f)
          : [],
        imageUrl: formData.imageUrl.trim() || null,
        availabilityWindows: formData.availabilityWindows.trim() || null,
        imagePath: formData.imagePath || null
      };

      if (facilityToEdit) {
        await updateFacility(facilityToEdit.id, submissionData);
        onSuccess?.();
        onClose();
      } else {
        const newFacility = await createFacility(submissionData);
        setFormData({
          name: '',
          type: 'LECTURE_HALL',
          capacity: '',
          building: '',
          floor: '',
          status: 'ACTIVE',
          features: '',
          imageUrl: '',
          availabilityWindows: '',
          imagePath: ''
        });
        setImagePreview('');
        setSelectedFile(null);
        // Call onSuccess with new facility and close modal
        onSuccess?.(newFacility);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to save facility');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              {facilityToEdit ? 'Edit Facility' : 'Add New Facility'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Row 1: Name & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Facility Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Physics Lab 101"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="LECTURE_HALL">Lecture Hall</option>
                <option value="LAB">Lab</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="EQUIPMENT">Equipment</option>
              </select>
            </div>
          </div>

          {/* Row 2: Capacity & Building - Capacity hidden for Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isEquipment && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Capacity *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="e.g., 50"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Building *
              </label>
              <input
                type="text"
                name="building"
                value={formData.building}
                onChange={handleChange}
                placeholder="e.g., Science Building"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Row 3: Floor & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Floor *
              </label>
              <input
                type="text"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                placeholder="e.g., Ground Floor"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="ACTIVE">Active</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>
          </div>

          {/* Info for Equipment Type */}
          {isEquipment && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 For equipment, Capacity field is optional. Building and Floor are still required.
              </p>
            </div>
          )}

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Features (comma-separated)
            </label>
            <input
              type="text"
              name="features"
              value={formData.features}
              onChange={handleChange}
              placeholder="e.g., Projector, Whiteboard, Wi-Fi"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">Enter features separated by commas</p>
          </div>

          {/* Availability Windows */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Availability (e.g., Mon-Fri: 08:00-18:00)
            </label>
            <input
              type="text"
              name="availabilityWindows"
              value={formData.availabilityWindows}
              onChange={handleChange}
              placeholder="e.g., Mon-Fri: 08:00-18:00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Image (Optional)
            </label>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-4 relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="file"
                id="file-input"
                onChange={handleFileInput}
                accept="image/*"
                className="hidden"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="text-4xl mb-2">📁</div>
                <p className="text-sm font-medium text-gray-900">
                  Drag and drop your image here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to select (Max 10MB, JPG/PNG/GIF/WebP)
                </p>
              </label>
            </div>

            {/* Upload Button (shown when file is selected) */}
            {selectedFile && !formData.imagePath && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={uploadSelectedImage}
                  disabled={uploading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview('');
                  }}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Success Message */}
            {formData.imagePath && !selectedFile && (
              <div className="mt-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                ✓ Image uploaded successfully
              </div>
            )}

            {/* Alternative: URL Input */}
            <div className="mt-4 border-t pt-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Or paste Image URL (Optional)
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                disabled={!!formData.imagePath}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-100"
              />
              <p className="text-sm text-gray-500 mt-1">
                💡 Use free image sites: Unsplash, Pixabay, or Imgur
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              {loading ? 'Saving...' : facilityToEdit ? 'Update Facility' : 'Create Facility'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
