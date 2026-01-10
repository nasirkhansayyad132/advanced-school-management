import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  Lock, 
  RefreshCw,
  LogOut,
  Search,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { teacherApi } from '../../services/api';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import type { ClassInfo } from '../../types';

export default function TeacherDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();
  
  const today = new Date().toISOString().split('T')[0];
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard', today],
    queryFn: () => teacherApi.getDashboard(today),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getSessionStatusBadge = (session: ClassInfo['morning']) => {
    const statusConfig = {
      NOT_STARTED: { icon: Clock, color: 'bg-gray-100 text-gray-600', text: 'Not started' },
      IN_PROGRESS: { icon: RefreshCw, color: 'bg-yellow-100 text-yellow-700', text: 'In progress' },
      SUBMITTED: { icon: CheckCircle, color: 'bg-blue-100 text-blue-700', text: 'Submitted' },
      SYNCED: { icon: CheckCircle, color: 'bg-green-100 text-green-700', text: 'Synced' },
      LOCKED: { icon: Lock, color: 'bg-gray-100 text-gray-600', text: 'Locked' },
    };

    const config = statusConfig[session.status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{dayName}</h1>
              <p className="text-sm text-gray-500">
                Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.firstName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/sync" className="p-2 text-gray-500 hover:text-gray-700">
                <RefreshCw className="w-5 h-5" />
              </Link>
              <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-700">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Network status */}
          <div className={`mt-2 flex items-center gap-2 text-sm ${
            isOnline ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Offline mode</span>
              </>
            )}
            {isRefetching && (
              <RefreshCw className="w-4 h-4 animate-spin ml-2" />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4">
        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            className="input pl-10"
          />
        </div>

        {/* Classes */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <div className="skeleton h-6 w-32 mb-4" />
                <div className="skeleton h-4 w-24 mb-2" />
                <div className="skeleton h-4 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data?.classes?.map((classInfo: ClassInfo) => (
              <div key={classInfo.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {classInfo.name}{classInfo.section ? `-${classInfo.section}` : ''}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {classInfo.studentCount} students
                    </p>
                  </div>
                  {classInfo.isPrimary && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Primary
                    </span>
                  )}
                </div>

                {/* Morning Session */}
                <div className="flex items-center justify-between py-3 border-t">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Morning</p>
                    {getSessionStatusBadge(classInfo.morning)}
                    {classInfo.morning.status !== 'NOT_STARTED' && (
                      <p className="text-xs text-gray-500 mt-1">
                        {classInfo.morning.presentCount}/{classInfo.studentCount} present
                      </p>
                    )}
                  </div>
                  {classInfo.morning.status === 'NOT_STARTED' && !classInfo.morning.isLocked && (
                    <Link
                      to={`/attendance/${classInfo.id}/MORNING`}
                      className="btn btn-primary text-sm py-2 px-4"
                    >
                      Take Attendance
                    </Link>
                  )}
                  {(classInfo.morning.status === 'SUBMITTED' || classInfo.morning.status === 'SYNCED') && 
                   !classInfo.morning.isLocked && (
                    <Link
                      to={`/attendance/${classInfo.id}/MORNING`}
                      className="btn btn-secondary text-sm py-2 px-4"
                    >
                      Edit
                    </Link>
                  )}
                </div>

                {/* Afternoon Session */}
                <div className="flex items-center justify-between py-3 border-t">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Afternoon</p>
                    {getSessionStatusBadge(classInfo.afternoon)}
                    {classInfo.afternoon.status !== 'NOT_STARTED' && (
                      <p className="text-xs text-gray-500 mt-1">
                        {classInfo.afternoon.presentCount}/{classInfo.studentCount} present
                      </p>
                    )}
                  </div>
                  {classInfo.afternoon.status === 'NOT_STARTED' && !classInfo.afternoon.isLocked && (
                    <Link
                      to={`/attendance/${classInfo.id}/AFTERNOON`}
                      className="btn btn-primary text-sm py-2 px-4"
                    >
                      Take Attendance
                    </Link>
                  )}
                  {(classInfo.afternoon.status === 'SUBMITTED' || classInfo.afternoon.status === 'SYNCED') && 
                   !classInfo.afternoon.isLocked && (
                    <Link
                      to={`/attendance/${classInfo.id}/AFTERNOON`}
                      className="btn btn-secondary text-sm py-2 px-4"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh button */}
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="btn btn-secondary w-full flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </main>
    </div>
  );
}
