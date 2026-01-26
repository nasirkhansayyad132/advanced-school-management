import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle,
  Search,
  RotateCcw,
  Loader2,
  Sun,
  Coffee,
  User
} from 'lucide-react';
import { Header, Card, Badge, Button, Modal } from '../../components/ui';
import { teacherApi, attendanceApi } from '../../services/api';
import clsx from 'clsx';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'SICK' | 'EXCUSED';

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  reason?: string;
  notes?: string;
}

const statusConfig: Record<AttendanceStatus, { label: string; color: string; bgColor: string }> = {
  PRESENT: { label: 'Present', color: 'text-green-700', bgColor: 'bg-green-100 border-green-300' },
  ABSENT: { label: 'Absent', color: 'text-red-700', bgColor: 'bg-red-100 border-red-300' },
  LATE: { label: 'Late', color: 'text-yellow-700', bgColor: 'bg-yellow-100 border-yellow-300' },
  SICK: { label: 'Sick', color: 'text-pink-700', bgColor: 'bg-pink-100 border-pink-300' },
  EXCUSED: { label: 'Excused', color: 'text-purple-700', bgColor: 'bg-purple-100 border-purple-300' },
};

const absentReasons = [
  { value: 'sick', label: 'Sick' },
  { value: 'family', label: 'Family Emergency' },
  { value: 'travel', label: 'Travel' },
  { value: 'unknown', label: 'Unknown' },
];

