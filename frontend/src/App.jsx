import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { SidebarProvider } from './context/SidebarContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentTicketsPage from './pages/StudentTicketsPage';
import StudentResourcesPage from './pages/StudentResourcesPage';
import AdminResourcesPage from './pages/AdminResourcesPage';
import Tickets from './pages/Tickets';
import TicketCreatePage from './pages/TicketCreatePage';
import TicketDetailPage from './pages/TicketDetailPage';
import EditTicketPage from './pages/EditTicketPage';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import BookingsPage from './pages/BookingsPage';
import AdminBookingsPage from './pages/AdminBookingsPage';
import ManageUsersPage from './pages/ManageUsersPage';
import { useAuth } from './context/useAuth';
import { getDefaultRouteForRole, normalizeRole } from './utils/roleRedirect';

// Role-based bookings route component
function BookingsRoute() {
  const { user } = useAuth();
  if (!user) return null;
  return normalizeRole(user.role) === 'ADMIN' ? <AdminBookingsPage /> : <BookingsPage />;
}

// Role-based resources route component
function ResourcesRoute() {
  const { user } = useAuth();
  if (!user) return null;
  return normalizeRole(user.role) === 'ADMIN' ? <AdminResourcesPage /> : <StudentResourcesPage />;
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician-dashboard"
              element={
                <ProtectedRoute allowedRoles={['TECHNICIAN']}>
                  <TechnicianDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-dashboard"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-tickets"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <StudentTicketsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-resources"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <StudentResourcesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-bookings"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <BookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <Tickets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets/create"
              element={
                <ProtectedRoute>
                  <TicketCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets/:id/edit"
              element={
                <ProtectedRoute>
                  <EditTicketPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets/:id"
              element={
                <ProtectedRoute>
                  <TicketDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facilities"
              element={
                <ProtectedRoute>
                  <ResourcesRoute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <BookingsRoute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-users"
              element={
                <ProtectedRoute>
                  <ManageUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/google-success"
              element={<GoogleAuthSuccess />}
            />
            <Route path="/" element={<RootRedirect />} />
          </Routes>
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
