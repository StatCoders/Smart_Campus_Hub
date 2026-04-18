import React, { useEffect, useRef } from 'react';
import { ArrowRight, Settings, User } from 'lucide-react';

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

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-semibold text-gray-900">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-xs text-gray-500">{user?.email || 'user@university.edu'}</p>
        <div className="mt-2">
          <span className="inline-block rounded px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100">
            {user?.role || 'USER'}
          </span>
        </div>
      </div>

      <div className="py-1">
        <button
          onClick={onClose}
          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <User className="h-4 w-4 text-gray-600" />
          <span>Your Profile</span>
        </button>

        <button
          onClick={onClose}
          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Settings className="h-4 w-4 text-gray-600" />
          <span>Settings</span>
        </button>

        <div className="border-t border-gray-100 my-1"></div>

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <ArrowRight className="h-4 w-4 text-red-600" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
