import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Check, 
  X, 
  AlertCircle,
  UserCheck,
  Search
} from 'lucide-react';
import { teacherApi, attendanceApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { 
  savePendingEvent, 
  generateIdempotencyKey,
  cacheStudents,
  getCachedStudents
} from '../../services/offlineDb';
import type { Student, AttendanceRecord, AttendanceStatus } from '../../types';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; short: string }> = {
  PRESENT: { label: 'Present', color: 'bg-green-500', short: 'P' },
  ABSENT: { label: 'Absent', color: 'bg-red-500', short: 'A' },
  LATE: { label: 'Late', color: 'bg-yellow-500', short: 'L' },
  EXCUSED: { label: 'Excused', color: 'bg-violet-500', short: 'E' },
  SICK: { label: 'Sick', color: 'bg-pink-500', short: 'S' },
};

const STATUS_ORDER: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'];

export default function AttendancePage() {
  const { classId, session } = useParams<{ classId: string; session: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isOnline = useNetworkStatus();
  const today = new Date().toISOString().split('T')[0];

  const [records, setRecords] = useState<Map<string, AttendanceRecord>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch students
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students', classId],
    queryFn: async () => {
      // Try cache first
      if (classId) {
        const cached = await getCachedStudents(classId);
        if (cached) return { students: cached };
      }
      
      const data = await teacherApi.getClassStudents(classId!);
      // Cache for offline use
      if (classId) {
        await cacheStudents(classId, data.students);
      }
      return data;
    },
    enabled: !!classId,
  });

  // Initialize all students as present
  useEffect(() => {
    if (studentsData?.students) {
      const initialRecords = new Map<string, AttendanceRecord>();
      studentsData.students.forEach((student: Student) => {
        initialRecords.set(student.id, {
          studentId: student.id,
          status: 'PRESENT',
        });
      });
      setRecords(initialRecords);
    }
  }, [studentsData]);

  // Update student status
  const updateStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => {
      const newRecords = new Map(prev);
      const record = newRecords.get(studentId);
      if (record) {
        newRecords.set(studentId, { ...record, status });
      }
      return newRecords;
    });
  }, []);

  // Mark all present
  const markAllPresent = () => {
    setRecords((prev) => {
      const newRecords = new Map(prev);
      newRecords.forEach((record, id) => {
        newRecords.set(id, { ...record, status: 'PRESENT' });
      });
      return newRecords;
    });
  };

  // Count statuses
  const statusCounts = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0,
    SICK: 0,
  };
  records.forEach((record) => {
    statusCounts[record.status]++;
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const recordsArray = Array.from(records.values());
      const idempotencyKey = generateIdempotencyKey(
        user?.id || 'unknown',
        classId!,
        today,
        session!,
        'SUBMIT'
      );

      const eventData = {
        idempotencyKey,
        classId: classId!,
        date: today,
        session: session as 'MORNING' | 'AFTERNOON',
        records: recordsArray,
        clientCreatedAt: new Date().toISOString(),
      };

      // Save to IndexedDB first (offline-first)
      await savePendingEvent({
        ...eventData,
        status: 'PENDING',
        retryCount: 0,
        createdAt: Date.now(),
      });

      // Try to sync if online
      if (isOnline) {
        try {
          await attendanceApi.submit(eventData);
        } catch {
          // Will be retried by sync service
          console.log('Sync failed, will retry later');
        }
      }

      return true;
    },
    onSuccess: () => {
      navigate('/');
    },
  });

  // Filter students by search
  const filteredStudents = studentsData?.students?.filter((student: Student) => {
    if (!searchQuery) return true;
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-semibold text-gray-900">
                  {studentsData?.className || 'Class'} | {session}
                </h1>
                <p className="text-sm text-gray-500">
                  {filteredStudents.length} students
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={submitMutation.isPending}
              className="btn btn-primary text-sm py-2 px-4"
            >
              {submitMutation.isPending ? 'Saving...' : 'Submit'}
            </button>
          </div>

          {/* Status summary */}
          <div className="mt-3 flex items-center gap-2 text-sm overflow-x-auto pb-1">
            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full whitespace-nowrap">
              <Check className="w-3 h-3" />
              {statusCounts.PRESENT + statusCounts.LATE} present
            </span>
            <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full whitespace-nowrap">
              <X className="w-3 h-3" />
              {statusCounts.ABSENT} absent
            </span>
            {statusCounts.SICK > 0 && (
              <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full whitespace-nowrap">
                {statusCounts.SICK} sick
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={markAllPresent}
              className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium"
            >
              <UserCheck className="w-4 h-4" />
              Mark All Present
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="input pl-10 py-2 text-sm"
            />
          </div>
        </div>
      </header>

      {/* Student List */}
      <main className="flex-1 p-4 space-y-2">
        {isLoadingStudents ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card">
                <div className="skeleton h-6 w-32 mb-2" />
                <div className="skeleton h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          filteredStudents.map((student: Student, index: number) => {
            const record = records.get(student.id);
            return (
              <div key={student.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      {index + 1}. {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{student.admissionNo}</p>
                  </div>
                </div>

                {/* Status buttons */}
                <div className="flex gap-1">
                  {STATUS_ORDER.map((status) => {
                    const config = STATUS_CONFIG[status];
                    const isSelected = record?.status === status;
                    return (
                      <button
                        key={status}
                        onClick={() => updateStatus(student.id, status)}
                        className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                          isSelected
                            ? `${config.color} text-white`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {config.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Submit Button (Fixed at bottom) */}
      <div className="sticky bottom-0 p-4 bg-white border-t">
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={submitMutation.isPending}
          className="btn btn-primary w-full"
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit Attendance'}
        </button>
        {!isOnline && (
          <p className="text-center text-sm text-yellow-600 mt-2">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Will be saved locally and synced when online
          </p>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Submit {session} Attendance?
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {studentsData?.className} - {new Date().toLocaleDateString()}
            </p>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span>Present:</span>
                <span className="font-medium text-green-600">{statusCounts.PRESENT}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Absent:</span>
                <span className="font-medium text-red-600">{statusCounts.ABSENT}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Late:</span>
                <span className="font-medium text-yellow-600">{statusCounts.LATE}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Excused:</span>
                <span className="font-medium text-violet-600">{statusCounts.EXCUSED}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sick:</span>
                <span className="font-medium text-pink-600">{statusCounts.SICK}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              ⚠️ You can edit within 2 hours of submission
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  submitMutation.mutate();
                }}
                disabled={submitMutation.isPending}
                className="btn btn-primary flex-1"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
