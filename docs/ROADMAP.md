# Project Roadmap

## Overview

This roadmap outlines the phased development of the School Management System, prioritizing a stable local-first product before adding cloud features.

---

## Phase 1: Local MVP (Weeks 1-8)

**Goal:** Complete local-first system with all attendance features running on school LAN.

### Week 1-2: Foundation

- [x] Project structure and documentation
- [ ] NestJS backend setup with TypeScript
- [ ] Prisma schema and initial migrations
- [ ] PostgreSQL and Redis configuration
- [ ] Docker Compose for development

**Deliverables:**
- Working development environment
- Database schema complete
- Basic API structure

### Week 3-4: Core Modules

- [ ] Authentication module (JWT + refresh tokens)
- [ ] RBAC authorization guards
- [ ] Users CRUD (Admin only)
- [ ] Classes CRUD
- [ ] Students CRUD with guardians
- [ ] Teachers CRUD with assignments
- [ ] Swagger/OpenAPI documentation

**Deliverables:**
- All core CRUD APIs working
- Authentication flow complete
- API documentation

### Week 5-6: Attendance Module

- [ ] Attendance event model (event sourcing)
- [ ] Attendance snapshots (read model)
- [ ] Submit attendance endpoint
- [ ] Edit attendance with audit trail
- [ ] Lock/unlock sessions (Principal)
- [ ] Edit window enforcement
- [ ] Attendance validation rules

**Deliverables:**
- Complete attendance API
- Event sourcing implemented
- Audit logging working

### Week 7-8: Frontend Development

- [ ] React + TypeScript + Vite setup
- [ ] Tailwind CSS + shadcn/ui components
- [ ] Admin dashboard
  - [ ] Login page
  - [ ] Dashboard with stats
  - [ ] Students management
  - [ ] Classes management
  - [ ] Teachers management
  - [ ] User management
- [ ] Teacher PWA
  - [ ] Mobile-first login
  - [ ] Today's classes dashboard
  - [ ] Attendance taking screen
  - [ ] Sync status page

**Deliverables:**
- Working admin web app
- Working teacher PWA (online only)

---

## Phase 1.5: Offline Support (Weeks 9-10)

**Goal:** Make teacher PWA work completely offline.

### Week 9: PWA & IndexedDB

- [ ] Service Worker setup
- [ ] App manifest for installable PWA
- [ ] IndexedDB schema for offline queue
- [ ] Local attendance storage
- [ ] Network status detection

**Deliverables:**
- Installable PWA
- Offline data persistence

### Week 10: Sync Service

- [ ] Background sync implementation
- [ ] Idempotency key handling
- [ ] Conflict resolution
- [ ] Retry with exponential backoff
- [ ] Sync status UI indicators
- [ ] Offline/online toast notifications

**Deliverables:**
- Complete offline support
- Reliable sync mechanism

---

## Phase 1.7: Reports & Exports (Weeks 11-12)

**Goal:** Complete reporting and export functionality.

### Week 11: Reports

- [ ] Daily absent list report
- [ ] Monthly attendance summary
- [ ] Chronic absentee identification
- [ ] Teacher submission timeliness
- [ ] Student attendance history

**Deliverables:**
- All report APIs working
- Report UI screens

### Week 12: Exports & Polish

- [ ] PDF generation (pdfkit/puppeteer)
- [ ] CSV exports
- [ ] Print-friendly layouts
- [ ] BullMQ job queue for exports
- [ ] UI/UX polish and testing
- [ ] Performance optimization

**Deliverables:**
- Export functionality
- Production-ready UI

---

## Phase 1.9: Deployment & Testing (Weeks 13-14)

**Goal:** Prepare for production deployment.

### Week 13: Deployment Setup

- [ ] Production Docker Compose
- [ ] Caddy reverse proxy configuration
- [ ] Environment configuration
- [ ] Database backup scripts
- [ ] Update bundle creation

**Deliverables:**
- Deployment documentation
- Backup/restore scripts

### Week 14: Testing & Documentation

- [ ] Unit tests for critical paths
- [ ] Integration tests for APIs
- [ ] E2E tests for key flows
- [ ] Performance testing
- [ ] User documentation
- [ ] Admin training guide

**Deliverables:**
- Test suite with >80% coverage
- Complete documentation

---

## Phase 2: Cloud Backup + Remote Access (Weeks 15-18)

**Goal:** Add secure cloud backup and optional remote access.

### Week 15-16: Backup System

