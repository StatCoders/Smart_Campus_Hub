import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function GoogleAuthSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full bg-white shadow rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-green-700">Google Login Successful</h1>
        <p className="mt-3 text-gray-600">Your account is authenticated and tokens are active.</p>

        <div className="mt-6 text-left bg-gray-50 rounded-md p-4">
          <p className="text-sm text-gray-700"><strong>Name:</strong> {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'N/A'}</p>
          <p className="text-sm text-gray-700 mt-1"><strong>Email:</strong> {user?.email || 'N/A'}</p>
          <p className="text-sm text-gray-700 mt-1"><strong>Role:</strong> {user?.role || 'N/A'}</p>
          <p className="text-sm text-gray-700 mt-1"><strong>Email Verified:</strong> {user?.emailVerified ? 'Yes' : 'No'}</p>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}