import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid3x3, Package, Calendar, Ticket, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const { isCollapsed, toggleCollapsed } = useSidebar();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: Grid3x3 },
    { id: 'resources', label: 'Resources', Icon: Package },
    { id: 'bookings', label: 'Bookings', Icon: Calendar },
    { id: 'tickets', label: 'Tickets', Icon: Ticket },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
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
        navigate('/facilities');
        break;
      case 'bookings':
      case 'notifications':
        // Placeholder for other modules
        break;
      default:
        break;
    }
  };

  return (
    <aside
      className={`bg-white shadow-lg h-screen fixed left-0 top-0 flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-24' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className={`p-6 border-b ${isCollapsed ? 'flex justify-center' : ''}`}>
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">🎓</span>
          </div>
          {!isCollapsed && (
            <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">Campus Hub</h1>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const { Icon } = item;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors relative ${
                isActive
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-100'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-lg"></div>
              )}
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className={isActive ? 'text-indigo-700' : 'text-gray-700'}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse/Expand Button */}
      <div className={`p-4 border-t ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={toggleCollapsed}
          className={`flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors ${
            isCollapsed ? 'w-10 h-10 p-0' : 'w-full px-4 py-2'
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
