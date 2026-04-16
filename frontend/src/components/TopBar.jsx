import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, PanelLeft, PanelLeftClose } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/SidebarContext';
import UserMenu from './UserMenu';
import campusLogo from '../assets/campus-logo.png';

export default function TopBar({ user }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { logout } = useAuth();
  const { isCollapsed, toggleCollapsed, toggleMobile } = useSidebar();
  const navigate = useNavigate();

  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Operations User';
  const initials = `${user?.firstName?.[0] || 'O'}${user?.lastName?.[0] || 'U'}`.toUpperCase();

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

          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 lg:inline-flex"
          >
            {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>

          <img src={campusLogo} alt="Campus Logo" className="h-10 w-10" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Winterfall Northern University</p>
            <p className="text-sm text-slate-500">Live monitoring for maintenance and incidents</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-sky-500" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:inline-flex"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu((current) => !current)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-sky-200 hover:bg-sky-50"
            >
              <div>
                <p className="max-w-32 truncate text-sm font-semibold text-slate-950 sm:max-w-none">{displayName}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{user?.role || 'USER'}</p>
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
