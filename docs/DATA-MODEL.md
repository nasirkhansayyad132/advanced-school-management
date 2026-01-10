# Data Model

## Entity Relationship Diagram

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      Users       │     │     Teachers     │     │     Students     │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │     │ id (PK)          │
│ email            │     │ user_id (FK)     │     │ admission_no     │
│ password_hash    │     │ employee_id      │     │ first_name       │
│ role             │     │ phone            │     │ last_name        │
│ is_active        │     │ address          │     │ date_of_birth    │
│ created_at       │     │ qualification    │     │ gender           │
│ updated_at       │     │ created_at       │     │ class_id (FK)    │
└──────────────────┘     └────────┬─────────┘     │ guardians        │
                                  │               │ is_active        │
                         ┌────────┼───────────────┤ created_at       │
                         │        │               └────────┬─────────┘
                         ▼        │                        │
           ┌──────────────────┐   │                        │
           │ TeacherClassAssign│  │                        │
           ├──────────────────┤   │                        │
           │ id (PK)          │   │                        │
           │ teacher_id (FK)──┼───┘                        │
           │ class_id (FK)────┼───────┐                    │
           │ is_primary       │       │                    │
           │ created_at       │       │                    │
           └──────────────────┘       │                    │
                                      ▼                    │
                         ┌──────────────────┐              │
                         │     Classes      │              │
                         ├──────────────────┤              │
                         │ id (PK)          │◄─────────────┘
                         │ name             │
                         │ section          │
                         │ grade            │
                         │ academic_year    │
                         │ is_active        │
                         │ created_at       │
                         └────────┬─────────┘
                                  │
                                  ▼
           ┌──────────────────────────────────────────────────────┐
           │                                                      │
           ▼                                                      ▼
┌──────────────────┐                               ┌──────────────────┐
│AttendanceEvents  │                               │AttendanceSnapshots│
├──────────────────┤                               ├──────────────────┤
│ id (PK)          │                               │ id (PK)          │
│ idempotency_key  │                               │ class_id (FK)    │
│ class_id (FK)    │                               │ session_type     │
│ session_type     │                               │ date             │
│ date             │                               │ student_id (FK)  │
│ teacher_id (FK)  │                               │ status           │
│ event_type       │                               │ early_leave_time │
│ payload (JSON)   │                               │ early_leave_reason│
│ created_at       │                               │ notes            │
│ client_created_at│                               │ submitted_by     │
└──────────────────┘                               │ submitted_at     │
                                                   │ last_edited_by   │
                                                   │ last_edited_at   │
                                                   │ is_locked        │
                                                   │ locked_by        │
                                                   │ locked_at        │
                                                   └──────────────────┘

┌──────────────────┐
│    AuditLogs     │
├──────────────────┤
│ id (PK)          │
│ entity_type      │
│ entity_id        │
│ action           │
│ user_id (FK)     │
│ before (JSON)    │
│ after (JSON)     │
│ reason           │
│ ip_address       │
│ user_agent       │
│ created_at       │
└──────────────────┘
```

## Table Definitions

### Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'PRINCIPAL', 'TEACHER', 'ACCOUNTANT')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Teachers

```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  qualification VARCHAR(255),
  date_of_joining DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_employee_id ON teachers(employee_id);
```

### Classes

```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  section VARCHAR(10),
  grade VARCHAR(20) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(name, section, academic_year)
);

CREATE INDEX idx_classes_academic_year ON classes(academic_year);
CREATE INDEX idx_classes_grade ON classes(grade);
```

### Students

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_no VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
  class_id UUID NOT NULL REFERENCES classes(id),
  blood_group VARCHAR(5),
  address TEXT,
  guardians JSONB NOT NULL DEFAULT '[]',
  medical_info TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_admission_no ON students(admission_no);
CREATE INDEX idx_students_name ON students(first_name, last_name);
```

### Guardian Schema (JSONB)

```typescript
interface Guardian {
  name: string;
  relationship: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
  phone: string;
  email?: string;
  occupation?: string;
  isPrimary: boolean;
}
```

### Teacher Class Assignments

```sql
CREATE TABLE teacher_class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(teacher_id, class_id)
);

CREATE INDEX idx_tca_teacher_id ON teacher_class_assignments(teacher_id);
CREATE INDEX idx_tca_class_id ON teacher_class_assignments(class_id);
```

### Attendance Events (Event Store)

