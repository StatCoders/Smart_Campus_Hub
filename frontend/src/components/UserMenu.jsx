import React, { useEffect, useRef } from 'react';
import { ArrowRight, Settings, User } from 'lucide-react';
import { normalizeRole } from '../utils/roleRedirect';

export default function UserMenu({ user, isOpen, onClose, onLogout }) {
  const menuRef = useRef(null);
  const role = normalizeRole(user?.role);
  const isAdminOrTech = role === 'ADMIN' || role === 'TECHNICIAN';

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

  // Admin/Technician Theme
  if (isAdminOrTech) {
    return (
      <div
        ref={menuRef}
        className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100"
      >
        {/* Premium Dark Blue Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 border-b border-slate-700/50">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-slate-700/50 flex items-center justify-center text-white font-bold text-sm">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-white tracking-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-300 mt-0.5">{user?.email || 'admin@smartcampus.local'}</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-block rounded-full px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-md">
                {role || 'USER'}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          <button
            onClick={onClose}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Your Profile</span>
          </button>

          <button
            onClick={onClose}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Settings</span>
          </button>

          <div className="border-t border-gray-100 my-1"></div>

          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <ArrowRight className="h-4 w-4 text-red-600" />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </div>
    );
  }

  // Student/Staff Theme (Simple)
  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md"
    >
      {/* Simple Header Section */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{user?.email || 'user@university.edu'}</p>
        <div className="mt-2.5">
          <span className="inline-block rounded px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100">
            {role || 'USER'}
          </span>
        </div>
      </div>

      {/* Menu Items */}
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
