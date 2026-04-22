import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Package,
  Ticket,
  Users,
  X,
} from 'lucide-react';
import { useSidebar } from '../context/useSidebar';
import { useAuth } from '../context/useAuth';
import campusLogo from '../assets/campus-logo.png';
import { getDefaultRouteForRole } from '../utils/roleRedirect';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } = useSidebar();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'resources', label: 'Facilities', Icon: Package },
    { id: 'bookings', label: 'Bookings', Icon: CalendarDays },
    { id: 'tickets', label: 'Maintenance', Icon: Ticket },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
  ];

  // Add Manage Users for admins only
  if (user?.role === 'ADMIN') {
    menuItems.splice(4, 0, { id: 'manage-users', label: 'Manage Users', Icon: Users });
  }

  const handleNavigation = (itemId) => {
    setActiveTab(itemId);
    closeMobile();

    switch (itemId) {
      case 'dashboard':
        navigate(getDefaultRouteForRole(user?.role));
        break;
      case 'tickets':
        navigate('/tickets');
        break;
      case 'resources':
        navigate('/facilities');
        break;
      case 'bookings':
        navigate('/bookings');
        break;
      case 'manage-users':
        navigate('/manage-users');
        break;
      case 'notifications':
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div
        onClick={closeMobile}
        className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm transition lg:hidden ${
          isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-white/10 bg-gradient-to-b from-[#0F172A] via-[#0B245A] to-[#1E40AF] text-slate-100 shadow-2xl transition-all duration-300 ease-out ${
          isCollapsed ? 'lg:w-24' : 'lg:w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} w-[18.5rem] lg:translate-x-0`}
      >
        <div className={`border-b border-white/10 p-5 ${isCollapsed ? 'lg:px-4' : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
              <img src={campusLogo} alt="Winterfall Northern University" className="h-11 w-11 rounded-2xl shadow-lg shadow-slate-950/20" />
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100/75">
                    Winterfall Northern
                  </p>
                  <h1 className="truncate text-lg font-semibold text-white">University</h1>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={closeMobile}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-slate-200 transition hover:bg-white/10 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-6">
          {menuItems.map((item) => {
            const { Icon } = item;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-lg shadow-slate-950/20'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className={`border-t border-white/10 p-4 ${isCollapsed ? 'lg:flex lg:justify-center' : ''}`}>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`hidden items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10 lg:flex ${
              isCollapsed ? 'h-11 w-11 p-0' : 'w-full gap-2 px-4 py-3'
            }`}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
