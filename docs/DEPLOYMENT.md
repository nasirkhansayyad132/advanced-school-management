# Deployment Guide

## Prerequisites

### Hardware Requirements

**Minimum (for small school, < 500 students):**
- Mini PC or Raspberry Pi 4 (4GB RAM)
- 64GB storage (SSD recommended)
- Ethernet port

**Recommended (for medium school, 500-1500 students):**
- Mini PC with Intel N100 or equivalent
- 8GB RAM
- 256GB SSD
- Gigabit Ethernet

### Software Requirements

- Ubuntu Server 22.04 LTS or Debian 12
- Docker Engine 24.x or later
- Docker Compose 2.x or later

---

## Docker Compose Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
      - ./frontend/dist:/srv/frontend
    depends_on:
      - api
    networks:
      - school_network

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://school:${DB_PASSWORD}@db:5432/school_db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - school_network

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=school
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=school_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U school -d school_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - school_network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - school_network

  backup:
    build:
      context: ./backup
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      - PGHOST=db
      - PGUSER=school
      - PGPASSWORD=${DB_PASSWORD}
      - PGDATABASE=school_db
      - BACKUP_ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY}
      - S3_BUCKET=${S3_BUCKET:-}
      - S3_ACCESS_KEY=${S3_ACCESS_KEY:-}
      - S3_SECRET_KEY=${S3_SECRET_KEY:-}
    volumes:
      - ./backups:/backups
    depends_on:
      - db
    networks:
      - school_network

volumes:
  postgres_data:
  redis_data:
  caddy_data:
  caddy_config:

networks:
  school_network:
    driver: bridge
```

### Caddyfile

```caddyfile
{
    # Local HTTPS with self-signed cert
    local_certs
}

