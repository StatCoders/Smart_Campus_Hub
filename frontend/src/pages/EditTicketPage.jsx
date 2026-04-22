import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bell, LogOut } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TechnicianMaintenanceSidebar from '../components/TechnicianMaintenanceSidebar';
import TopBar from '../components/TopBar';
import EditTicket from '../components/EditTicket';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/useSidebar';
import campusLogo from '../assets/campus-logo.png';

export default function EditTicketPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('tickets');
  const { user, logout } = useAuth();
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isStudent = user?.role === 'USER';
  const isTechnician = user?.role === 'TECHNICIAN';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isStudent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/98 backdrop-blur-lg shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={campusLogo} alt="Winterfall Northern University" className="h-12 w-12" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Winterfall Northern University</h1>
                  <p className="text-xs font-medium text-blue-600">Edit Ticket #{id}</p>
                </div>
              </div>

              <div className="relative flex items-center gap-3">
                <button className="rounded-lg p-2 transition hover:bg-blue-50">
                  <Bell className="h-5 w-5 text-blue-600" />
                </button>

                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-blue-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                </button>

                {isMenuOpen ? (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-100 p-4">
                      <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName || ''}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex-1 w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/student-tickets')}
            className="mb-6 flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Tickets
          </button>
          <EditTicket ticketId={id} onCancel={() => navigate('/student-tickets')} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isTechnician ? (
        <TechnicianMaintenanceSidebar activeTab="maintenance" setActiveTab={() => {}} />
      ) : (
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      <div className={`flex flex-1 flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
        <TopBar user={user} />

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <h1 className="break-words text-3xl font-bold text-white md:text-4xl">Edit Maintenance Ticket #{id}</h1>
          <p className="mt-1 text-blue-100">Update ticket details and information</p>
        </div>

        <main className="flex-1 overflow-y-auto p-8">
          <button
            onClick={() => navigate(isTechnician ? '/technician-dashboard' : '/tickets')}
            className="mb-6 flex items-center gap-2 font-medium text-indigo-600 transition-colors hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {isTechnician ? 'Back to Technician Dashboard' : 'Back to Tickets'}
          </button>
          <div className="max-w-4xl rounded-lg bg-white p-8 shadow-lg">
            <EditTicket ticketId={id} />
          </div>
        </main>
      </div>
    </div>
  );
}
