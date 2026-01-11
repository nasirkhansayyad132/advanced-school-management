# School Management System

A local-first School Management System designed for schools with limited or no internet connectivity. The system runs on the school LAN with an offline-capable Teacher PWA.

## Features

- **Local-First Architecture**: Works entirely on school LAN with zero internet dependency
- **Offline-Capable Teacher PWA**: Take attendance even when Wi-Fi drops, sync later automatically
- **Fast Performance**: Optimized for low-end Android phones and weak LAN connections
- **Two Sessions Per Day**: Morning and Afternoon attendance tracking
- **Comprehensive RBAC**: Admin, Principal, Teacher, and Accountant roles
- **Audit Logging**: Complete history of all attendance changes
- **Reports & Exports**: Daily absent lists, monthly reports, PDF/CSV exports

## Tech Stack

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Queue**: BullMQ + Redis (for background jobs)
- **Auth**: JWT with refresh tokens
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **PWA**: Service Worker + IndexedDB for offline support

### Deployment
- Docker Compose
- Caddy reverse proxy
- PostgreSQL with WAL for durability

## Quick Start

### Development

1. Clone the repository:
```bash
git clone https://github.com/your-repo/school-management.git
cd school-management
```

2. Start the database:
```bash
docker compose up -d db redis
```

3. Setup backend:
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

4. Access the API at `http://localhost:3000/api`
5. Swagger docs at `http://localhost:3000/api/docs`

### Production Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment instructions.

## Documentation

- [MVP Scope](docs/MVP-SCOPE.md) - What's included and excluded
- [Architecture](docs/ARCHITECTURE.md) - System design and components
- [Offline Sync](docs/OFFLINE-SYNC.md) - How offline sync works
- [Data Model](docs/DATA-MODEL.md) - Database schema and indexes
- [API Endpoints](docs/API-ENDPOINTS.md) - Complete API reference
- [UI Flows](docs/UI-FLOWS.md) - Screen designs and interactions
- [Deployment](docs/DEPLOYMENT.md) - Installation and operations
- [Testing](docs/TESTING.md) - Test strategy and examples
- [Roadmap](docs/ROADMAP.md) - Development phases

## Default Login Credentials

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.local | admin123 |
| Principal | principal@school.local | principal123 |
| Teacher | john.smith@school.local | teacher123 |

## License

MIT