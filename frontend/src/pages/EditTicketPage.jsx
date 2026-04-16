import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bell, User, Settings, LogOut } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import EditTicket from '../components/EditTicket';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/SidebarContext';
import campusLogo from '../assets/campus-logo.png';

export default function EditTicketPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('tickets');
  const { user, logout } = useAuth();
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isStudent = user?.role === 'USER';

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
                  <p className="text-xs text-blue-600 font-medium">Edit Ticket #{id}</p>
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

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName || ''}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
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
          <EditTicket 
            ticketId={id}
            onCancel={() => navigate('/student-tickets')}
          />
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
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <TopBar user={user} />

        {/* Blue Header Section - Full Width */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white break-words">
            Edit Maintenance Ticket #{id}
          </h1>
          <p className="text-blue-100 mt-1">Update ticket details and information</p>
        </div>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <button
            onClick={() => navigate('/tickets')}
            className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            ← Back to Tickets
          </button>
          <div className="max-w-4xl bg-white rounded-lg shadow-lg p-8">
            <EditTicket ticketId={id} />
          </div>
        </main>
      </div>
    </div>
  );
}
