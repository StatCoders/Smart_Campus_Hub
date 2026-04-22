import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';

const EditUserModal = ({ isOpen, user, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'USER',
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const ROLES = ['USER', 'ADMIN', 'STAFF', 'TECHNICIAN'];

  // Pre-fill form when user is provided
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        role: user.role || 'USER',
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
      setErrors({});
    }
  }, [user, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName || formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName || formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      newErrors.phoneNumber = 'Phone number must be at least 10 digits';
    } else if (!/^\d+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must contain only digits';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-950">Edit User</h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email (Read-only)
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-600 outline-none cursor-not-allowed"
            />
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600 ${
                errors.firstName ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600 ${
                errors.lastName ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600 ${
                errors.phoneNumber ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="1234567890"
            />
            {errors.phoneNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`w-full rounded-lg border px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600 ${
                errors.role ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-xs text-red-500 mt-1">{errors.role}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                disabled={isLoading}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 cursor-pointer disabled:opacity-50"
              />
              <span className="text-sm font-medium text-slate-700">Active</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
