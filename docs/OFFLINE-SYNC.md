# Offline Sync Design

## Overview

The offline sync strategy uses event sourcing for attendance data, ensuring no data loss during network interruptions and reliable synchronization when connectivity is restored.

## Event Model

### Attendance Events

Each attendance action is captured as an immutable event:

```typescript
interface AttendanceEvent {
  id: string;                    // UUID v4
  idempotencyKey: string;        // Unique key for deduplication
  classId: string;
  sessionType: 'MORNING' | 'AFTERNOON';
  date: string;                  // ISO date (YYYY-MM-DD)
  teacherId: string;
  eventType: 'SUBMIT' | 'EDIT' | 'LOCK' | 'UNLOCK';
  records: AttendanceRecord[];
  editReason?: string;           // Required for EDIT events
  createdAt: string;             // ISO timestamp
  clientCreatedAt: string;       // Client-side timestamp
  syncedAt?: string;             // Server confirmation timestamp
}

interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'SICK';
  earlyLeave?: {
    time: string;
    reason: string;
  };
  notes?: string;
}
```

### Idempotency Keys

Format: `{teacherId}:{classId}:{date}:{session}:{eventType}:{timestamp}`

Example: `teacher-123:class-456:2024-01-15:MORNING:SUBMIT:1705312800000`

**Purpose:**
- Prevent duplicate event processing
- Allow safe retry of failed syncs
- Identify and merge conflicting events

## Client-Side Storage (IndexedDB)

### Database Schema

```typescript
// Database: school_attendance_db

// Store: pending_events
// Key: idempotencyKey
{
  idempotencyKey: string;
  event: AttendanceEvent;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'SYNCED';
  retryCount: number;
  lastError?: string;
  createdAt: number;
  lastAttemptAt?: number;
}

// Store: attendance_cache
// Key: {classId}:{date}:{session}
{
  classId: string;
  date: string;
  session: 'MORNING' | 'AFTERNOON';
  records: AttendanceRecord[];
  status: 'DRAFT' | 'SUBMITTED' | 'SYNCED' | 'LOCKED';
  lastModified: number;
  syncedAt?: number;
}

// Store: students_cache
// Key: classId
{
  classId: string;
  students: Student[];
  cachedAt: number;
}
```

### Sync Service

```typescript
class AttendanceSyncService {
  private readonly MAX_RETRIES = 5;
  private readonly BASE_DELAY = 1000; // 1 second
  private readonly MAX_DELAY = 30000; // 30 seconds

  async processQueue(): Promise<void> {
    const pendingEvents = await this.getPendingEvents();
    
    for (const item of pendingEvents) {
      if (item.status === 'SYNCING') continue;
      if (item.retryCount >= this.MAX_RETRIES) {
        await this.markAsFailed(item, 'Max retries exceeded');
        continue;
      }

      await this.syncEvent(item);
    }
  }

  private async syncEvent(item: PendingEvent): Promise<void> {
    await this.updateStatus(item.idempotencyKey, 'SYNCING');

    try {
      const response = await fetch('/api/attendance/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': item.idempotencyKey,
        },
        body: JSON.stringify(item.event),
      });

      if (response.ok) {
        await this.markAsSynced(item);
        await this.updateCache(item.event);
      } else if (response.status === 409) {
        // Conflict - event already processed
        await this.handleConflict(item, await response.json());
      } else {
        throw new Error(`Sync failed: ${response.status}`);
      }
    } catch (error) {
      await this.handleRetry(item, error);
    }
  }

  private calculateBackoff(retryCount: number): number {
    const delay = this.BASE_DELAY * Math.pow(2, retryCount);
    return Math.min(delay, this.MAX_DELAY);
  }
}
```

## Server-Side Processing

### Event Processing Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Receive    │     │   Validate   │     │   Process    │
│    Event     │────►│    Event     │────►│    Event     │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                            ┌────────────────────┤
                            │                    │
                     ┌──────▼──────┐     ┌───────▼──────┐
                     │   Store     │     │   Update     │
                     │   Event     │     │   Snapshot   │
                     └─────────────┘     └──────────────┘