export default function TakeAttendancePage() {
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const session = (searchParams.get('session') as 'morning' | 'afternoon') || 'morning';
  
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<Map<string, AttendanceRecord>>(new Map());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Fetch students for this class
  const { data: studentsData, isLoading, error } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: () => teacherApi.getClassStudents(classId!),
    enabled: !!classId,
  });

  const students: Student[] = studentsData || [];

  // Initialize all students as PRESENT (default present mode!)
  useEffect(() => {
    if (students.length > 0 && records.size === 0) {
      const initialRecords = new Map<string, AttendanceRecord>();
      students.forEach(student => {
        initialRecords.set(student.id, { studentId: student.id, status: 'PRESENT' });
      });
      setRecords(initialRecords);
    }
  }, [students]);

  // Submit attendance mutation
  const submitMutation = useMutation({
    mutationFn: () => attendanceApi.submit({
      idempotencyKey: `${classId}-${today}-${session}-${Date.now()}`,
      classId: classId!,
      date: today,
      session: session.toUpperCase(),
      records: Array.from(records.values()).map(r => ({
        studentId: r.studentId,
        status: r.status,
        notes: r.reason || r.notes,
      })),
      clientCreatedAt: new Date().toISOString(),
    }),
    onSuccess: () => {
      setShowConfirmModal(false);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to submit attendance');
    },
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const student = students.find(s => s.id === studentId);
    
    // If marking absent, show reason modal
    if (status === 'ABSENT' && student) {
      setSelectedStudent(student);
      setShowReasonModal(true);
      return;
    }

    setRecords(prev => {
      const newRecords = new Map(prev);
      newRecords.set(studentId, { studentId, status });
      return newRecords;
    });
  };

  const handleAbsentWithReason = () => {
    if (selectedStudent) {
      setRecords(prev => {
        const newRecords = new Map(prev);
        newRecords.set(selectedStudent.id, { 
          studentId: selectedStudent.id, 
          status: 'ABSENT',
          reason: selectedReason 
        });
        return newRecords;
      });
    }
    setShowReasonModal(false);
    setSelectedStudent(null);
    setSelectedReason('');
  };

  const handleMarkAllPresent = () => {
    const newRecords = new Map<string, AttendanceRecord>();
    students.forEach(student => {
      newRecords.set(student.id, { studentId: student.id, status: 'PRESENT' });
    });
    setRecords(newRecords);
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) || 
           s.admissionNo.toLowerCase().includes(search.toLowerCase());
  });

  const stats = {
    total: students.length,
    present: Array.from(records.values()).filter(r => r.status === 'PRESENT').length,
    absent: Array.from(records.values()).filter(r => r.status === 'ABSENT').length,
    late: Array.from(records.values()).filter(r => r.status === 'LATE').length,
    sick: Array.from(records.values()).filter(r => r.status === 'SICK').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Failed to load students</p>
          <Button onClick={() => navigate('/dashboard')}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-gray-900">Take Attendance</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {session === 'morning' ? (
                  <><Sun className="w-4 h-4 text-orange-500" /> Morning Session</>
                ) : (
                  <><Coffee className="w-4 h-4 text-purple-500" /> After Break</>
                )}
                <span>•</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowConfirmModal(true)} icon={Save}>
            Submit
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 px-4 pb-3 text-sm">
          <span className="text-gray-500">Total: <strong>{stats.total}</strong></span>
          <span className="text-green-600">Present: <strong>{stats.present}</strong></span>
          <span className="text-red-600">Absent: <strong>{stats.absent}</strong></span>
          {stats.late > 0 && <span className="text-yellow-600">Late: <strong>{stats.late}</strong></span>}
          {stats.sick > 0 && <span className="text-pink-600">Sick: <strong>{stats.sick}</strong></span>}
        </div>
      </div>

      <main className="p-4 space-y-4">
        {/* Info Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-blue-800">
              <strong>Default: Present</strong> — All students are marked present. Tap only those who are absent/late.
            </p>
          </div>
        </Card>

        {/* Search & Actions */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" onClick={handleMarkAllPresent} icon={RotateCcw}>
            Reset All
          </Button>
        </div>

        {/* Student List */}
        <div className="space-y-2">
          {filteredStudents.map((student) => {
            const record = records.get(student.id);
            const status = record?.status || 'PRESENT';
            const config = statusConfig[status];

            return (
              <Card 
                key={student.id} 
                className={clsx('transition-all', config.bgColor, 'border-2')}
              >
                <div className="flex items-center justify-between">
                  {/* Student Info */}
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm',
                      student.gender === 'MALE' ? 'bg-blue-500' : 'bg-pink-500'
                    )}>
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-gray-500">#{student.admissionNo}</p>
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStatusChange(student.id, 'PRESENT')}
                      className={clsx(
                        'p-2 rounded-lg transition-all',
                        status === 'PRESENT' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                      )}
                      title="Present"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'ABSENT')}
                      className={clsx(
                        'p-2 rounded-lg transition-all',
                        status === 'ABSENT' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600'
                      )}
                      title="Absent"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(student.id, 'LATE')}
                      className={clsx(
                        'p-2 rounded-lg transition-all',
                        status === 'LATE' 
                          ? 'bg-yellow-500 text-white' 
                          : 'bg-gray-100 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600'
                      )}
                      title="Late"
                    >
                      <Clock className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Show reason if absent */}
                {record?.reason && (
                  <p className="text-xs text-gray-500 mt-2 pl-13">
                    Reason: {absentReasons.find(r => r.value === record.reason)?.label || record.reason}
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        {filteredStudents.length === 0 && (
          <Card className="text-center py-8">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No students found</p>
          </Card>
        )}
      </main>

      {/* Confirm Submit Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Submit Attendance"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                <p className="text-sm text-gray-500">Present</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                <p className="text-sm text-gray-500">Absent</p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm">
            Are you sure you want to submit attendance for {session === 'morning' ? 'Morning' : 'After Break'} session?
          </p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Absent Reason Modal */}
      <Modal
        isOpen={showReasonModal}
        onClose={() => { setShowReasonModal(false); setSelectedStudent(null); }}
        title="Mark Absent"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Why is <strong>{selectedStudent?.firstName} {selectedStudent?.lastName}</strong> absent?
          </p>
          
          <div className="space-y-2">
            {absentReasons.map((reason) => (
              <button
                key={reason.value}
                onClick={() => setSelectedReason(reason.value)}
                className={clsx(
                  'w-full p-3 text-left rounded-lg border-2 transition-all',
                  selectedReason === reason.value
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {reason.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setShowReasonModal(false); setSelectedStudent(null); }}>
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-red-600 hover:bg-red-700" 
              onClick={handleAbsentWithReason}
            >
              Mark Absent
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
