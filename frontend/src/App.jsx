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
import { useAuth } from './context/useAuth';
import 'tailwindcss';

// Role-based bookings route component
function BookingsRoute() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'ADMIN' ? <AdminBookingsPage /> : <BookingsPage />;
}

// Role-based resources route component
function ResourcesRoute() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'ADMIN' ? <AdminResourcesPage /> : <StudentResourcesPage />;
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
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician-dashboard"
              element={
                <ProtectedRoute>
                  <TechnicianDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-dashboard"
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-tickets"
              element={
                <ProtectedRoute>
                  <StudentTicketsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-resources"
              element={
                <ProtectedRoute>
                  <StudentResourcesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-bookings"
              element={
                <ProtectedRoute>
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
              path="/google-success"
              element={<GoogleAuthSuccess />}
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