school.local, localhost, 192.168.1.100 {
    # Serve frontend
    root * /srv/frontend
    file_server

    # API proxy
    handle /api/* {
        reverse_proxy api:3000
    }

    # SPA fallback
    try_files {path} /index.html

    # Compression
    encode gzip

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

### Backend Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

---

## Environment Configuration

### .env file

```bash
# Database
DB_PASSWORD=your_secure_password_here

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Backup Encryption (generate with: openssl rand -base64 32)
BACKUP_ENCRYPTION_KEY=your_backup_key_here

# Optional: S3/R2 for cloud backup
# S3_BUCKET=school-backups
# S3_ACCESS_KEY=
# S3_SECRET_KEY=
# S3_ENDPOINT=

# School Settings
SCHOOL_NAME="My School"
ACADEMIC_YEAR="2024-2025"
```

---

## Installation Steps

### 1. Prepare the Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Reboot
sudo reboot
```

### 2. Clone Repository

```bash
cd /opt
git clone https://github.com/school/management-system.git school
cd school
```

### 3. Configure Environment

```bash
# Copy example environment
cp .env.example .env

# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 24)
BACKUP_KEY=$(openssl rand -base64 32)

# Edit .env with generated values
nano .env
```

### 4. Build and Start

```bash
# Build images
docker compose build

# Start services
docker compose up -d

# Check logs
docker compose logs -f

# Run database seed (first time only)
docker compose exec api npx prisma db seed
```

### 5. Configure LAN Access

#### Option A: Static IP (Recommended)

```bash
# Edit netplan config
sudo nano /etc/netplan/00-installer-config.yaml
```

```yaml
network:
  version: 2
  ethernets:
    eth0:
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

```bash
sudo netplan apply
```

#### Option B: mDNS (school.local)

```bash
# Install Avahi
sudo apt install avahi-daemon -y

# Edit hostname
sudo hostnamectl set-hostname school

# Restart
sudo systemctl restart avahi-daemon
```

---

## Backup & Restore

### Automatic Daily Backup

The backup service runs automatically at 2 AM:

```bash
# Check backup logs
docker compose logs backup

# List backups
ls -la ./backups/
```

### Manual Backup

```bash
# Create backup
docker compose exec backup /scripts/backup.sh

# Backup file location
ls -la ./backups/school_backup_*.sql.gz.enc
```

### Restore from Backup

```bash
# Stop API
docker compose stop api

# Restore (replace with actual backup filename)
docker compose exec backup /scripts/restore.sh school_backup_20240115_020000.sql.gz.enc

# Start API
docker compose start api

# Verify
docker compose logs api
```

### Backup Script

```bash
#!/bin/bash
# /scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/school_backup_${DATE}.sql.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"

# Create backup
pg_dump -Fc | gzip > "$BACKUP_FILE"

# Encrypt
openssl enc -aes-256-cbc -salt -pbkdf2 \
  -in "$BACKUP_FILE" \
  -out "$ENCRYPTED_FILE" \
  -pass env:BACKUP_ENCRYPTION_KEY

# Remove unencrypted
rm "$BACKUP_FILE"

# Keep only last 7 days
find /backups -name "*.enc" -mtime +7 -delete

# Optional: Upload to S3
if [ -n "$S3_BUCKET" ]; then
  aws s3 cp "$ENCRYPTED_FILE" "s3://${S3_BUCKET}/backups/"
fi

echo "Backup completed: $ENCRYPTED_FILE"
```

---

## Updates

### USB Update Bundle

For schools without internet, prepare an update bundle:

```bash
# On development machine
./scripts/create-update-bundle.sh v1.2.0

# Copy to USB drive
# school-update-v1.2.0.tar.gz
```

### Apply Update

```bash
# On school server
cd /opt/school

# Extract update
tar -xzf /media/usb/school-update-v1.2.0.tar.gz

# Apply update
./update.sh
```

### Update Script

```bash
#!/bin/bash
# update.sh

# Create backup first
docker compose exec backup /scripts/backup.sh

# Pull new images or load from bundle
if [ -f "images.tar" ]; then
  docker load -i images.tar
else
  docker compose pull
fi

# Rebuild and restart
docker compose build
docker compose up -d

# Run migrations
docker compose exec api npx prisma migrate deploy

echo "Update complete!"
```

---

## Monitoring

### Health Check

```bash
# Check all services
docker compose ps

# Check API health
curl http://localhost/api/health
```

### Logs

```bash
# All logs
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f db
```

### Resource Usage

```bash
# Docker stats
docker stats

# Disk usage
df -h
docker system df
```

---

## Troubleshooting

### Database Connection Failed

```bash
# Check DB status
docker compose ps db
docker compose logs db

# Restart DB
docker compose restart db
```

### API Not Responding

```bash
# Check API logs
docker compose logs api

# Restart API
docker compose restart api
```

### Out of Disk Space

```bash
# Clean Docker
docker system prune -a

# Clean old backups
ls -la ./backups/
rm ./backups/school_backup_old_*.enc
```

### Reset Everything

```bash
# CAUTION: This deletes all data!
docker compose down -v
docker compose up -d
docker compose exec api npx prisma db seed
```

---

## Security Checklist

- [ ] Change default admin password after first login
- [ ] Use strong passwords for DB and secrets
- [ ] Keep server in secure location
- [ ] Limit physical access to server
- [ ] Regular backup verification
- [ ] Keep system updated

---

## Network Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      School LAN                              │
│                                                              │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│    │ Teacher  │    │ Teacher  │    │  Admin   │            │
│    │  Phone   │    │  Phone   │    │ Laptop   │            │
│    └────┬─────┘    └────┬─────┘    └────┬─────┘            │
│         │               │               │                   │
│         └───────────────┼───────────────┘                   │
│                         │                                   │
│                   ┌─────▼─────┐                            │
│                   │  Wi-Fi    │                            │
│                   │  Router   │                            │
│                   └─────┬─────┘                            │
│                         │                                   │
│                   ┌─────▼─────┐                            │
│                   │  Server   │                            │
│                   │ 192.168.  │                            │
│                   │   1.100   │                            │
│                   └───────────┘                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```
