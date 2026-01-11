export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'ACCOUNTANT';
}

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface ClassInfo {
  id: string;
  name: string;
  section: string | null;
  studentCount: number;
  isPrimary: boolean;
  morning: SessionStatus;
  afternoon: SessionStatus;
}

export interface SessionStatus {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'SYNCED' | 'LOCKED';
  submittedAt: string | null;
  presentCount: number;
  absentCount: number;
  isLocked: boolean;
}

export interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'SICK';

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  earlyLeave?: {
    time: string;
    reason: string;
  };
  notes?: string;
}

export interface PendingAttendanceEvent {
  idempotencyKey: string;
  classId: string;
  date: string;
  session: 'MORNING' | 'AFTERNOON';
  records: AttendanceRecord[];
  clientCreatedAt: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastError?: string;
  createdAt: number;
  lastAttemptAt?: number;
}
