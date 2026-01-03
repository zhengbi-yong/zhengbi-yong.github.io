# scripts/dev

## Purpose

Development utilities for running and managing local development environment.

## Core Components

### restart_backend.sh
**Purpose**: Rebuilds and restarts backend API server

**Flow**:
```
1. Navigate to backend directory
2. Build Rust binary (cargo build --bin api)
3. Start server with development environment variables:
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379
   - API: 127.0.0.1:3000
   - CORS: localhost:3000-3003
   - Rate limiting: 1000 req/min
```

**Environment Variables**:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Development JWT secret (32+ chars)
- `PASSWORD_PEPPER`: Password encryption pepper
- `SESSION_SECRET`: Session management secret
- `CORS_ALLOWED_ORIGINS`: Comma-separated frontend URLs
- `RUST_LOG`: Log level (debug/info/warn/error)
- `PROMETHEUS_ENABLED`: Enable metrics collection
- `SMTP_*`: Email configuration (dev defaults)

**Usage**:
```bash
./scripts/dev/restart_backend.sh
```

### start-local.sh
**Purpose**: Start all services (backend + frontend) for local development

**Flow**:
```
1. Start backend (./scripts/dev/restart_backend.sh &)
2. Wait 3 seconds for backend initialization
3. Start frontend (cd frontend && PORT=3001 pnpm dev &)
4. Display service URLs and wait for Ctrl+C
```

**Port Configuration**:
- Backend: http://localhost:3000
- Frontend: http://localhost:3001

**Graceful Shutdown**: Ctrl+C stops both services

**Usage**:
```bash
./scripts/dev/start-local.sh
```

## Integration Points

### Backend Service
- **Directory**: `./backend`
- **Language**: Rust
- **Framework**: Custom API with Axum
- **Database**: PostgreSQL + Redis

### Frontend Service
- **Directory**: `./frontend`
- **Language**: TypeScript
- **Framework**: Next.js 15
- **Package Manager**: pnpm

## Development Workflow

1. **Start Backend Only**:
   ```bash
   ./scripts/dev/restart_backend.sh
   ```

2. **Start Full Stack**:
   ```bash
   ./scripts/dev/start-local.sh
   ```

3. **Access Services**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Admin Panel: http://localhost:3001/admin

## Dependencies

- Docker (for PostgreSQL/Redis containers)
- Cargo/Rust (backend compilation)
- pnpm (frontend package manager)
- Bash (script execution)

## Error Handling

**Build Failures**:
- Backend build fails: Script exits with error code 1
- Frontend start fails: Check port 3001 availability

**Database Connection**:
- Ensure PostgreSQL container running: `docker ps | grep blog-postgres`
- Check DATABASE_URL matches docker-compose configuration

**Port Conflicts**:
- Backend 3000: `lsof -i :3000` (Unix) or `netstat -ano | findstr :3000` (Windows)
- Frontend 3001: Change PORT variable in start-local.sh

## Common Issues

**Backend fails to start**:
1. Check database connectivity: `docker exec blog-postgres ping -c 1 localhost`
2. Verify environment variables
3. Check logs: `./target/debug/api` (runs in foreground)

**Frontend build errors**:
1. Clean install: `cd frontend && rm -rf node_modules && pnpm install`
2. Check Node.js version: `node --version` (should match .nvmrc)

**Services not communicating**:
1. Verify CORS_ALLOWED_ORIGINS includes frontend URL
2. Check network mode in docker-compose
3. Review firewall settings

## See Also

- `./scripts/operations/start.sh` - Production deployment startup
- `./backend/README.md` - Backend architecture
- `./frontend/README.md` - Frontend architecture
- `./docker-compose.yml` - Container orchestration
