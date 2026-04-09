import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'User';
  const displayRole = user?.role || 'N/A';
  const displayEmailVerified = typeof user?.emailVerified === 'boolean' ? (user.emailVerified ? 'Yes' : 'Pending') : 'N/A';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Smart Campus Hub
              </h1>
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

              {/* Quick Links */}
              <div className="bg-white rounded-lg shadow p-6">
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
          </div>
        </div>
      </main>
    </div>
  );
}
