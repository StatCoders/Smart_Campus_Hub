import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import EditTicket from '../components/EditTicket';
import { useAuth } from '../context/useAuth';

export default function EditTicketPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('tickets');
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64">
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
            <EditTicket />
          </div>
        </main>
      </div>
    </div>
  );
}
