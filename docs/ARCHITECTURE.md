# School Management System - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SCHOOL LAN NETWORK                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐ │
│  │  Teacher    │    │   Admin     │    │     On-Prem Server      │ │
│  │  PWA App    │    │   Web App   │    │                         │ │
│  │  (Mobile)   │    │  (Desktop)  │    │  ┌─────────────────┐    │ │
│  │             │    │             │    │  │   Caddy/Nginx   │    │ │
│  │ ┌─────────┐ │    │             │    │  │  Reverse Proxy  │    │ │
│  │ │IndexedDB│ │    │             │    │  └────────┬────────┘    │ │
│  │ │ Queue   │ │    │             │    │           │             │ │
│  │ └─────────┘ │    │             │    │  ┌────────▼────────┐    │ │
│  │             │    │             │    │  │   NestJS API    │    │ │
│  └──────┬──────┘    └──────┬──────┘    │  │   (Backend)     │    │ │
│         │                  │           │  └────────┬────────┘    │ │
│         │   HTTP/REST      │           │           │             │ │
│         └──────────────────┴───────────┼───────────┤             │ │
│                                        │  ┌────────▼────────┐    │ │
│                                        │  │   PostgreSQL    │    │ │
│                                        │  │   (Database)    │    │ │
│                                        │  └─────────────────┘    │ │
│                                        │                         │ │
│                                        │  ┌─────────────────┐    │ │
│                                        │  │     Redis       │    │ │
│                                        │  │  (Job Queue)    │    │ │
│                                        │  └─────────────────┘    │ │
│                                        │                         │ │
│                                        └─────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. On-Prem Server
- **Hardware**: Mini PC, Raspberry Pi 4+, or repurposed laptop
- **OS**: Ubuntu Server 22.04 LTS or Debian 12
- **Requirements**: 4GB RAM, 64GB storage minimum

### 2. Reverse Proxy (Caddy)
- Handles HTTPS on LAN with auto-generated certificates
- Routes requests to appropriate services
- Provides compression and caching
- Access via `school.local` or IP address

### 3. NestJS Backend API
- TypeScript-based REST API
- JWT authentication with refresh tokens
- RBAC authorization
- Swagger/OpenAPI documentation
- Input validation with class-validator
- Audit logging for all mutations

### 4. PostgreSQL Database
- Primary data store
- Event sourcing for attendance
- Indexes optimized for common queries
- WAL mode for durability

### 5. Redis
- BullMQ job queue
- Session caching (optional)
- Background task processing

### 6. Teacher PWA
- React + TypeScript
- Service Worker for offline support
- IndexedDB for local data queue
- Automatic sync with retry logic
- Works without network connectivity

### 7. Admin Web App
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Full CRUD for school data
- Reports and analytics
- User and role management

## Data Flow

### Attendance Submission Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Teacher    │     │  IndexedDB   │     │   NestJS     │     │  PostgreSQL  │
│    Action    │     │    Queue     │     │    API       │     │   Database   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │ 1. Mark Attendance │                    │                    │
       │───────────────────►│                    │                    │
       │                    │                    │                    │
       │ 2. Save to Queue   │                    │                    │
       │    (with idempotency key)               │                    │
       │◄───────────────────│                    │                    │
       │                    │                    │                    │
       │ 3. Show Success    │                    │                    │
       │    (Optimistic UI) │                    │                    │
       │                    │                    │                    │
       │                    │ 4. Sync (when online)                   │
       │                    │───────────────────►│                    │
       │                    │                    │                    │
       │                    │                    │ 5. Process Event   │
       │                    │                    │───────────────────►│
       │                    │                    │                    │
       │                    │                    │ 6. Update Snapshot │
       │                    │                    │───────────────────►│
       │                    │                    │                    │
       │                    │ 7. Confirm Sync    │                    │
       │                    │◄───────────────────│                    │
       │                    │                    │                    │
       │ 8. Update UI Status│                    │                    │
       │◄───────────────────│                    │                    │
       │                    │                    │                    │
```

### Sync Service Behavior

1. **Queue Management**: All attendance actions are saved to IndexedDB with unique idempotency keys
2. **Retry Logic**: Failed syncs retry with exponential backoff (1s, 2s, 4s, 8s, max 30s)
3. **Conflict Resolution**: Server is source of truth; newer events override older ones
4. **Partial Failure Handling**: Individual student records can fail independently
5. **Status Indicators**: UI shows sync status (Pending, Syncing, Synced, Failed)

## Security Architecture

### Authentication
- JWT access tokens (15 min expiry)
- Refresh tokens (7 day expiry, stored in HttpOnly cookie)
- Token rotation on refresh
- Bcrypt password hashing

### Authorization (RBAC)
```
Admin        → Full access to all resources
Principal    → Read all + lock/unlock + approvals + reports
Teacher      → Attendance for assigned classes only
Accountant   → Fees module only (Phase 2)
```

### API Security
- Rate limiting on auth endpoints
- Input validation on all endpoints
- SQL injection prevention (Prisma)
- XSS prevention (React)
- CSRF protection

## Deployment Architecture

### Docker Compose Services

```yaml
services:
  caddy:        # Reverse proxy with HTTPS
  api:          # NestJS backend
  db:           # PostgreSQL database
  redis:        # Job queue
  migrate:      # Database migrations (init only)
```

### Network Configuration
- All services on internal Docker network
- Only Caddy exposes ports (80, 443)
- API accessible via `school.local/api`
- Frontend served from `school.local`

### Backup Strategy (Phase 2)
- Daily automated PostgreSQL dumps
- Encrypted backup files (AES-256)
- Local storage with rotation (keep last 7 days)
- Optional upload to S3/R2 when internet available

## Performance Optimizations

### Frontend
- Route-based code splitting
- Lazy loading for heavy components
- Virtualized lists for large datasets
- Optimistic UI updates
- Service Worker caching

### Backend
- Proper database indexes
- Eager loading to prevent N+1
- Response compression
- Connection pooling
- Query result caching

### Database Indexes
```sql
-- Attendance queries
CREATE INDEX idx_attendance_class_date_session ON attendance_events(class_id, date, session);
CREATE INDEX idx_attendance_student_date ON attendance_events(student_id, date);
CREATE INDEX idx_attendance_teacher_date ON attendance_events(teacher_id, date);

-- Audit queries
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);

-- User queries
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_teacher_assignments ON teacher_class_assignments(teacher_id);
```

## Future Architecture (Phase 2 & 3)

### Phase 2: Cloud Backup
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  On-Prem    │     │   VPN/      │     │   Cloud     │
│  Server     │────►│   Tunnel    │────►│   Storage   │
│             │     │  (WireGuard)│     │   (S3/R2)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Phase 3: Read-Only Portal
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  On-Prem    │     │   Summary   │     │   Cloud     │
│  Server     │────►│    Push     │────►│   Portal    │
│             │     │  (One-way)  │     │ (Read-only) │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          │ Idempotent upserts
                          │ (attendance summaries,
                          │  not raw events)
                          ▼
                    ┌─────────────┐
                    │  Parents    │
                    │  Principal  │
                    │  (View only)│
                    └─────────────┘
```
