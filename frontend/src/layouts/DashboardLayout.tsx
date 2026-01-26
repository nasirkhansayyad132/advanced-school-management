import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/ui';
import { useAuthStore } from '../stores/authStore';

export default function DashboardLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 transition-all duration-300">
        <Outlet />
      </div>
    </div>
  );
}
