import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  School,
  TrendingUp,
  TrendingDown,
  Calendar,
  Bell,
  Settings,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  BookOpen,
  Award,
  Loader2
} from 'lucide-react';
import { Header, Card, CardHeader, Badge, Button } from '../../components/ui';
import { studentsApi, teachersApi, classesApi } from '../../services/api';
import clsx from 'clsx';

// Chart data
const monthlyAttendanceData = [
  { month: 'Jan', attendance: 92, target: 95 },
  { month: 'Feb', attendance: 88, target: 95 },
  { month: 'Mar', attendance: 94, target: 95 },
  { month: 'Apr', attendance: 91, target: 95 },
  { month: 'May', attendance: 96, target: 95 },
  { month: 'Jun', attendance: 89, target: 95 },
  { month: 'Jul', attendance: 93, target: 95 },
  { month: 'Aug', attendance: 95, target: 95 },
  { month: 'Sep', attendance: 97, target: 95 },
  { month: 'Oct', attendance: 94, target: 95 },
  { month: 'Nov', attendance: 92, target: 95 },
  { month: 'Dec', attendance: 90, target: 95 },
];

const gradeDistributionData = [
  { grade: '1st', students: 145, teachers: 6 },
  { grade: '2nd', students: 158, teachers: 6 },
  { grade: '3rd', students: 142, teachers: 5 },
  { grade: '4th', students: 165, teachers: 7 },
  { grade: '5th', students: 138, teachers: 5 },
  { grade: '6th', students: 152, teachers: 6 },
  { grade: '7th', students: 148, teachers: 6 },
  { grade: '8th', students: 140, teachers: 5 },
];

const attendanceStatusData = [
  { name: 'Present', value: 892, color: '#10b981' },
  { name: 'Absent', value: 45, color: '#ef4444' },
  { name: 'Late', value: 32, color: '#f59e0b' },
  { name: 'Excused', value: 19, color: '#6366f1' },
];

const weeklyTrendData = [
  { day: 'Mon', present: 95, absent: 5 },
  { day: 'Tue', present: 93, absent: 7 },
  { day: 'Wed', present: 97, absent: 3 },
  { day: 'Thu', present: 94, absent: 6 },
  { day: 'Fri', present: 88, absent: 12 },
];

interface Notification {
  id: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  type: 'meeting' | 'exam' | 'holiday' | 'event';
}

const notifications: Notification[] = [
  { id: '1', type: 'alert', title: 'Critical Attendance Alert', message: 'Class 8-B has 15% absence rate today', time: '5 min ago', read: false },
  { id: '2', type: 'warning', title: 'Teacher Absence', message: 'Mrs. Smith is on sick leave today', time: '30 min ago', read: false },
  { id: '3', type: 'success', title: 'Report Generated', message: 'Monthly attendance report is ready', time: '1 hour ago', read: true },
  { id: '4', type: 'info', title: 'System Update', message: 'New features added to attendance module', time: '2 hours ago', read: true },
];

