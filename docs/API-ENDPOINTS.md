# API Endpoints

## Overview

Base URL: `http://school.local/api` or `http://<server-ip>/api`

All endpoints return JSON and require authentication unless noted otherwise.

## Authentication

### POST /auth/login
Login and receive tokens.

**Request:**
```json
{
  "email": "teacher@school.local",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "teacher@school.local",
    "firstName": "John",
    "lastName": "Doe",
    "role": "TEACHER"
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token cookie.

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### POST /auth/logout
Logout and revoke refresh token.

### GET /auth/me
Get current user profile.

---

## Teacher Dashboard

### GET /teacher/dashboard
Get teacher's classes with today's session status.

**Response:**
```json
{
  "date": "2024-01-15",
  "classes": [
    {
      "id": "uuid",
      "name": "Class 5",
      "section": "A",
      "studentCount": 35,
      "morning": {
        "status": "SUBMITTED",
        "submittedAt": "2024-01-15T08:30:00Z",
        "presentCount": 32,
        "absentCount": 3
      },
      "afternoon": {
        "status": "NOT_STARTED",
        "submittedAt": null,
        "presentCount": 0,
        "absentCount": 0
      }
    }
  ]
}
```

### GET /teacher/classes/:classId/students
Get students for a class (cached).

**Response:**
```json
{
  "classId": "uuid",
  "className": "Class 5",
  "section": "A",
  "students": [
    {
      "id": "uuid",
      "admissionNo": "2024001",
      "firstName": "Alice",
      "lastName": "Smith",
      "rollNo": 1,
      "photoUrl": null
    }
  ],
  "cachedAt": "2024-01-15T06:00:00Z"
}
```

---

## Attendance

### GET /attendance/:classId/:date/:session
Get current attendance state for a session.

**Response:**
```json
{
  "classId": "uuid",
  "date": "2024-01-15",
  "session": "MORNING",
  "status": "SUBMITTED",
  "isLocked": false,
  "submittedAt": "2024-01-15T08:30:00Z",
  "submittedBy": {
    "id": "uuid",
    "name": "John Doe"
  },
  "records": [
    {
      "studentId": "uuid",
      "studentName": "Alice Smith",
      "admissionNo": "2024001",
      "status": "PRESENT",
      "earlyLeave": null,
      "notes": null
    },
    {
      "studentId": "uuid",
      "studentName": "Bob Johnson",
      "admissionNo": "2024002",
      "status": "ABSENT",
      "earlyLeave": null,
      "notes": "Parent called - sick"
    }
  ],
  "canEdit": true,
  "editWindowEndsAt": "2024-01-15T10:30:00Z"
}
```

### POST /attendance/sync
Submit or sync attendance event (idempotent).

**Headers:**
```
X-Idempotency-Key: teacher-123:class-456:2024-01-15:MORNING:SUBMIT:1705312800000
```

**Request:**
```json
{
  "classId": "uuid",
  "date": "2024-01-15",
  "session": "MORNING",
  "eventType": "SUBMIT",
  "records": [
    {
      "studentId": "uuid",
      "status": "PRESENT"
    },
    {
      "studentId": "uuid",
      "status": "ABSENT",
      "notes": "Parent called"
    }
  ],
  "clientCreatedAt": "2024-01-15T08:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "uuid",
  "syncedAt": "2024-01-15T08:30:05Z"
}
```

### POST /attendance/edit
Edit attendance (within edit window).

**Request:**
```json
{
  "classId": "uuid",
  "date": "2024-01-15",
  "session": "MORNING",
  "eventType": "EDIT",
  "editReason": "Parent confirmed late arrival",
  "records": [
    {
      "studentId": "uuid",
      "status": "LATE"
    }
  ],
  "clientCreatedAt": "2024-01-15T09:00:00Z"
}
```

### POST /attendance/lock
Lock attendance session (Principal only).

**Request:**
```json
{
  "classId": "uuid",
  "date": "2024-01-15",
  "session": "MORNING",
  "reason": "End of day lock"
}
```

### POST /attendance/unlock
Unlock attendance session (Principal only).

**Request:**
```json
{
  "classId": "uuid",
  "date": "2024-01-15",
  "session": "MORNING",
  "reason": "Correction needed"
}
```

---

## Students

### GET /students
List students with pagination and filters.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `classId` (optional)
- `search` (optional)
- `isActive` (default: true)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "admissionNo": "2024001",
      "firstName": "Alice",
      "lastName": "Smith",
      "dateOfBirth": "2012-05-15",
      "gender": "FEMALE",
      "class": {
        "id": "uuid",
        "name": "Class 5",
        "section": "A"
      },
      "guardians": [
        {
          "name": "John Smith",
          "relationship": "FATHER",
          "phone": "+1234567890",
          "isPrimary": true
        }
      ],
      "isActive": true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### GET /students/:id
Get student details with attendance history.

### POST /students
Create new student (Admin only).

### PUT /students/:id
Update student (Admin only).

### DELETE /students/:id
Soft delete student (Admin only).

### GET /students/:id/attendance
Get student attendance history.

**Query Parameters:**
- `startDate`
- `endDate`

---

## Classes

### GET /classes
List all classes.

### GET /classes/:id
Get class details with students.

### POST /classes
Create class (Admin only).

### PUT /classes/:id
Update class (Admin only).

### DELETE /classes/:id
Soft delete class (Admin only).

---

## Teachers

### GET /teachers
List all teachers.

### GET /teachers/:id
Get teacher details with assigned classes.

### POST /teachers
Create teacher with user account (Admin only).

### PUT /teachers/:id
Update teacher (Admin only).

### DELETE /teachers/:id
Soft delete teacher (Admin only).

---

## Teacher Assignments

### GET /teachers/:id/assignments
Get teacher's class assignments.

### POST /teachers/:id/assignments
Assign teacher to class.

**Request:**
```json
{
  "classId": "uuid",
  "isPrimary": true
}
```

### DELETE /teachers/:id/assignments/:classId
Remove teacher from class.

---

## Reports

### GET /reports/daily-absent
Get daily absent list.

**Query Parameters:**
- `date` (required)
- `session` (optional: MORNING, AFTERNOON)
- `classId` (optional)

**Response:**
```json
{
  "date": "2024-01-15",
  "morning": {
    "total": 5,
    "students": [
      {
        "id": "uuid",
        "name": "Bob Johnson",
        "class": "Class 5-A",
        "guardianPhone": "+1234567890"
      }
    ]
  },
  "afternoon": {
    "total": 3,
    "students": [...]
  }
}
```

### GET /reports/monthly-attendance
Get monthly attendance summary.

**Query Parameters:**
- `month` (YYYY-MM)
- `classId` (optional)

### GET /reports/chronic-absentees
Get chronic absentee list.

**Query Parameters:**
- `startDate`
- `endDate`
- `threshold` (percentage, default from settings)

### GET /reports/teacher-submissions
Get teacher submission timeliness report.

**Query Parameters:**
- `startDate`
- `endDate`
- `teacherId` (optional)

---

## Exports

### POST /exports/attendance
Generate attendance export.

**Request:**
```json
{
  "format": "PDF",
  "type": "DAILY_ABSENT",
  "date": "2024-01-15",
  "classId": "uuid"
}
```

**Response:**
```json
{
  "jobId": "uuid",
  "status": "PROCESSING"
}
```

### GET /exports/:jobId
Get export status and download URL.

**Response:**
```json
{
  "jobId": "uuid",
  "status": "COMPLETED",
  "downloadUrl": "/api/exports/uuid/download",
  "expiresAt": "2024-01-15T12:00:00Z"
}
```

### GET /exports/:jobId/download
Download generated export file.

---

## Users (Admin only)

### GET /users
List all users.

### POST /users
Create user.

### PUT /users/:id
Update user.

### DELETE /users/:id
Deactivate user.

### POST /users/:id/reset-password
Reset user password.

---

## System Settings (Admin only)

### GET /settings
Get all system settings.

### PUT /settings
Update settings.

### GET /settings/:key
Get specific setting.

---

## Audit Logs (Admin/Principal)

### GET /audit-logs
Get audit logs with filters.

**Query Parameters:**
- `entityType`
- `entityId`
- `userId`
- `action`
- `startDate`
- `endDate`
- `page`
- `limit`

---

## Backup (Admin only)

### POST /backup/create
Create database backup.

### GET /backup/list
List available backups.

### POST /backup/restore
Restore from backup.

---

## Health

### GET /health
Health check (public).

**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2024-01-15T08:00:00Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate idempotency key) |
| 422 | Unprocessable Entity (business rule violation) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| POST /auth/login | 5 requests per minute |
| POST /auth/refresh | 10 requests per minute |
| All other endpoints | 100 requests per minute |
