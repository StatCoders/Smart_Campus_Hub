import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getDefaultRouteForRole, normalizeRole } from '../utils/roleRedirect';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // No role restrictions - allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  // Check if user has required role
  const userRole = normalizeRole(user?.role);
  const allowedNormalized = allowedRoles.map(normalizeRole).filter(Boolean);

  if (!allowedNormalized.includes(userRole)) {
    // User doesn't have required role - redirect to their default dashboard
    const defaultRoute = getDefaultRouteForRole(userRole);
    return <Navigate to={defaultRoute} replace />;
  }

  // User has required role - render component
  return children;
}