const upcomingEvents: UpcomingEvent[] = [
  { id: '1', title: 'Staff Meeting', date: 'Today, 3:00 PM', type: 'meeting' },
  { id: '2', title: 'Mid-term Exams Begin', date: 'Mar 15, 2024', type: 'exam' },
  { id: '3', title: 'Parent-Teacher Meeting', date: 'Mar 20, 2024', type: 'event' },
  { id: '4', title: 'Spring Break', date: 'Mar 25-30, 2024', type: 'holiday' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('today');

  // Fetch real counts from database
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-count'],
    queryFn: () => studentsApi.getAll({ limit: 1 }),
  });

  const { data: teachersData, isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers-count'],
    queryFn: () => teachersApi.getAll({ limit: 1 }),
  });

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes-count'],
    queryFn: () => classesApi.getAll({ limit: 1 }),
  });

  const isLoading = studentsLoading || teachersLoading || classesLoading;

  const stats = {
    totalStudents: studentsData?.meta?.total || 0,
    totalTeachers: teachersData?.meta?.total || 0,
    totalClasses: classesData?.meta?.total || 0,
    averageAttendance: 93.2,
    todayPresent: 892,
    todayAbsent: 45,
    chronicAbsentees: 12,
    pendingReports: 5,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Admin Dashboard" 
        subtitle="Welcome back! Here's your school overview"
      />

      <main className="p-6 space-y-6">
        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          {(['today', 'week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 capitalize',
                timeRange === range
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              )}
            >
              {range === 'today' ? 'Today' : 
               range === 'week' ? 'This Week' : 
               range === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <Badge variant="info" size="sm">From DB</Badge>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-4">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.totalStudents.toLocaleString()}
              </p>
              <p className="text-gray-500 text-sm mt-1">Total Students</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <Badge variant="info" size="sm">From DB</Badge>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-4">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.totalTeachers}
              </p>
              <p className="text-gray-500 text-sm mt-1">Total Teachers</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <School className="w-6 h-6 text-purple-600" />
                </div>
                <Badge variant="info" size="sm">From DB</Badge>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-4">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.totalClasses}
              </p>
              <p className="text-gray-500 text-sm mt-1">Active Classes</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+1.2%</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-4">{stats.averageAttendance}%</p>
              <p className="text-gray-500 text-sm mt-1">Avg. Attendance</p>
            </div>
          </Card>
        </div>

        {/* Live Attendance Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader 
              title="Today's Attendance Overview" 
              subtitle="Real-time attendance statistics"
              action={
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-500">Live</span>
                </div>
              }
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Present</span>
                </div>
                <p className="text-2xl font-bold text-green-700">{stats.todayPresent}</p>
                <p className="text-xs text-green-600 mt-1">
                  {Math.round((stats.todayPresent / stats.totalStudents) * 100)}% of total
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">Absent</span>
                </div>
                <p className="text-2xl font-bold text-red-700">{stats.todayAbsent}</p>
                <p className="text-xs text-red-600 mt-1">
                  {Math.round((stats.todayAbsent / stats.totalStudents) * 100)}% of total
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="flex items-center gap-2 text-yellow-600 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">Late</span>
                </div>
                <p className="text-2xl font-bold text-yellow-700">32</p>
                <p className="text-xs text-yellow-600 mt-1">3% of total</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">Excused</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">19</p>
                <p className="text-xs text-purple-600 mt-1">2% of total</p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Classes Reported</span>
                <span className="font-medium">28/32 classes</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" style={{ width: '87.5%' }} />
              </div>
              <p className="text-xs text-gray-500">4 classes pending attendance submission</p>
            </div>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader 
              title="Attendance Distribution" 
              subtitle="Today's breakdown"
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {attendanceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {attendanceStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <Card>
            <CardHeader 
              title="Monthly Attendance Trend" 
              subtitle="Comparison with target (95%)"
            />
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyAttendanceData}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="attendance" 
                    stroke="#3b82f6" 
                    fill="url(#attendanceGradient)"
                    strokeWidth={2}
                    name="Attendance %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#ef4444" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="Target"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Grade Distribution */}
          <Card>
            <CardHeader 
              title="Grade-wise Distribution" 
              subtitle="Students and teachers per grade"
            />
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Students" />
                  <Bar dataKey="teachers" fill="#10b981" radius={[4, 4, 0, 0]} name="Teachers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications */}
          <Card className="lg:col-span-2">
            <CardHeader 
              title="Recent Notifications" 
              subtitle="System alerts and updates"
              action={
                <Button variant="ghost" size="sm">View All</Button>
              }
            />
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={clsx(
                    'p-4 rounded-xl border transition-all duration-200 hover:shadow-md',
                    !notification.read && 'bg-blue-50/50 border-blue-100',
                    notification.read && 'bg-gray-50 border-gray-100'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      notification.type === 'alert' && 'bg-red-100',
                      notification.type === 'warning' && 'bg-yellow-100',
                      notification.type === 'success' && 'bg-green-100',
                      notification.type === 'info' && 'bg-blue-100'
                    )}>
                      {notification.type === 'alert' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                      {notification.type === 'warning' && <Clock className="w-5 h-5 text-yellow-600" />}
                      {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {notification.type === 'info' && <Bell className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        <span className="text-xs text-gray-400 flex-shrink-0">{notification.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader 
              title="Upcoming Events" 
              subtitle="Schedule overview"
              action={
                <Button variant="ghost" size="sm" icon={Calendar}>Add</Button>
              }
            />
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={clsx(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                    event.type === 'meeting' && 'bg-blue-100 text-blue-600',
                    event.type === 'exam' && 'bg-red-100 text-red-600',
                    event.type === 'holiday' && 'bg-green-100 text-green-600',
                    event.type === 'event' && 'bg-purple-100 text-purple-600'
                  )}>
                    {event.type === 'meeting' && <Users className="w-5 h-5" />}
                    {event.type === 'exam' && <BookOpen className="w-5 h-5" />}
                    {event.type === 'holiday' && <Award className="w-5 h-5" />}
                    {event.type === 'event' && <Calendar className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                    <p className="text-sm text-gray-500">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader 
            title="Quick Actions" 
            subtitle="Common administrative tasks"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { icon: Users, label: 'Manage Students', color: 'blue', route: '/admin/students' },
              { icon: GraduationCap, label: 'Manage Teachers', color: 'green', route: '/admin/teachers' },
              { icon: School, label: 'Manage Classes', color: 'purple', route: '/admin/classes' },
              { icon: FileText, label: 'Generate Reports', color: 'yellow', route: '/admin/reports' },
              { icon: Bell, label: 'Send Notification', color: 'pink', route: '/admin/notifications' },
              { icon: Settings, label: 'Settings', color: 'gray', route: '/admin/settings' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.route)}
                className={clsx(
                  'p-6 rounded-xl border-2 border-dashed transition-all duration-200',
                  'hover:border-solid hover:shadow-lg hover:-translate-y-1',
                  `border-${action.color}-200 hover:border-${action.color}-400 hover:bg-${action.color}-50`
                )}
              >
                <action.icon className={clsx('w-8 h-8 mx-auto mb-3', `text-${action.color}-600`)} />
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