```

### Validation Rules

1. **Authentication**: Valid JWT token required
2. **Authorization**: Teacher must be assigned to the class
3. **Edit Window**: Check if edit window is still open
4. **Lock Status**: Check if session is locked
5. **Date Validation**: Date must be valid school day

### Snapshot Table

The snapshot table provides fast reads for current attendance state:

```sql
CREATE TABLE attendance_snapshots (
  id UUID PRIMARY KEY,
  class_id UUID NOT NULL,
  session_type VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  student_id UUID NOT NULL,
  status VARCHAR(10) NOT NULL,
  early_leave_time TIME,
  early_leave_reason TEXT,
  notes TEXT,
  submitted_by UUID,
  submitted_at TIMESTAMP,
  last_edited_by UUID,
  last_edited_at TIMESTAMP,
  is_locked BOOLEAN DEFAULT FALSE,
  locked_by UUID,
  locked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_id, session_type, date, student_id)
);
```

### Event Processing Logic

```typescript
async function processAttendanceEvent(event: AttendanceEvent): Promise<void> {
  const existingEvent = await findByIdempotencyKey(event.idempotencyKey);
  
  if (existingEvent) {
    // Already processed - return success (idempotent)
    return { status: 'already_processed', eventId: existingEvent.id };
  }

  // Validate business rules
  await validateEvent(event);

  // Begin transaction
  await prisma.$transaction(async (tx) => {
    // 1. Store the event
    const storedEvent = await tx.attendanceEvent.create({
      data: {
        id: event.id,
        idempotencyKey: event.idempotencyKey,
        classId: event.classId,
        sessionType: event.sessionType,
        date: event.date,
        teacherId: event.teacherId,
        eventType: event.eventType,
        payload: event,
        createdAt: new Date(),
      },
    });

    // 2. Update snapshots
    for (const record of event.records) {
      await tx.attendanceSnapshot.upsert({
        where: {
          classId_sessionType_date_studentId: {
            classId: event.classId,
            sessionType: event.sessionType,
            date: event.date,
            studentId: record.studentId,
          },
        },
        create: {
          classId: event.classId,
          sessionType: event.sessionType,
          date: event.date,
          studentId: record.studentId,
          status: record.status,
          earlyLeaveTime: record.earlyLeave?.time,
          earlyLeaveReason: record.earlyLeave?.reason,
          notes: record.notes,
          submittedBy: event.teacherId,
          submittedAt: new Date(),
        },
        update: {
          status: record.status,
          earlyLeaveTime: record.earlyLeave?.time,
          earlyLeaveReason: record.earlyLeave?.reason,
          notes: record.notes,
          lastEditedBy: event.teacherId,
          lastEditedAt: new Date(),
        },
      });
    }

    // 3. Create audit log
    await tx.auditLog.create({
      data: {
        entityType: 'ATTENDANCE',
        entityId: event.classId,
        action: event.eventType,
        userId: event.teacherId,
        before: null, // Could include previous state for EDITs
        after: event,
        reason: event.editReason,
      },
    });
  });
}
```

## Conflict Resolution

### Conflict Scenarios

| Scenario | Resolution |
|----------|------------|
| Same event submitted twice | Idempotent - return success |
| Teacher edits while offline, Principal locks | Server rejects edit, client shows conflict |
| Two teachers edit same record | Last write wins (by server timestamp) |
| Edit after window closed | Server rejects, client must show locked state |

### Conflict Response

```typescript
interface ConflictResponse {
  status: 'conflict';
  conflictType: 'ALREADY_LOCKED' | 'EDIT_WINDOW_CLOSED' | 'CONCURRENT_EDIT';
  serverState: AttendanceRecord[];
  message: string;
}
```

### Client Conflict Handling

```typescript
async function handleConflict(
  pendingItem: PendingEvent,
  conflict: ConflictResponse
): Promise<void> {
  // Update local cache with server state
  await updateLocalCache(conflict.serverState);
  
  // Remove pending event
  await removePendingEvent(pendingItem.idempotencyKey);
  
  // Notify user
  showToast({
    type: 'warning',
    message: conflict.message,
    action: {
      label: 'View Details',
      onClick: () => showConflictDetails(conflict),
    },
  });
}
```

## Edit Window Rules

### Configuration

```typescript
interface EditWindowConfig {
  defaultWindowMinutes: 120;    // 2 hours
  principalOverride: boolean;   // Principal can edit anytime
  requireReason: boolean;       // All edits require reason
}
```

### Validation

```typescript
function isWithinEditWindow(
  submittedAt: Date,
  config: EditWindowConfig
): boolean {
  const now = new Date();
  const windowEnd = new Date(submittedAt);
  windowEnd.setMinutes(windowEnd.getMinutes() + config.defaultWindowMinutes);
  return now < windowEnd;
}
```

## Locking Mechanism

### Lock Rules

1. Only Principal can lock/unlock sessions
2. Locked sessions cannot be edited by teachers
3. Principal can edit locked sessions with reason
4. Unlock requires reason and creates audit log

### Lock Events

```typescript
interface LockEvent {
  eventType: 'LOCK' | 'UNLOCK';
  classId: string;
  sessionType: 'MORNING' | 'AFTERNOON';
  date: string;
  lockedBy: string;
  reason: string;
}
```

## Sync Status UI

### Status Indicators

| Status | Badge Color | Icon | Description |
|--------|-------------|------|-------------|
| Draft | Yellow | Pencil | Not yet submitted |
| Submitted | Blue | Clock | Saved locally, pending sync |
| Syncing | Blue Pulse | Spinner | Currently syncing |
| Synced | Green | Check | Confirmed by server |
| Failed | Red | X | Sync failed, will retry |
| Locked | Gray | Lock | Cannot be edited |

### Last Sync Display

```
Last synced: 2 minutes ago
or
Last synced: Today at 10:30 AM
or
⚠️ Not synced (offline)
```

## Network Detection

```typescript
class NetworkMonitor {
  private isOnline = navigator.onLine;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    window.addEventListener('online', () => this.updateStatus(true));
    window.addEventListener('offline', () => this.updateStatus(false));
  }

  private updateStatus(online: boolean): void {
    this.isOnline = online;
    this.listeners.forEach(listener => listener(online));
    
    if (online) {
      // Trigger sync when coming back online
      syncService.processQueue();
    }
  }

  subscribe(listener: (online: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
```

## Data Recovery

### Recovery Scenarios

1. **Power outage during sync**: Events remain in SYNCING state, will be retried on next app load
2. **Browser crash**: IndexedDB persists, queue intact
3. **Clear browser data**: Only affects unsynced data (user is warned)
4. **Server unavailable**: Retry with backoff, eventually fail with notification

### Startup Recovery

```typescript
async function initializeApp(): Promise<void> {
  // 1. Check for stuck syncing events
  const stuckEvents = await getPendingEvents('SYNCING');
  for (const event of stuckEvents) {
    // Reset to pending for retry
    await updateStatus(event.idempotencyKey, 'PENDING');
  }

  // 2. Process queue
  await syncService.processQueue();

  // 3. Verify cache freshness
  await refreshStaleCache();
}
```
