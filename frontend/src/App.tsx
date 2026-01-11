import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AttendancePage from './pages/teacher/AttendancePage';
import SyncStatusPage from './pages/teacher/SyncStatusPage';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Teacher routes
  if (user?.role === 'TEACHER') {
    return (
      <Routes>
        <Route path="/" element={<TeacherDashboard />} />
        <Route path="/attendance/:classId/:session" element={<AttendancePage />} />
        <Route path="/sync" element={<SyncStatusPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Admin/Principal routes (simplified for now)
  return (
    <Routes>
      <Route path="/" element={<TeacherDashboard />} />
      <Route path="/attendance/:classId/:session" element={<AttendancePage />} />
      <Route path="/sync" element={<SyncStatusPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