- [ ] Automated daily backups
- [ ] AES-256 encryption
- [ ] Local backup rotation
- [ ] S3/R2 upload (when internet available)
- [ ] Backup verification
- [ ] Restore procedure testing

**Deliverables:**
- Encrypted backup system
- Cloud backup integration

### Week 17-18: Remote Access

- [ ] WireGuard VPN setup guide
- [ ] Cloudflare Tunnel integration (optional)
- [ ] Remote access documentation
- [ ] Security hardening guide

**Deliverables:**
- VPN/tunnel setup scripts
- Remote access documentation

---

## Phase 3: Read-Only Cloud Portal (Weeks 19-24)

**Goal:** Provide view-only access for parents and principal outside school.

### Week 19-20: Cloud Infrastructure

- [ ] Cloud portal architecture design
- [ ] Serverless API (AWS Lambda / Cloudflare Workers)
- [ ] Cloud database (PlanetScale / Neon)
- [ ] Authentication for cloud portal

**Deliverables:**
- Cloud infrastructure setup
- Authentication flow

### Week 21-22: Local → Cloud Sync

- [ ] Summary aggregation service
- [ ] One-way push mechanism
- [ ] Idempotent upserts
- [ ] Sync scheduling (when internet available)
- [ ] Conflict-free data model

**Deliverables:**
- Local to cloud sync working
- Data consistency verification

### Week 23-24: Portal UI

- [ ] Parent portal
  - [ ] Child attendance summary
  - [ ] Monthly reports
  - [ ] Notification preferences
- [ ] Principal portal
  - [ ] School-wide dashboards
  - [ ] Class comparisons
  - [ ] Alert notifications

**Deliverables:**
- Read-only cloud portal
- Mobile-responsive design

---

## Future Considerations (Post-MVP)

### Academic Year Rollover
- [ ] Year-end data archival
- [ ] Class promotion
- [ ] New academic year setup

### Fee Management (Phase 4)
- [ ] Fee structure setup
- [ ] Invoice generation
- [ ] Payment recording
- [ ] Payment reminders
- [ ] Financial reports

### Additional Features (Phase 5+)
- [ ] SMS/Email notifications
- [ ] Multi-language support
- [ ] Academic grading
- [ ] Report cards
- [ ] Parent communication
- [ ] Library management
- [ ] Transport management

---

## Success Metrics

### Phase 1 MVP
| Metric | Target |
|--------|--------|
| Attendance submission time | < 30 seconds |
| API response time (P95) | < 200ms |
| PWA load time (repeat visit) | < 1 second |
| Offline sync success rate | > 99% |
| System uptime | > 99.5% |

### Phase 2 Backup
| Metric | Target |
|--------|--------|
| Backup success rate | 100% |
| Restore time | < 15 minutes |
| Backup encryption | AES-256 |

### Phase 3 Cloud Portal
| Metric | Target |
|--------|--------|
| Sync latency | < 5 minutes |
| Portal load time | < 2 seconds |
| Data accuracy | 100% |

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| Power outages | PostgreSQL WAL mode, UPS recommendation |
| Wi-Fi unreliability | Complete offline support, background sync |
| Low-end devices | Performance optimization, minimal bundle size |
| Data loss | Multiple backup locations, verified restore |

### Operational Risks

| Risk | Mitigation |
|------|------------|
| User adoption | Simple UI, minimal training required |
| Technical support | Comprehensive documentation, remote diagnostics |
| Hardware failure | Backup/restore documentation, cheap replacement |

---

## Team Structure (Recommended)

### Phase 1 (MVP)
- 1 Full-stack developer (lead)
- 1 Frontend developer (PWA specialist)
- 1 QA engineer (part-time)

### Phase 2-3 (Cloud)
- Add: 1 DevOps/Cloud engineer

---

## Budget Considerations

### Hardware (One-time)
- Server: $200-500
- UPS: $50-100
- Router: $50-100

### Software (Free/Open Source)
- PostgreSQL: Free
- Redis: Free
- Docker: Free
- All development tools: Free

### Cloud (Phase 2-3, Monthly)
- Cloudflare R2: ~$5/month
- Cloud database: ~$20/month
- Hosting (portal): ~$10/month

---

## Release Schedule

| Version | Date | Content |
|---------|------|---------|
| v0.1.0 | Week 4 | Core APIs complete |
| v0.5.0 | Week 8 | Frontend complete (online) |
| v0.8.0 | Week 10 | Offline support complete |
| v1.0.0 | Week 14 | MVP ready for production |
| v1.5.0 | Week 18 | Cloud backup ready |
| v2.0.0 | Week 24 | Cloud portal ready |
