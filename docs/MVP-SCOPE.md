# School Management System - MVP Scope

## Overview
A local-first School Management System designed for schools with limited or no internet connectivity. The system runs on the school LAN with an offline-capable Teacher PWA.

## MVP Features (IN SCOPE)

### 1. Attendance Management (Core Feature)
- **Two sessions per day**: MORNING and AFTERNOON
- **Teacher Dashboard**: Shows assigned classes with session status
- **Attendance statuses**: Present, Absent, Late, Excused, Sick
- **Mark all present** + tap exceptions workflow
- **Early Leave**: Optional with time and reason
- **Notes/Incidents**: Per-session notes
- **Offline-first**: IndexedDB queue with automatic sync
- **Edit rules**: Configurable edit window (default 2 hours)
- **Audit logging**: Immutable log of all changes
- **Locking**: Principal can lock class/day/session

### 2. Reports & Exports
- Daily absent lists (morning & afternoon)
- Monthly attendance percentage
- Chronic absentee list (configurable threshold)
- Teacher submission timeliness
- PDF and CSV exports
- Printable daily absent lists

### 3. Core School Data
- Student profiles with guardian information
- Classes and Sections
- Teachers with class assignments
- Users, roles, and permissions

### 4. User Roles (RBAC)
- **Admin**: Full system control
- **Principal**: View all + locks + override approvals + reports
- **Teacher**: Attendance only + view assigned classes
- **Accountant**: Placeholder for future fees module

### 5. Technical Features
- JWT authentication with refresh tokens
- Offline-capable PWA for teachers
- Swagger/OpenAPI documentation
- Docker Compose deployment

## OUT OF SCOPE (MVP)

### Not Included in MVP
- ❌ Complex per-period timetables
- ❌ Fee management
- ❌ Parent/Student portal
- ❌ Cloud backup (Phase 2)
- ❌ VPN/Remote access (Phase 2)
- ❌ Read-only cloud portal (Phase 3)
- ❌ Multi-tenant architecture
- ❌ Two-way cloud sync
- ❌ Email/SMS notifications
- ❌ Academic grading
- ❌ Library management
- ❌ Transport management
- ❌ Hostel management
- ❌ Multi-language support

## Success Criteria

### Performance Targets
- Page load: < 2 seconds on low-end Android
- API response: < 200ms on LAN
- Offline attendance: Works with zero network
- Sync: Automatic retry with exponential backoff

### User Experience
- Teacher can submit attendance in 2-3 taps
- Premium, modern UI with consistent design
- Large touch targets for mobile use
- Clear sync status and offline indicators

### Reliability
- No data loss during Wi-Fi drops
- Safe backup/restore workflow
- Audit trail for all changes
- Handle power outages gracefully

## Roadmap

### Phase 1: Local MVP (Current)
- Complete local-first system
- All attendance features
- Admin dashboard
- Reports and exports

### Phase 2: Cloud Backup + Remote Access
- Encrypted daily backups
- Optional S3/R2 upload
- VPN/tunnel for remote access

### Phase 3: Read-Only Cloud Portal
- Cloud portal for parents/principal
- Local → Cloud summary push
- View-only access outside school
