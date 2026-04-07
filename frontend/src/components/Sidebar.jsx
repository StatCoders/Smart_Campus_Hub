import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'resources', label: 'Resources', icon: '📦' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'tickets', label: 'Tickets', icon: '🎫' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  const handleNavigation = (itemId) => {
    setActiveTab(itemId);
    switch (itemId) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'tickets':
        navigate('/tickets');
        break;
      case 'resources':
      case 'bookings':
      case 'notifications':
        // Placeholder for other modules
        break;
      default:
        break;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🏛️</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Campus Hub</h1>
            <p className="text-xs text-gray-500">Operations</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
