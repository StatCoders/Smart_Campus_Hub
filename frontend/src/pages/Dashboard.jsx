import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useAuth } from '../context/useAuth';

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
  const displayName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'User';
  const displayRole = user?.role || 'N/A';
  const displayEmailVerified = typeof user?.emailVerified === 'boolean' ? (user.emailVerified ? 'Yes' : 'Pending') : 'N/A';
  const [activeTab, setActiveTab] = useState('dashboard');

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Tickets</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
                  </div>
                  <div className="text-4xl">🎫</div>
                </div>
              </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {displayName}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Open Tickets</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">2</p>
                  </div>
                  <div className="text-4xl">🔴</div>
                </div>
              </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {displayName}!
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* User Info Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">In Progress</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">2</p>
                  </div>
                  <div className="text-4xl">🟡</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Profile
                </h3>
                <div className="space-y-2 text-gray-600">
                  <p>
                    <strong>Name:</strong> {displayName}
                  </p>
                  <p>
                    <strong>Email:</strong> {user?.email || 'N/A'}
                  </p>
                  <p>
                    <strong>Phone:</strong> {user?.phoneNumber || 'N/A'}
                  </p>
                  <p>
                    <strong>Role:</strong>{' '}
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {displayRole}
                    </span>
                  </p>
                  <p>
                    <strong>Email Verified:</strong>{' '}
                    <span
                      className={`inline-block px-2 py-1 rounded text-sm ${
                        displayEmailVerified === 'Yes'
                            ? 'bg-green-100 text-green-800'
                            : displayEmailVerified === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {displayEmailVerified}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Resolved</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">1</p>
                  </div>
                  <div className="text-4xl">✓</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Role Based Access
                </h3>
                <div className="space-y-2">
                  <p className="px-4 py-2 rounded bg-blue-50 text-blue-800">
                    USER features: facility booking, personal bookings, maintenance requests.
                  </p>
                  {user?.role === 'ADMIN' ? (
                    <>
                      <p className="px-4 py-2 rounded bg-red-50 text-red-800">
                        ADMIN features: user management, approval flows, system controls.
                      </p>
                      <button className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded">
                        Manage Users
                      </button>
                      <button className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded">
                        Approve Requests
                      </button>
                    </>
                  ) : (
                    <p className="px-4 py-2 rounded bg-gray-100 text-gray-700">
                      Admin-only actions are hidden for non-admin accounts.
                    </p>
                  )}
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
                  onClick={() => {}}
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
