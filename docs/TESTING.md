# Testing Plan

## Overview

This document outlines the testing strategy for the School Management System MVP.

## Test Pyramid

```
         ┌──────────┐
         │   E2E    │  ~10 tests
         │  Tests   │
         └────┬─────┘
        ┌─────┴──────┐
        │Integration │  ~50 tests
        │   Tests    │
        └──────┬─────┘
      ┌────────┴────────┐
      │   Unit Tests    │  ~200 tests
      └─────────────────┘
```

## Unit Tests

### Backend (NestJS + Jest)

#### Authentication Module
```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens for valid credentials');
    it('should throw UnauthorizedException for invalid password');
    it('should throw UnauthorizedException for non-existent user');
    it('should throw ForbiddenException for inactive user');
    it('should update lastLoginAt on successful login');
  });

  describe('refreshToken', () => {
    it('should return new access token for valid refresh token');
    it('should throw UnauthorizedException for expired refresh token');
    it('should throw UnauthorizedException for revoked refresh token');
    it('should rotate refresh token on use');
  });

  describe('validateToken', () => {
    it('should return user for valid access token');
    it('should throw UnauthorizedException for expired token');
    it('should throw UnauthorizedException for invalid token');
  });
});
```

#### Attendance Rules
```typescript
describe('AttendanceService', () => {
  describe('validateSubmission', () => {
    it('should allow submission for assigned class');
    it('should reject submission for unassigned class');
    it('should reject submission for locked session');
    it('should reject submission for future date');
    it('should reject duplicate submission without edit flag');
  });

  describe('isWithinEditWindow', () => {
    it('should return true within 2 hours of submission');
    it('should return false after 2 hours of submission');
    it('should respect custom edit window setting');
    it('should always return true for Principal role');
  });

  describe('processEvent', () => {
    it('should create snapshot records on first submission');
    it('should update snapshot records on edit');
    it('should handle idempotent submission');
    it('should create audit log entry');
    it('should calculate session summary');
  });

  describe('lockSession', () => {
    it('should lock session for Principal');
    it('should reject lock for non-Principal');
    it('should create audit log for lock');
  });
});
```

#### Attendance Calculations
```typescript
describe('AttendanceCalculations', () => {
  describe('calculateAttendancePercentage', () => {
    it('should calculate 100% for all present');
    it('should calculate 0% for all absent');
    it('should include Late as present');
    it('should exclude Excused from calculation');
    it('should handle empty session list');
  });

  describe('identifyChronicAbsentees', () => {
    it('should flag students below threshold');
    it('should respect configurable threshold');
    it('should calculate across date range');
  });

  describe('calculateDailyAbsentList', () => {
    it('should include Absent status');
    it('should include Sick status');
    it('should include Excused status');
    it('should exclude Present and Late');
    it('should separate morning and afternoon');
  });
});
```

#### RBAC Authorization
```typescript
describe('RbacGuard', () => {
  describe('canActivate', () => {
    it('should allow Admin to access all routes');
    it('should allow Principal to access read routes');
    it('should restrict Teacher to own classes');
    it('should block unauthenticated requests');
  });
});
```

### Frontend (React + Vitest)

#### Attendance Components
```typescript
describe('AttendanceToggle', () => {
  it('should render all status options');
  it('should highlight current status');
  it('should call onChange when status clicked');
  it('should be accessible with keyboard');
  it('should show loading state');
});

describe('AttendanceList', () => {
  it('should render student list');
  it('should handle mark all present');
  it('should filter by search query');
  it('should show status counts');
  it('should virtualize long lists');
});

describe('SyncStatus', () => {
  it('should show online indicator');
  it('should show offline indicator');
  it('should show pending count');
  it('should show last sync time');
  it('should animate while syncing');
});
```

#### Offline Queue
```typescript
describe('OfflineQueue', () => {
  describe('enqueue', () => {
    it('should save event to IndexedDB');
    it('should generate idempotency key');
    it('should set status to pending');
  });

  describe('process', () => {
    it('should send pending events to server');
    it('should update status to synced on success');
    it('should retry on network error');
    it('should use exponential backoff');
    it('should handle partial failures');
  });

  describe('dequeue', () => {
    it('should remove synced events');
    it('should keep failed events');
  });
});
```

## Integration Tests

### API Endpoints (Supertest)

```typescript
describe('POST /api/auth/login', () => {
  it('should return 200 with tokens for valid login');
  it('should return 401 for invalid credentials');
  it('should set refresh token cookie');
  it('should be rate limited after 5 attempts');
});

describe('GET /api/teacher/dashboard', () => {
  it('should return assigned classes for teacher');
  it('should include session status for today');
  it('should return 401 without auth token');
});

describe('POST /api/attendance/sync', () => {
  it('should create attendance records');
  it('should be idempotent with same key');
  it('should reject for unassigned class');
  it('should reject for locked session');
  it('should create audit log');
});

describe('GET /api/reports/daily-absent', () => {
  it('should return absent students');
  it('should filter by session');
  it('should filter by class');
  it('should require Principal or Admin role');
});
```

### Database (Prisma + PostgreSQL)

```typescript
describe('Database Constraints', () => {
  it('should enforce unique class-date-session-student');
  it('should cascade delete teacher assignments');
  it('should prevent orphan attendance records');
});

describe('Indexes Performance', () => {
  it('should use index for attendance lookup');
  it('should use index for student search');
  it('should use index for audit log queries');
});
```

