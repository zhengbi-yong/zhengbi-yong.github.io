# Backend Docker Compose Configuration

## Overview
Docker Compose configurations for deploying the blog backend in different environments (development, production, simple).

**Purpose**: Container orchestration for backend services
**Stack**: Docker Compose, PostgreSQL, Redis, Rust (Axum)

## Configuration Files

```
deployments/docker/compose-files/backend/
├── docker-compose.yml         # Main production configuration
├── docker-compose.prod.yml    # Production overrides
├── docker-compose.dev.yml     # Development configuration
├── docker-compose.simple.yml  # Minimal setup (testing)
└── CLAUDE.md                  # This file
```

## Main Configuration (docker-compose.yml)

### Services

**backend**:
```yaml
backend:
  build:
    context: ../../..
    dockerfile: docker/Dockerfile.backend
  ports:
    - "3000:3000"
  environment:
    - DATABASE_URL=postgresql://blog:password@db:5432/blog
    - REDIS_URL=redis://redis:6379
    - JWT_SECRET=${JWT_SECRET}
    # ... other env vars
  depends_on:
    - db
    - redis
```

**db** (PostgreSQL):
```yaml
db:
  image: postgres:16-alpine
  volumes:
    - postgres_data:/var/lib/postgresql/data
  environment:
    - POSTGRES_USER=blog
    - POSTGRES_PASSWORD=password
    - POSTGRES_DB=blog
```

**redis**:
```yaml
redis:
  image: redis:7-alpine
  volumes:
    - redis_data:/data
```

### Volumes
```yaml
volumes:
  postgres_data:  # PostgreSQL data persistence
  redis_data:     # Redis persistence
```

## Production Configuration (docker-compose.prod.yml)

### Overrides

**Backend**:
```yaml
backend:
  environment:
    - RUST_LOG=info  # Production logging
    - SERVER_HOST=0.0.0.0
    - SERVER_PORT=3000
  restart: unless-stopped
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

**Database**:
```yaml
db:
  environment:
    - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}  # From env file
  volumes:
    - ./postgres_data:/var/lib/postgresql/data  # Named volume
  restart: unless-stopped
```

### Production Considerations
- Use strong passwords from `.env` file
- Enable health checks
- Restart policies (`unless-stopped`)
- Named volumes for data persistence
- Log rotation (configure in Docker daemon)

## Development Configuration (docker-compose.dev.yml)

### Overrides

**Backend**:
```yaml
backend:
  build:
    target: development  # Development stage
  environment:
    - RUST_LOG=debug  # Verbose logging
  volumes:
    - ./backend:/app/src  # Hot reload
    - cargo_cache:/usr/local/cargo/registry  # Cache dependencies
  command: cargo watch -x run  # Auto-reload on changes
```

**Database**:
```yaml
db:
  ports:
    - "5432:5432"  # Expose for local tools
```

### Development Features
- Hot reload with `cargo watch`
- Exposed database port for local tools
- Debug logging
- Cargo cache to speed up rebuilds
- Source code mounting

## Simple Configuration (docker-compose.simple.yml)

### Minimal Setup

**Single service**:
```yaml
backend:
  image: blog-api:latest
  ports:
    - "3000:3000"
  environment:
    # Use external database/redis
    - DATABASE_URL=${DATABASE_URL}
    - REDIS_URL=${REDIS_URL}
```

**Use Case**: Testing without local database

## Environment Variables

### Required (.env file)
```bash
# JWT
JWT_SECRET=your-secret-key-at-least-32-characters-long
PASSWORD_PEPPER=your-pepper-string

# Database
POSTGRES_USER=blog
POSTGRES_PASSWORD=secure-password-here
POSTGRES_DB=blog

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_TLS=true
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Optional
```bash
SERVER_HOST=0.0.0.0
SERVER_PORT=3000
RUST_LOG=info  # debug | info | warn | error
```

## Usage

### Development
```bash
cd deployments/docker/compose-files/backend

# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Build and start
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Stop
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend
```

### Production
```bash
# Create .env file
cat > .env <<EOF
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
PASSWORD_PEPPER=$(openssl rand -base64 32)
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-password
# ... other vars
EOF

# Start production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Simple/Testing
```bash
# Use external database
export DATABASE_URL=postgresql://user:pass@external-db:5432/blog
export REDIS_URL=redis://external-redis:6379

docker-compose -f docker-compose.simple.yml up
```

## Dockerfile Integration

**Backend Dockerfile** (at `docker/Dockerfile.backend`):
```dockerfile
# Base stage
FROM rust:1.75-alpine AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY backend ./backend
RUN cargo build --release

