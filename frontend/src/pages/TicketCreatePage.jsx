import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import CreateTicket from '../components/CreateTicket';
import UserMenu from '../components/UserMenu';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import campusLogo from '../assets/campus-logo.png';

export default function TicketCreatePage() {
  const [activeTab, setActiveTab] = useState('tickets');
  const { user, logout } = useAuth();
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isStudent = user?.role === 'USER';

  const handleSuccess = () => {
    setTimeout(() => navigate(isStudent ? '/student-tickets' : '/tickets'), 1500);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Student View
  if (isStudent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Navigation Header */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/98 backdrop-blur-lg shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Title */}
              <div className="flex items-center gap-3">
                <img src={campusLogo} alt="Winterfall Northern University" className="h-12 w-12" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Winterfall Northern University</h1>
                  <p className="text-xs text-blue-600 font-medium">Raise New Ticket</p>
                </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3 relative">
                <button className="p-2 hover:bg-blue-50 rounded-lg transition">
                  <Bell className="w-5 h-5 text-blue-600" />
                </button>

                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-lg transition"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                </button>

                <UserMenu 
                  user={user}
                  isOpen={isMenuOpen}
                  onClose={() => setIsMenuOpen(false)}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('/student-tickets')}
            className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Tickets
          </button>
          <CreateTicket onSuccess={handleSuccess} />
        </main>
      </div>
    );
  }

  // Admin View (existing layout)
  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <TopBar user={user} />

        {/* Content Area */}
        <main className="p-8">
          <div className="max-w-4xl">
            <button
              onClick={() => navigate('/tickets')}
              className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to Tickets
            </button>
            <CreateTicket onSuccess={handleSuccess} />
          </div>
        </main>
      </div>
    </div>
  );
}
