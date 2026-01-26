import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ClipboardCheck, 
  ChevronRight,
  CheckCircle2,
  Clock,
  Calendar,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { Header, Card, CardHeader, Badge, Button } from '../../components/ui';
import clsx from 'clsx';

interface ClassInfo {
  id: string;
  name: string;
  section: string;
  grade: string;
  studentCount: number;
  schedule: string[];
  subjects: string[];
  attendanceToday: 'pending' | 'completed' | 'partial';
  averageAttendance: number;
}

export default function MyClassesPage() {
  const navigate = useNavigate();
  
  const classes: ClassInfo[] = [
    { 
      id: '1', 
      name: 'Class 5', 
      section: 'A', 
      grade: '5',
      studentCount: 32, 
      schedule: ['Mon', 'Wed', 'Fri'],
      subjects: ['Mathematics', 'Science'],
      attendanceToday: 'completed',
      averageAttendance: 94
    },
    { 
      id: '2', 
      name: 'Class 5', 
      section: 'B', 
      grade: '5',
      studentCount: 30, 
      schedule: ['Mon', 'Tue', 'Thu'],
      subjects: ['Mathematics'],
      attendanceToday: 'pending',
      averageAttendance: 89
    },
    { 
      id: '3', 
      name: 'Class 6', 
      section: 'A', 
      grade: '6',
      studentCount: 35, 
      schedule: ['Tue', 'Wed', 'Fri'],
      subjects: ['Science', 'Computer'],
      attendanceToday: 'partial',
      averageAttendance: 92
    },
    { 
      id: '4', 
      name: 'Class 6', 
      section: 'B', 
      grade: '6',
      studentCount: 28, 
      schedule: ['Mon', 'Thu', 'Fri'],
      subjects: ['Mathematics', 'Science'],
      attendanceToday: 'pending',
      averageAttendance: 87
    },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="My Classes" 
        subtitle="View and manage your assigned classes"
      />

      <main className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Classes</p>
                <p className="text-3xl font-bold mt-1">{classes.length}</p>
              </div>
              <GraduationCap className="w-10 h-10 text-blue-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Students</p>
                <p className="text-3xl font-bold mt-1">{classes.reduce((a, c) => a + c.studentCount, 0)}</p>
              </div>
              <Users className="w-10 h-10 text-green-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Classes Today</p>
                <p className="text-3xl font-bold mt-1">
                  {classes.filter(c => c.schedule.includes(today)).length}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-purple-200" />
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pending Attendance</p>
                <p className="text-3xl font-bold mt-1">
                  {classes.filter(c => c.attendanceToday !== 'completed').length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-200" />
            </div>
          </Card>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map((classInfo) => (
            <Card key={classInfo.id} hover>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {classInfo.grade}{classInfo.section}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {classInfo.name} - {classInfo.section}
                    </h3>
                    <p className="text-sm text-gray-500">{classInfo.studentCount} students</p>
                  </div>
                </div>
                <Badge
                  variant={
                    classInfo.attendanceToday === 'completed' ? 'success' :
                    classInfo.attendanceToday === 'partial' ? 'warning' : 'default'
                  }
                  dot
                >
                  {classInfo.attendanceToday === 'completed' ? 'Completed' :
                   classInfo.attendanceToday === 'partial' ? 'In Progress' : 'Pending'}
                </Badge>
              </div>

              {/* Schedule */}
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                    <span
                      key={day}
                      className={clsx(
                        'px-2 py-1 text-xs rounded font-medium',
                        classInfo.schedule.includes(day)
                          ? day === today
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-400'
                      )}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <div className="flex items-center gap-2 flex-wrap">
                  {classInfo.subjects.map((subject) => (
                    <span key={subject} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Attendance Rate */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Average Attendance</span>
                  <span className={clsx(
                    'font-semibold',
                    classInfo.averageAttendance >= 90 ? 'text-green-600' :
                    classInfo.averageAttendance >= 80 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {classInfo.averageAttendance}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={clsx(
                      'h-full rounded-full',
                      classInfo.averageAttendance >= 90 ? 'bg-green-500' :
                      classInfo.averageAttendance >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${classInfo.averageAttendance}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <Button 
                  variant={classInfo.attendanceToday === 'pending' ? 'primary' : 'outline'} 
                  size="sm" 
                  icon={ClipboardCheck}
                  onClick={() => navigate(`/attendance/${classInfo.id}`)}
                  className="flex-1"
                >
                  {classInfo.attendanceToday === 'pending' ? 'Take Attendance' : 'View Attendance'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={Users}
                  onClick={() => navigate(`/students?class=${classInfo.id}`)}
                  className="flex-1"
                >
                  View Students
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