# Runtime stage
FROM alpine:latest
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/target/release/api /usr/local/bin/api
EXPOSE 3000
CMD ["api"]
```

**Build**:
```bash
docker build -f docker/Dockerfile.backend -t blog-api:latest .
```

## Networking

**Default network**:
```yaml
networks:
  default:
    driver: bridge
```

**Service communication**:
- Backend → `db:5432`
- Backend → `redis:6379`
- Host → `localhost:3000`

## Data Persistence

### Volumes

**PostgreSQL**:
```bash
docker volume inspect backend_postgres_data
```

**Backup**:
```bash
# Backup database
docker-compose exec db pg_dump -U blog blog > backup.sql

# Restore
docker-compose exec -T db psql -U blog blog < backup.sql
```

**Redis**:
```bash
# Backup
docker-compose exec redis redis-cli SAVE

# Copy RDB file
docker cp backend_redis_1:/data/dump.rdb ./backup/
```

## Health Checks

**Backend**:
```bash
curl http://localhost:3000/health
```

**Expected Response**:
```json
{
  "status": "healthy"
}
```

**Database**:
```bash
docker-compose exec db pg_isready -U blog
```

**Redis**:
```bash
docker-compose exec redis redis-cli ping
# Response: PONG
```

## Scaling

### Horizontal Scaling (backend)
```bash
docker-compose up -d --scale backend=3
```

**Requires**:
- External PostgreSQL (handle multiple connections)
- External Redis (handle multiple connections)
- Load balancer (nginx, traefik)

### Vertical Scaling
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

## Monitoring

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Metrics
Backend exposes Prometheus metrics at `/metrics`:
```bash
curl http://localhost:3000/metrics
```

**Metrics Include**:
- Request count
- Response time
- Database query time
- Active connections
- Error rate

## Troubleshooting

### Common Issues

**1. Database connection fails**
```bash
# Check database is running
docker-compose ps db

# Check logs
docker-compose logs db

# Connect manually
docker-compose exec db psql -U blog -d blog
```

**2. Backend crashes on startup**
```bash
# Check logs
docker-compose logs backend

# Common causes:
# - Missing .env file
# - Invalid JWT_SECRET (too short)
# - Database not ready
```

**3. CORS errors in browser**
```bash
# Check CORS_ALLOWED_ORIGINS in .env
# Should match frontend URL exactly
```

**4. Migrations fail**
```bash
# Run migrations manually
docker-compose exec backend sqlx database create
docker-compose exec backend sqlx migrate run
```

## Security Best Practices

### 1. Use Secrets Management
```bash
# Docker secrets (swarm mode)
echo "secret-value" | docker secret create jwt_secret -

# Use in compose
services:
  backend:
    secrets:
      - jwt_secret
secrets:
  jwt_secret:
    external: true
```

### 2. Network Isolation
```yaml
networks:
  frontend:
  backend:

services:
  backend:
    networks:
      - backend  # No direct internet access

  nginx:
    networks:
      - frontend
      - backend  # Proxy only
```

### 3. Read-Only Filesystem
```yaml
backend:
  read_only: true
  tmpfs:
    - /tmp
```

### 4. Drop Privileges
```dockerfile
# In Dockerfile
RUN addgroup -g 1000 app && \
    adduser -D -u 1000 -G app app
USER app
```

## Deployment Checklist

### Pre-Deployment
- [ ] Generate strong secrets (JWT, password, pepper)
- [ ] Configure SMTP settings
- [ ] Set CORS allowed origins
- [ ] Create .env file
- [ ] Test build: `docker-compose build`

### Post-Deployment
- [ ] Run migrations: `docker-compose exec backend sqlx migrate run`
- [ ] Create admin user: `docker-compose exec backend api create-admin`
- [ ] Verify health check: `curl http://localhost:3000/health`
- [ ] Test database connection
- [ ] Test Redis connection
- [ ] Review logs for errors

### Monitoring Setup
- [ ] Configure log aggregation (ELK, Loki)
- [ ] Set up metrics collection (Prometheus)
- [ ] Configure alerts (Grafana, PagerDuty)
- [ ] Set up backups (database, volumes)

## Related Files
- `docker/Dockerfile.backend` - Backend container image
- `../../.env.example` - Environment variable template
- `backend/migrations/` - Database migrations
- `deployments/k8s/` - Kubernetes manifests (alternative)
