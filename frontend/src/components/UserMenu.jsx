import React, { useRef, useEffect } from 'react';
import { User, Settings, ArrowRight } from 'lucide-react';

export default function UserMenu({ user, isOpen, onClose, onLogout }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Generate avatar initials
  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || 'U'}`.toUpperCase();

  // Get role badge color based on role
  const getRoleBadgeColor = (role) => {
    const roleMap = {
      ADMIN: 'bg-purple-100 text-purple-700',
      TECHNICIAN: 'bg-blue-100 text-blue-700',
      STUDENT: 'bg-green-100 text-green-700',
      STAFF: 'bg-orange-100 text-orange-700',
    };
    return roleMap[role?.toUpperCase()] || 'bg-blue-100 text-blue-700';
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden"
    >
      {/* User Profile Section */}
      <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {initials}
          </div>

          {/* Name and Email */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'user@university.edu'}
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <div>
          <span className={`inline-block px-4 py-1.5 ${getRoleBadgeColor(user?.role)} text-xs font-semibold rounded-full uppercase tracking-wide`}>
            {user?.role || 'USER'}
          </span>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        {/* Your Profile */}
        <button
          onClick={onClose}
          className="w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium group"
        >
          <User className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          <span>Your Profile</span>
        </button>

        {/* Settings */}
        <button
          onClick={onClose}
          className="w-full flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium group"
        >
          <Settings className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          <span>Settings</span>
        </button>

        {/* Divider */}
        <div className="my-1 border-t border-gray-200"></div>

        {/* Sign Out */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-6 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium group"
        >
          <ArrowRight className="w-5 h-5 text-red-400 group-hover:text-red-600" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
