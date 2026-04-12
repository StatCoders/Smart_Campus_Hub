import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import UserMenu from './UserMenu';

export default function TopBar({ user }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search resources, bookings, tickets..."
              className="w-full px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6 ml-8">
          {/* Notifications Button */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-gray-600 hover:text-gray-900"
          >
            <span className="text-2xl">🔔</span>
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          </button>

        {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 pl-6 border-l border-gray-200 hover:opacity-75 transition-opacity"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 uppercase">{user?.role || 'USER'}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.firstName?.charAt(0)}
              </div>
            </button>

            {/* User Menu Dropdown */}
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
