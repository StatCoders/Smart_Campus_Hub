import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/useAuth';
import { getAllFacilities } from '../services/facilityService';

const QuickAccessCard = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-left"
  >
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </button>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [facilitiesCount, setFacilitiesCount] = useState(0);
  const [activeFacilities, setActiveFacilities] = useState(0);

  // Fetch facilities on mount
  useEffect(() => {
    const fetchFacilityStats = async () => {
      try {
        const data = await getAllFacilities({ page: 0, size: 100 });
        const facilities = data.content || (Array.isArray(data) ? data : []);
        setFacilitiesCount(facilities.length);
        setActiveFacilities(facilities.filter(f => f.status === 'ACTIVE').length);
      } catch (err) {
        console.error('Failed to fetch facilities:', err);
      }
    };

    fetchFacilityStats();
  }, []);

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
          <div className="max-w-7xl">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-gray-600">
                Manage your campus resources and requests in one place
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Tickets</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
                  </div>
                  <div className="text-4xl">🎫</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Open Tickets</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">2</p>
                  </div>
                  <div className="text-4xl">🔴</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">In Progress</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">2</p>
                  </div>
                  <div className="text-4xl">🟡</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Resolved</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">1</p>
                  </div>
                  <div className="text-4xl">✓</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Resources</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">{facilitiesCount}</p>
                  </div>
                  <div className="text-4xl">📦</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active Resources</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{activeFacilities}</p>
                  </div>
                  <div className="text-4xl">🟢</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Unavailable</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{facilitiesCount - activeFacilities}</p>
                  </div>
                  <div className="text-4xl">⛔</div>
                </div>
              </div>
            </div>

            {/* Quick Access Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Access</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <QuickAccessCard
                  icon="🎫"
                  title="Tickets"
                  description="Create and manage maintenance tickets"
                  onClick={() => navigate('/tickets')}
                />
                <QuickAccessCard
                  icon="📦"
                  title="Resources"
                  description="Browse available facilities"
                  onClick={() => navigate('/facilities')}
                />
                <QuickAccessCard
                  icon="📅"
                  title="Bookings"
                  description="View your bookings"
                  onClick={() => {}}
                />
                <QuickAccessCard
                  icon="🔔"
                  title="Notifications"
                  description="Check latest updates"
                  onClick={() => {}}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
