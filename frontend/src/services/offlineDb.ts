import { openDB, type IDBPDatabase } from 'idb';
import type { PendingAttendanceEvent, Student } from '../types';

const DB_NAME = 'school_attendance_db';
const DB_VERSION = 1;

interface SchoolDB {
  pendingEvents: {
    key: string;
    value: PendingAttendanceEvent;
    indexes: { 'by-status': string };
  };
  studentsCache: {
    key: string;
    value: {
      classId: string;
      students: Student[];
      cachedAt: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<SchoolDB>> | null = null;

async function getDB(): Promise<IDBPDatabase<SchoolDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SchoolDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Pending events store
        const eventsStore = db.createObjectStore('pendingEvents', {
          keyPath: 'idempotencyKey',
        });
        eventsStore.createIndex('by-status', 'status');

        // Students cache store
        db.createObjectStore('studentsCache', {
          keyPath: 'classId',
        });
      },
    });
  }
  return dbPromise;
}

// Pending Events Operations
export async function savePendingEvent(event: PendingAttendanceEvent): Promise<void> {
  const db = await getDB();
  await db.put('pendingEvents', event);
}

export async function getPendingEvents(): Promise<PendingAttendanceEvent[]> {
  const db = await getDB();
  return db.getAll('pendingEvents');
}

export async function getPendingEventsByStatus(
  status: PendingAttendanceEvent['status']
): Promise<PendingAttendanceEvent[]> {
  const db = await getDB();
  return db.getAllFromIndex('pendingEvents', 'by-status', status);
}

export async function updateEventStatus(
  idempotencyKey: string,
  status: PendingAttendanceEvent['status'],
  lastError?: string
): Promise<void> {
  const db = await getDB();
  const event = await db.get('pendingEvents', idempotencyKey);
  if (event) {
    event.status = status;
    event.lastAttemptAt = Date.now();
    if (lastError) {
      event.lastError = lastError;
      event.retryCount = (event.retryCount || 0) + 1;
    }
    await db.put('pendingEvents', event);
  }
}

export async function removePendingEvent(idempotencyKey: string): Promise<void> {
  const db = await getDB();
  await db.delete('pendingEvents', idempotencyKey);
}

// Students Cache Operations
export async function getCachedStudents(classId: string): Promise<Student[] | null> {
  const db = await getDB();
  const cached = await db.get('studentsCache', classId);
  if (!cached) return null;

  // Cache valid for 24 hours
  const isExpired = Date.now() - cached.cachedAt > 24 * 60 * 60 * 1000;
  if (isExpired) return null;

  return cached.students;
}

export async function cacheStudents(classId: string, students: Student[]): Promise<void> {
  const db = await getDB();
  await db.put('studentsCache', {
    classId,
    students,
    cachedAt: Date.now(),
  });
}

// Generate idempotency key
export function generateIdempotencyKey(
  teacherId: string,
  classId: string,
  date: string,
  session: string,
  eventType: string
): string {
  return `${teacherId}:${classId}:${date}:${session}:${eventType}:${Date.now()}`;
}
