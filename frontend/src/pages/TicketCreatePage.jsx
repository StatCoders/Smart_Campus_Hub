import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import CreateTicket from '../components/CreateTicket';
import { useAuth } from '../context/useAuth';
import { useSidebar } from '../context/SidebarContext';

export default function TicketCreatePage() {
  const [activeTab, setActiveTab] = useState('tickets');
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();

  const handleSuccess = () => {
    setTimeout(() => navigate('/tickets'), 1500);
  };

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
