import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';

// Teacher Pages
import DashboardPage from './pages/teacher/DashboardPage';
import TakeAttendancePage from './pages/teacher/TakeAttendancePage';
import StudentsPage from './pages/teacher/StudentsPage';
import ReportsPage from './pages/teacher/ReportsPage';
import MyClassesPage from './pages/teacher/MyClassesPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeachersPage from './pages/admin/TeachersPage';
import AdminClassesPage from './pages/admin/ClassesPage';
import SettingsPage from './pages/admin/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function RoleBasedRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role === 'ADMIN' || user?.role === 'PRINCIPAL') {
    return <Navigate to="/admin" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (isAuthenticated) {
    // Redirect based on user role
    if (user?.role === 'ADMIN' || user?.role === 'PRINCIPAL') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes with Dashboard Layout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Teacher Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/attendance/:classId" element={<TakeAttendancePage />} />
        <Route path="/attendance" element={<TakeAttendancePage />} />
        <Route path="/my-classes" element={<MyClassesPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/schedule" element={<DashboardPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/teachers" element={<AdminTeachersPage />} />
        <Route path="/admin/classes" element={<AdminClassesPage />} />
        <Route path="/admin/students" element={<StudentsPage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Default redirect - role based */}
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="*" element={<RoleBasedRedirect />} />
    </Routes>
  );
}

export default App;