## E2E Tests (Playwright)

### Critical User Flows

```typescript
describe('Teacher Attendance Flow', () => {
  test('complete morning attendance submission', async () => {
    // 1. Login as teacher
    await page.goto('/login');
    await page.fill('[name=email]', 'teacher@school.local');
    await page.fill('[name=password]', 'password');
    await page.click('button[type=submit]');
    
    // 2. Navigate to class
    await expect(page).toHaveURL('/dashboard');
    await page.click('text=Take Attendance >> nth=0');
    
    // 3. Mark attendance (all present by default)
    await page.click('text=Mark All Present');
    await expect(page.locator('[data-status=PRESENT]')).toHaveCount(35);
    
    // 4. Mark one student absent
    await page.click('[data-student="student-1"] [data-status=ABSENT]');
    
    // 5. Submit
    await page.click('text=Submit Attendance');
    await page.click('text=Confirm');
    
    // 6. Verify success
    await expect(page.locator('text=Attendance submitted')).toBeVisible();
  });

  test('offline attendance with sync', async () => {
    // 1. Login while online
    await loginAsTeacher(page);
    
    // 2. Go offline
    await context.setOffline(true);
    await expect(page.locator('text=Offline')).toBeVisible();
    
    // 3. Submit attendance
    await submitAttendance(page, 'class-1', 'MORNING');
    await expect(page.locator('text=Saved locally')).toBeVisible();
    
    // 4. Go online
    await context.setOffline(false);
    
    // 5. Wait for sync
    await expect(page.locator('text=Synced')).toBeVisible({ timeout: 10000 });
  });
});

describe('Principal Lock Flow', () => {
  test('lock and unlock session', async () => {
    // 1. Login as principal
    await loginAsPrincipal(page);
    
    // 2. Navigate to locks
    await page.click('text=Attendance Locks');
    
    // 3. Lock morning session
    await page.click('[data-class="class-1"][data-session=MORNING] text=Lock');
    await page.fill('[name=reason]', 'End of day lock');
    await page.click('text=Confirm Lock');
    
    // 4. Verify locked
    await expect(page.locator('[data-class="class-1"][data-session=MORNING] text=Locked')).toBeVisible();
  });
});

describe('Admin User Management', () => {
  test('create new teacher', async () => {
    await loginAsAdmin(page);
    await page.click('text=Teachers');
    await page.click('text=Add Teacher');
    // Fill form
    await page.fill('[name=firstName]', 'Jane');
    await page.fill('[name=lastName]', 'Doe');
    await page.fill('[name=email]', 'jane@school.local');
    await page.click('text=Save');
    await expect(page.locator('text=Teacher created')).toBeVisible();
  });
});
```

## Performance Tests

### Load Testing (k6)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,        // 50 concurrent users
  duration: '5m', // 5 minute test
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

export default function () {
  // Simulate teacher dashboard load
  const dashboardRes = http.get('http://school.local/api/teacher/dashboard', {
    headers: { Authorization: `Bearer ${__VU_TOKEN}` },
  });
  check(dashboardRes, { 'dashboard status 200': (r) => r.status === 200 });

  // Simulate attendance submission
  const attendanceRes = http.post(
    'http://school.local/api/attendance/sync',
    JSON.stringify(attendancePayload),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(attendanceRes, { 'attendance status 200': (r) => r.status === 200 });

  sleep(1);
}
```

### Response Time Targets

| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| GET /teacher/dashboard | <50ms | <100ms | <200ms |
| POST /attendance/sync | <100ms | <200ms | <500ms |
| GET /reports/daily-absent | <200ms | <500ms | <1000ms |
| POST /exports/attendance | <500ms | <2000ms | <5000ms |

## Accessibility Tests

```typescript
describe('Accessibility', () => {
  it('should have no critical a11y violations on login page');
  it('should have no critical a11y violations on dashboard');
  it('should have no critical a11y violations on attendance form');
  it('should be navigable with keyboard only');
  it('should work with screen reader');
});
```

## Test Data Management

### Seed Data

```typescript
// prisma/seed.ts
async function main() {
  // Create admin user
  await prisma.user.create({
    data: {
      email: 'admin@school.local',
      passwordHash: await hash('admin123'),
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  // Create classes
  for (let grade = 1; grade <= 10; grade++) {
    for (const section of ['A', 'B']) {
      await prisma.class.create({
        data: {
          name: `Class ${grade}`,
          section,
          grade: String(grade),
          academicYear: '2024-2025',
        },
      });
    }
  }

  // Create 30 students per class
  // Create 25 teachers
  // Create teacher assignments
}
```

### Test Fixtures

```typescript
// tests/fixtures.ts
export const testTeacher = {
  email: 'test.teacher@school.local',
  password: 'testpass123',
  firstName: 'Test',
  lastName: 'Teacher',
  role: 'TEACHER',
};

export const testAttendanceSubmission = {
  classId: 'test-class-id',
  date: '2024-01-15',
  session: 'MORNING',
  records: [
    { studentId: 'student-1', status: 'PRESENT' },
    { studentId: 'student-2', status: 'ABSENT' },
  ],
};
```

## CI/CD Testing

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

## Test Coverage Targets

| Module | Target |
|--------|--------|
| Auth | 90% |
| Attendance | 95% |
| Reports | 85% |
| Users | 80% |
| API Routes | 90% |
| UI Components | 80% |
