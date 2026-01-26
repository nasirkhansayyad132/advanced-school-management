import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  ClipboardCheck, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sun,
  Coffee,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Header, Card, Badge, Button } from '../../components/ui';
import { teacherApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface ClassSession {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'SYNCED' | 'LOCKED';
  submittedAt: string | null;
  presentCount: number;
  absentCount: number;
  isLocked: boolean;
}

interface ClassInfo {
  id: string;
  name: string;
  section: string;
  studentCount: number;
  isPrimary: boolean;
  morning: ClassSession;
  afternoon: ClassSession;
}

interface DashboardData {
  date: string;
  teacherId: string;
  classes: ClassInfo[];
}

export default function TeacherDashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  // Fetch real dashboard data
  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['teacher-dashboard', today],
    queryFn: () => teacherApi.getDashboard(today),
  });

  const classes = data?.classes || [];

  // Calculate stats
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const morningPending = classes.filter(c => c.morning.status === 'NOT_STARTED').length;
  const afternoonPending = classes.filter(c => c.afternoon.status === 'NOT_STARTED').length;
  const totalPresent = classes.reduce((sum, c) => sum + c.morning.presentCount + c.afternoon.presentCount, 0);
  const totalAbsent = classes.reduce((sum, c) => sum + c.morning.absentCount + c.afternoon.absentCount, 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getSessionStatus = (session: ClassSession) => {
    if (session.status === 'NOT_STARTED') return { label: 'Pending', variant: 'warning' as const, icon: AlertCircle };
    if (session.status === 'SUBMITTED' || session.status === 'SYNCED') return { label: 'Done', variant: 'success' as const, icon: CheckCircle2 };
    if (session.status === 'LOCKED') return { label: 'Locked', variant: 'default' as const, icon: Clock };
    return { label: 'In Progress', variant: 'info' as const, icon: Clock };
  };

  const handleTakeAttendance = (classId: string, session: 'morning' | 'afternoon') => {
    navigate(`/attendance/${classId}?session=${session}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Failed to load dashboard</p>
          <p className="text-gray-600 mb-4">{(error as Error).message}</p>
          <Button onClick={() => refetch()} icon={RefreshCw}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={`${getGreeting()}, ${user?.firstName}!`} 
        subtitle="Today's Tasks"
      />

      <main className="p-6 space-y-6">
        {/* Today's Date */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Today</p>
              <p className="text-2xl font-bold">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="text-white border-white/30 hover:bg-white/10">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            <p className="text-sm text-gray-500">Total Students</p>
          </Card>
          <Card className="text-center">
            <ClipboardCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            <p className="text-sm text-gray-500">My Classes</p>
          </Card>
          <Card className="text-center">
            <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{morningPending + afternoonPending}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </Card>
          <Card className="text-center">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalAbsent}</p>
            <p className="text-sm text-gray-500">Absent Today</p>
          </Card>
        </div>

        {/* My Classes - Quick Actions */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">📋 My Classes Today</h2>
          
          {classes.length === 0 ? (
            <Card className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No classes assigned to you yet.</p>
              <p className="text-sm text-gray-400">Contact admin to assign classes.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {classes.map((classInfo) => {
                const morningStatus = getSessionStatus(classInfo.morning);
                const afternoonStatus = getSessionStatus(classInfo.afternoon);
                
                return (
                  <Card key={classInfo.id} className="overflow-hidden">
                    {/* Class Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {classInfo.name.replace('Class ', '')}
                          {classInfo.section}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{classInfo.name} - {classInfo.section}</h3>
                          <p className="text-sm text-gray-500">{classInfo.studentCount} students</p>
                        </div>
                      </div>
                      {classInfo.isPrimary && (
                        <Badge variant="info">Primary</Badge>
                      )}
                    </div>

                    {/* Sessions Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Morning Session */}
                      <div className={`p-4 rounded-xl border-2 ${
                        classInfo.morning.status === 'NOT_STARTED' 
                          ? 'border-orange-200 bg-orange-50' 
                          : 'border-green-200 bg-green-50'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Sun className="w-5 h-5 text-orange-500" />
                          <span className="font-medium text-gray-900">Morning</span>
                          <Badge variant={morningStatus.variant} size="sm">
                            {morningStatus.label}
                          </Badge>
                        </div>
                        
                        {classInfo.morning.status === 'NOT_STARTED' ? (
                          <Button 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => handleTakeAttendance(classInfo.id, 'morning')}
                          >
                            <ClipboardCheck className="w-4 h-4 mr-1" />
                            Take Attendance
                          </Button>
                        ) : (
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-green-600">
                              <CheckCircle2 className="w-4 h-4 inline mr-1" />
                              {classInfo.morning.presentCount} Present
                            </span>
                            <span className="text-red-600">
                              <XCircle className="w-4 h-4 inline mr-1" />
                              {classInfo.morning.absentCount} Absent
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Afternoon Session */}
                      <div className={`p-4 rounded-xl border-2 ${
                        classInfo.afternoon.status === 'NOT_STARTED' 
                          ? 'border-orange-200 bg-orange-50' 
                          : 'border-green-200 bg-green-50'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Coffee className="w-5 h-5 text-purple-500" />
                          <span className="font-medium text-gray-900">After Break</span>
                          <Badge variant={afternoonStatus.variant} size="sm">
                            {afternoonStatus.label}
                          </Badge>
                        </div>
                        
                        {classInfo.afternoon.status === 'NOT_STARTED' ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => handleTakeAttendance(classInfo.id, 'afternoon')}
                          >
                            <ClipboardCheck className="w-4 h-4 mr-1" />
                            Take Attendance
                          </Button>
                        ) : (
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-green-600">
                              <CheckCircle2 className="w-4 h-4 inline mr-1" />
                              {classInfo.afternoon.presentCount} Present
                            </span>
                            <span className="text-red-600">
                              <XCircle className="w-4 h-4 inline mr-1" />
                              {classInfo.afternoon.absentCount} Absent
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Alert */}
        {(morningPending > 0 || afternoonPending > 0) && (
          <Card className="bg-orange-50 border-orange-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <div>
                <p className="font-medium text-orange-800">Pending Submissions</p>
                <p className="text-sm text-orange-600">
                  {morningPending > 0 && `${morningPending} morning session${morningPending > 1 ? 's' : ''}`}
                  {morningPending > 0 && afternoonPending > 0 && ' and '}
                  {afternoonPending > 0 && `${afternoonPending} after-break session${afternoonPending > 1 ? 's' : ''}`}
                  {' '}not submitted yet.
                </p>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
