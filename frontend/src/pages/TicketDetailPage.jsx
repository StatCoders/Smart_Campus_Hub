import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import TicketDetail from '../components/TicketDetail';
import { useAuth } from '../context/useAuth';

export default function TicketDetailPage() {
  const [activeTab, setActiveTab] = useState('tickets');
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Bar */}
        <TopBar user={user} />

        {/* Content Area */}
        <main className="p-8">
          <button
            onClick={() => navigate('/tickets')}
            className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Tickets
          </button>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <TicketDetail />
          </div>
        </main>
      </div>
    </div>
  );
}
