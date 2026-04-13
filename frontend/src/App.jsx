import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import TicketCreatePage from './pages/TicketCreatePage';
import TicketDetailPage from './pages/TicketDetailPage';
import EditTicketPage from './pages/EditTicketPage';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import FacilitiesPage from './pages/FacilitiesPage';
import FacilityDetailPage from './pages/FacilityDetailPage';
import BookingsPage from './pages/BookingsPage';
import AdminBookingsPage from './pages/AdminBookingsPage';
import { useAuth } from './context/useAuth';
import 'tailwindcss';

// Role-based bookings route component
function BookingsRoute() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'ADMIN' ? <AdminBookingsPage /> : <BookingsPage />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
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
                <FacilitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/facilities/:id"
            element={
              <ProtectedRoute>
                <FacilityDetailPage />
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
            path="/google-success"
            element={<GoogleAuthSuccess />}
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