```sql
CREATE TABLE attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  class_id UUID NOT NULL REFERENCES classes(id),
  session_type VARCHAR(10) NOT NULL CHECK (session_type IN ('MORNING', 'AFTERNOON')),
  date DATE NOT NULL,
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('SUBMIT', 'EDIT', 'LOCK', 'UNLOCK')),
  payload JSONB NOT NULL,
  client_created_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ae_idempotency_key ON attendance_events(idempotency_key);
CREATE INDEX idx_ae_class_date_session ON attendance_events(class_id, date, session_type);
CREATE INDEX idx_ae_teacher_date ON attendance_events(teacher_id, date);
CREATE INDEX idx_ae_created_at ON attendance_events(created_at);
```

### Attendance Snapshots (Read Model)

```sql
CREATE TABLE attendance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id),
  session_type VARCHAR(10) NOT NULL CHECK (session_type IN ('MORNING', 'AFTERNOON')),
  date DATE NOT NULL,
  student_id UUID NOT NULL REFERENCES students(id),
  status VARCHAR(10) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK')),
  early_leave_time TIME,
  early_leave_reason TEXT,
  notes TEXT,
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP,
  last_edited_by UUID REFERENCES users(id),
  last_edited_at TIMESTAMP,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_by UUID REFERENCES users(id),
  locked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, session_type, date, student_id)
);

CREATE INDEX idx_as_class_date_session ON attendance_snapshots(class_id, date, session_type);
CREATE INDEX idx_as_student_date ON attendance_snapshots(student_id, date);
CREATE INDEX idx_as_status ON attendance_snapshots(status, date);
CREATE INDEX idx_as_submitted_at ON attendance_snapshots(submitted_at);
```

### Attendance Session Summary

```sql
CREATE TABLE attendance_session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id),
  session_type VARCHAR(10) NOT NULL CHECK (session_type IN ('MORNING', 'AFTERNOON')),
  date DATE NOT NULL,
  total_students INTEGER NOT NULL DEFAULT 0,
  present_count INTEGER NOT NULL DEFAULT 0,
  absent_count INTEGER NOT NULL DEFAULT 0,
  late_count INTEGER NOT NULL DEFAULT 0,
  excused_count INTEGER NOT NULL DEFAULT 0,
  sick_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' 
    CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'SYNCED', 'LOCKED')),
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_by UUID REFERENCES users(id),
  locked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, session_type, date)
);

CREATE INDEX idx_ass_class_date ON attendance_session_summaries(class_id, date);
CREATE INDEX idx_ass_date ON attendance_session_summaries(date);
CREATE INDEX idx_ass_status ON attendance_session_summaries(status);
```

### Audit Logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id),
  before_data JSONB,
  after_data JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

### System Settings

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Refresh Tokens

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

## Default System Settings

```json
{
  "school_name": "My School",
  "academic_year": "2024-2025",
  "attendance_edit_window_minutes": 120,
  "chronic_absentee_threshold_percent": 80,
  "morning_session_start": "08:00",
  "morning_session_end": "12:00",
  "afternoon_session_start": "13:00",
  "afternoon_session_end": "16:00"
}
```

## Migration Strategy

### Initial Setup

1. Run Prisma migrations: `npx prisma migrate deploy`
2. Seed admin user: `npx prisma db seed`
3. Configure system settings via admin UI

### Future Migrations

1. Create migration: `npx prisma migrate dev --name description`
2. Test in development
3. Deploy to production: `npx prisma migrate deploy`

### Rollback Strategy

1. Keep migration history
2. Use down migrations for Prisma
3. Backup before any migration

## Query Patterns

### Teacher Dashboard Query

```sql
-- Get today's classes with session status
SELECT 
  c.id,
  c.name,
  c.section,
  (SELECT status FROM attendance_session_summaries 
   WHERE class_id = c.id AND date = CURRENT_DATE AND session_type = 'MORNING') as morning_status,
  (SELECT status FROM attendance_session_summaries 
   WHERE class_id = c.id AND date = CURRENT_DATE AND session_type = 'AFTERNOON') as afternoon_status
FROM classes c
JOIN teacher_class_assignments tca ON tca.class_id = c.id
WHERE tca.teacher_id = $1 AND c.is_active = true
ORDER BY c.name, c.section;
```

### Attendance History Query

```sql
-- Get student attendance history
SELECT 
  date,
  session_type,
  status,
  notes
FROM attendance_snapshots
WHERE student_id = $1
  AND date BETWEEN $2 AND $3
ORDER BY date DESC, session_type;
```

### Monthly Report Query

```sql
-- Monthly attendance percentage per student
SELECT 
  s.id,
  s.first_name,
  s.last_name,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as present_count,
  ROUND(COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END)::numeric / COUNT(*) * 100, 2) as attendance_percent
FROM students s
LEFT JOIN attendance_snapshots a ON a.student_id = s.id
WHERE s.class_id = $1
  AND a.date BETWEEN $2 AND $3
GROUP BY s.id, s.first_name, s.last_name
ORDER BY s.first_name, s.last_name;
```
