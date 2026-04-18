import React, { useState, useEffect } from 'react';
import { createFacility, updateFacility } from '../services/facilityService';

export default function AddFacilityModal({ isOpen, onClose, facilityToEdit, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'LECTURE_HALL',
    capacity: '',
    building: '',
    floor: '',
    status: 'ACTIVE',
    features: [],
    imageUrl: '',
    availabilityWindows: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [resourceNameInput, setResourceNameInput] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);

  useEffect(() => {
    if (facilityToEdit) {
      setFormData({
        name: facilityToEdit.name || '',
        type: facilityToEdit.type || 'LECTURE_HALL',
        capacity: facilityToEdit.capacity || '',
        building: facilityToEdit.building || '',
        floor: facilityToEdit.floor || '',
        status: facilityToEdit.status || 'ACTIVE',
        features: Array.isArray(facilityToEdit.features) ? facilityToEdit.features : [],
        imageUrl: facilityToEdit.imageUrl || '',
        availabilityWindows: facilityToEdit.availabilityWindows || ''
      });
      // Set image preview for editing
      if (facilityToEdit.imageUrl) {
        setImagePreview(facilityToEdit.imageUrl);
      }
    } else {
      // Reset for new facility
      setFormData({
        name: '',
        type: 'LECTURE_HALL',
        capacity: '',
        building: '',
        floor: '',
        status: 'ACTIVE',
        features: [],
        imageUrl: '',
        availabilityWindows: ''
      });
      setImagePreview('');
      setSelectedFile(null);
    }
    setResourceNameInput('');
    setError('');
    setShowSuccess(false);
    setProcessingImage(false);
  }, [facilityToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setShowSuccess(false);
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
    console.log('🔽 handleDrop called');
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    console.log('📦 Files in drop event:', files.length);
    if (files && files[0]) {
      console.log('✅ Processing first file:', files[0].name);
      handleFile(files[0]);
    } else {
      console.error('❌ No files found in drop event');
    }
  };

  const handleFile = (file) => {
    console.log('📁 handleFile called with:', file.name);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      const msg = 'Please select an image file (JPEG, PNG, GIF, WebP)';
      console.error('❌ Invalid file type:', file.type);
      setError(msg);
      return;
    }

    console.log('✅ File validation passed');
    setError('');
    setProcessingImage(true);
    setSelectedFile(file);
    
    // Convert to Base64 and auto-compress if needed
    const reader = new FileReader();
    
    reader.onload = (event) => {
      console.log('📚 FileReader onload triggered');
      const result = event.target.result;
      if (result) {
        // Image loaded, now compress if needed
        const img = new Image();
        img.onload = () => {
          console.log('🖼️ Image dimensions:', img.width, 'x', img.height);
          
          // Compress if image is large
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions: 1920x1080
          const maxWidth = 1920;
          const maxHeight = 1080;
          
          if (width > maxWidth || height > maxHeight) {
            console.log('📦 Compressing large image...');
            if (width > height) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            } else {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to Base64 with 75% quality compression
          const base64String = canvas.toDataURL('image/jpeg', 0.75);
          console.log('✅ Image compression complete!', {
            fileName: file.name,
            originalSize: file.size,
            originalDimensions: img.width + 'x' + img.height,
            compressedDimensions: width + 'x' + height,
            base64Size: base64String.length
          });
          
          console.log('🎨 Setting image preview...');
          setImagePreview(base64String);
          
          console.log('💾 Storing in form data...');
          setFormData(prev => {
            const updated = { 
              ...prev, 
              imageUrl: base64String
            };
            console.log('✅ Form data updated:', {
              hasImageUrl: !!updated.imageUrl,
              imageUrlLength: updated.imageUrl.length
            });
            return updated;
          });
          
          console.log('⏹️ Setting processing image to false...');
          setProcessingImage(false);
        };
        
        img.onerror = () => {
          console.error('❌ Failed to load image for compression');
          setError('Failed to process image');
          setSelectedFile(null);
          setImagePreview('');
          setProcessingImage(false);
        };
        
        img.src = result;
      } else {
        console.error('❌ No result from FileReader');
      }
    };
    
    reader.onerror = (err) => {
      console.error('❌ FileReader error:', err);
      setError('Failed to read image file: ' + err);
      setSelectedFile(null);
      setImagePreview('');
      setProcessingImage(false);
    };
    
    reader.onabort = () => {
      console.error('❌ FileReader abort');
      setError('Image reading was cancelled');
      setSelectedFile(null);
      setProcessingImage(false);
    };
    
    console.log('📖 Starting FileReader.readAsDataURL...');
    try {
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('❌ Error calling readAsDataURL:', err);
      setError('Error processing image: ' + err.message);
      setSelectedFile(null);
      setProcessingImage(false);
    }
  };

  const handleFileInput = (e) => {
    console.log('🖱️ handleFileInput called');
    const file = e.target.files?.[0];
    console.log('📄 Selected file:', file?.name);
    if (file) {
      handleFile(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };



  const clearImage = () => {
    setImagePreview('');
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setShowSuccess(false);
    setProcessingImage(false);
  };

  const addFeature = () => {
    const featureName = resourceNameInput.trim();
    if (!featureName) {
      setError('Please enter a feature name');
      return;
    }

    // Check for duplicates
    if (formData.features.some(f => f.toLowerCase() === featureName.toLowerCase())) {
      setError(`Feature "${featureName}" already exists`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      features: [...prev.features, featureName]
    }));

    setResourceNameInput('');
    setError('');
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Facility name is required';
    if (!formData.capacity || formData.capacity <= 0) return 'Capacity must be greater than 0';
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

    setLoading(true);
    setError('');
    setShowSuccess(false);

    try {
      const submissionData = {
        name: formData.name.trim(),
        type: formData.type,
        capacity: formData.capacity ? parseInt(formData.capacity) : 0,
        building: formData.building.trim(),
        floor: formData.floor.trim(),
        status: formData.status,
        features: formData.features || [],
        imageUrl: formData.imageUrl || null,
        availabilityWindows: formData.availabilityWindows.trim() || null
      };

      // Debug log
      console.log('Submitting facility:', {
        name: submissionData.name,
        hasImage: !!submissionData.imageUrl,
        imageSize: submissionData.imageUrl ? submissionData.imageUrl.length : 0
      });

      if (facilityToEdit) {
        await updateFacility(facilityToEdit.id, submissionData);
        setShowSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        const newFacility = await createFacility(submissionData);
        setShowSuccess(true);
        setTimeout(() => {
          setFormData({
            name: '',
            type: 'LECTURE_HALL',
            capacity: '',
            building: '',
            floor: '',
            status: 'ACTIVE',
            features: [],
            imageUrl: '',
            availabilityWindows: ''
          });
          setImagePreview('');
          setSelectedFile(null);
          setShowSuccess(false);
          // Call onSuccess with new facility and close modal
          onSuccess?.(newFacility);
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to save facility');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Debug logging on every render
  console.log('🎭 Modal render - State:', {
    isOpen,
    imagePreview: !!imagePreview ? `(${imagePreview.length} chars)` : 'empty',
    processingImage,
    selectedFile: selectedFile?.name,
    formDataImageUrl: !!formData.imageUrl ? `(${formData.imageUrl.length} chars)` : 'empty'
  });

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
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
          {showSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded animate-pulse">
              ✓ Update successful!
            </div>
          )}
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

          {/* Row 2: Capacity & Building */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Features Management */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Features/Equipment
            </label>
            <div className="space-y-3">
              {/* Feature Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={resourceNameInput}
                  onChange={(e) => setResourceNameInput(e.target.value)}
                  placeholder="e.g., Projector, Whiteboard, Microphone"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  + Add
                </button>
              </div>

              {/* Features List */}
              {formData.features.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Added Features:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {formData.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-200"
                      >
                        <p className="font-semibold text-gray-900">{feature}</p>
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
            {(imagePreview || processingImage) && (
              <div className="mb-4">
                {processingImage ? (
                  <div className="relative h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Processing image: {selectedFile?.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
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
                  or click to select
                </p>
              </label>
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
