import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import NotificationDropdown from './NotificationDropdown';
import UserMenu from './UserMenu';
import campusLogo from '../assets/campus-logo.png';
import { normalizeRole } from '../utils/roleRedirect';

export default function TopBar({ user }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { logout } = useAuth();
  const { toggleMobile } = useSidebar();
  const navigate = useNavigate();

  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Operations User';
  const initials = `${user?.firstName?.[0] || 'O'}${user?.lastName?.[0] || 'U'}`.toUpperCase();
  
  const roleDisplay = normalizeRole(user?.role) || 'USER';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-sky-100/80 bg-white/85 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMobile}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <img src={campusLogo} alt="Campus Logo" className="h-10 w-10" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Winterfall Northern University</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <NotificationDropdown
            userId={user?.id}
            isAdmin={user?.role === 'ADMIN'}
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onToggle={() => {
              setShowNotifications((current) => !current);
              setShowUserMenu(false);
            }}
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu((current) => !current);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-sky-200 hover:bg-sky-50"
            >
              <div>
                <p className="max-w-32 truncate text-sm font-semibold text-slate-950 sm:max-w-none">{displayName}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{roleDisplay}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#38BDF8] text-sm font-bold text-white">
                {initials}
              </div>
            </button>

            <UserMenu
              user={user}
              isOpen={showUserMenu}
              onClose={() => setShowUserMenu(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
