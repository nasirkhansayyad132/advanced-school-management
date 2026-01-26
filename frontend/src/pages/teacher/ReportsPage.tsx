import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  Filter,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  PieChart
} from 'lucide-react';
import { Header, Card, CardHeader, Badge, Button } from '../../components/ui';
import clsx from 'clsx';

interface ClassReport {
  id: string;
  name: string;
  section: string;
  totalStudents: number;
  averageAttendance: number;
  presentToday: number;
  absentToday: number;
  trend: number;
}

interface ChronicAbsentee {
  id: string;
  name: string;
  className: string;
  attendanceRate: number;
  absentDays: number;
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const classReports: ClassReport[] = [
    { id: '1', name: 'Class 5', section: 'A', totalStudents: 32, averageAttendance: 94, presentToday: 30, absentToday: 2, trend: 2.5 },
    { id: '2', name: 'Class 5', section: 'B', totalStudents: 30, averageAttendance: 89, presentToday: 27, absentToday: 3, trend: -1.2 },
    { id: '3', name: 'Class 6', section: 'A', totalStudents: 35, averageAttendance: 92, presentToday: 33, absentToday: 2, trend: 1.8 },
    { id: '4', name: 'Class 6', section: 'B', totalStudents: 28, averageAttendance: 87, presentToday: 24, absentToday: 4, trend: -2.1 },
  ];

  const chronicAbsentees: ChronicAbsentee[] = [
    { id: '1', name: 'Rahul Kumar', className: 'Class 5-A', attendanceRate: 62, absentDays: 15 },
    { id: '2', name: 'Sneha Sharma', className: 'Class 6-B', attendanceRate: 68, absentDays: 12 },
    { id: '3', name: 'Vikram Patel', className: 'Class 5-B', attendanceRate: 71, absentDays: 11 },
    { id: '4', name: 'Priya Singh', className: 'Class 6-A', attendanceRate: 73, absentDays: 10 },
  ];

  const weeklyData = [
    { day: 'Mon', present: 92, absent: 8 },
    { day: 'Tue', present: 95, absent: 5 },
    { day: 'Wed', present: 88, absent: 12 },
    { day: 'Thu', present: 94, absent: 6 },
    { day: 'Fri', present: 90, absent: 10 },
  ];

  const totalStudents = classReports.reduce((a, c) => a + c.totalStudents, 0);
  const overallAttendance = Math.round(classReports.reduce((a, c) => a + c.averageAttendance, 0) / classReports.length);
  const totalPresent = classReports.reduce((a, c) => a + c.presentToday, 0);
  const totalAbsent = classReports.reduce((a, c) => a + c.absentToday, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Reports & Analytics" 
        subtitle="Comprehensive attendance insights and statistics"
      />

      <main className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={clsx(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize',
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                )}
              >
                {range === 'week' ? 'This Week' : 
                 range === 'month' ? 'This Month' : 
                 range === 'quarter' ? 'This Quarter' : 'This Year'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">All Classes</option>
              <option value="5a">Class 5-A</option>
              <option value="5b">Class 5-B</option>
              <option value="6a">Class 6-A</option>
              <option value="6b">Class 6-B</option>
            </select>
            <Button variant="outline" icon={Download}>
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Students</p>
                <p className="text-3xl font-bold mt-1">{totalStudents}</p>
                <p className="text-blue-100 text-sm mt-2">Across {classReports.length} classes</p>
              </div>
              <Users className="w-12 h-12 text-blue-200" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Average Attendance</p>
                <p className="text-3xl font-bold mt-1">{overallAttendance}%</p>
                <div className="flex items-center gap-1 mt-2 text-green-100 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+2.3% from last month</span>
                </div>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-200" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Present Today</p>
                <p className="text-3xl font-bold mt-1">{totalPresent}</p>
                <p className="text-yellow-100 text-sm mt-2">{Math.round((totalPresent / totalStudents) * 100)}% of total</p>
              </div>
              <BarChart3 className="w-12 h-12 text-yellow-200" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Absent Today</p>
                <p className="text-3xl font-bold mt-1">{totalAbsent}</p>
                <p className="text-red-100 text-sm mt-2">{chronicAbsentees.length} chronic absentees</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-200" />
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Attendance Chart */}
          <Card>
            <CardHeader 
              title="Weekly Attendance Trend" 
              subtitle="Last 5 working days"
            />
            <div className="space-y-4">
              {weeklyData.map((day, index) => (
                <div key={day.day} className="flex items-center gap-4">
                  <span className="w-10 text-sm font-medium text-gray-600">{day.day}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                      <div 
                        className="h-full bg-green-500 flex items-center justify-end pr-2"
                        style={{ width: `${day.present}%` }}
                      >
                        <span className="text-xs font-medium text-white">{day.present}%</span>
                      </div>
                      <div 
                        className="h-full bg-red-400 flex items-center justify-start pl-2"
                        style={{ width: `${day.absent}%` }}
                      >
                        <span className="text-xs font-medium text-white">{day.absent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-sm text-gray-600">Absent</span>
              </div>
            </div>
          </Card>

          {/* Class-wise Performance */}
          <Card>
            <CardHeader 
              title="Class-wise Performance" 
              subtitle="Attendance comparison"
            />
            <div className="space-y-4">
              {classReports.map((report) => (
                <div key={report.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{report.name} - {report.section}</span>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'text-sm font-bold',
                        report.averageAttendance >= 90 ? 'text-green-600' :
                        report.averageAttendance >= 80 ? 'text-yellow-600' : 'text-red-600'
                      )}>
                        {report.averageAttendance}%
                      </span>
                      <span className={clsx(
                        'flex items-center gap-0.5 text-xs',
                        report.trend > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {report.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(report.trend)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={clsx(
                        'h-full rounded-full',
                        report.averageAttendance >= 90 ? 'bg-green-500' :
                        report.averageAttendance >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${report.averageAttendance}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{report.totalStudents} students</span>
                    <span className="text-green-600">{report.presentToday} present</span>
                    <span className="text-red-600">{report.absentToday} absent</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Chronic Absentees */}
        <Card>
          <CardHeader 
            title="Students Requiring Attention" 
            subtitle="Students with attendance below 75%"
            action={
              <Button variant="outline" size="sm" icon={FileText}>
                Generate Report
              </Button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Attendance Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Absent Days</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chronicAbsentees.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-gray-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.className}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${student.attendanceRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-red-600">{student.attendanceRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.absentDays} days</td>
                    <td className="px-6 py-4">
                      <Badge variant="danger" dot>Critical</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm">
                        Contact Parent
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
