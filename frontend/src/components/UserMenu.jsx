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

  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || 'U'}`.toUpperCase();

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
      className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-[28px] border border-sky-100 bg-white shadow-[0_30px_70px_-35px_rgba(15,23,42,0.55)]"
    >
      <div className="border-b border-sky-100 bg-gradient-to-br from-[#0F172A] to-[#1E40AF] px-6 py-6 text-white">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold text-white">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-sky-100/75">{user?.email || 'user@university.edu'}</p>
          </div>
        </div>

        <div>
          <span
            className={`inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide ${getRoleBadgeColor(
              user?.role
            )}`}
          >
            {user?.role || 'USER'}
          </span>
        </div>
      </div>

      <div className="py-1">
        <button
          onClick={onClose}
          className="group flex w-full items-center gap-3 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-sky-50"
        >
          <User className="h-5 w-5 text-slate-400 group-hover:text-blue-700" />
          <span>Your Profile</span>
        </button>

        <button
          onClick={onClose}
          className="group flex w-full items-center gap-3 px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-sky-50"
        >
          <Settings className="h-5 w-5 text-slate-400 group-hover:text-blue-700" />
          <span>Settings</span>
        </button>

        <div className="my-1 border-t border-sky-100"></div>

        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-3 px-6 py-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
        >
          <ArrowRight className="h-5 w-5 text-rose-400 group-hover:text-rose-600" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
