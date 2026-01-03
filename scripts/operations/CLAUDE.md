# scripts/operations

## Purpose

Operations scripts for development, testing, and production deployment of the blog platform. Provides unified interfaces for starting services, managing containers, and system health monitoring.

## Core Components

### start-dev.sh
**Purpose**: Start complete development environment with health checks and process management

**Services Started**:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend API (port 3000)
- Frontend (port 3001)

**Usage**:
```bash
# Start all services
./scripts/operations/start-dev.sh

# Skip databases (if already running)
./scripts/operations/start-dev.sh --no-db

# Clean build before starting
./scripts/operations/start-dev.sh --clean

# Start only backend
./scripts/operations/start-dev.sh --no-frontend --no-db
```

**Options**:
- `--no-backend`: Skip backend startup
- `--no-frontend`: Skip frontend startup
- `--no-db`: Skip database startup
- `--clean`: Clean build artifacts before starting
- `--help`: Show help message

**Features**:
- Dependency checking (Docker, Rust, pnpm)
- Automatic environment configuration
- Health check monitoring
- Graceful shutdown (Ctrl+C)
- Color-coded output
- Process tracking with PIDs

**Environment Setup**:
- Backend `.env`: Created automatically with dev defaults
- Frontend `.env.local`: Created with API URLs
- Database credentials: `blog_user:blog_password@localhost:5432/blog_db`

**Health Checks**:
```bash
# Manual health check
curl http://localhost:3000/healthz
curl http://localhost:3001

# Database connectivity
docker exec blog-postgres pg_isready -U blog_user -d blog_db
docker exec blog-redis redis-cli ping
```

### start-prod.sh
**Purpose**: Production deployment with Docker containers and orchestration

**Commands**:
```bash
# Full deployment
./scripts/operations/start-prod.sh deploy

# Start existing services
./scripts/operations/start-prod.sh start

# Stop services
./scripts/operations/start-prod.sh stop

# Restart services
./scripts/operations/start-prod.sh restart

# Show service status
./scripts/operations/start-prod.sh status

# View logs
./scripts/operations/start-prod.sh logs [backend|frontend|postgres|redis]

# Clean build artifacts
./scripts/operations/start-prod.sh clean
```

**Options**:
- `--build-only`: Build images without starting
- `--no-cache`: Build without cache
- `--force`: Force redeployment (stop existing services)
- `--dry-run`: Show what would be done without executing

**Deployment Process**:
```
1. Check dependencies (Docker, docker-compose, Cargo, pnpm)
2. Validate production configuration (.env.production files)
3. Create Docker network (blog-network)
4. Build optimized Docker images
   - Backend: Multi-stage build (Rust release)
   - Frontend: pnpm build + Nginx/Node server
5. Start databases with health checks
6. Deploy backend service
7. Deploy frontend service
8. Run health checks
9. Display deployment information
```

**Configuration Requirements**:
- `backend/.env.production`: Production environment variables
- `frontend/.env.production`: Frontend production config
- Secure JWT_SECRET (not default value)
- Secure PASSWORD_PEPPER (not default value)

**Production Docker Images**:
- `blog-platform-backend:latest`: Optimized Rust binary
- `blog-platform-frontend:latest`: Static build or Node server

**Health Monitoring**:
```bash
# Service status
./scripts/operations/start-prod.sh status

# Real-time logs
./scripts/operations/start-prod.sh logs backend
./scripts/operations/start-prod.sh logs frontend
```

### start.sh
**Purpose**: Quick deployment startup using pre-built Docker images

**Prerequisites**:
- Docker images built: `blog-backend:local`, `blog-frontend:local`
- Built via: `./build-all.sh` (referenced in script)

**Process**:
```
1. Verify Docker images exist
2. Stop and remove old containers
3. Create .env from .env.local.example if needed
4. Start services via docker-compose.local.yml
5. Display service URLs
```

**Usage**:
```bash
./scripts/operations/start.sh
```

**Output**:
```
Frontend: http://localhost:3001
Backend: http://localhost:3000

View logs:
  docker compose -f docker-compose.local.yml logs -f

Stop services:
  docker compose -f docker-compose.local.yml down
```

### quick-test.sh
**Purpose**: MDX rendering functionality validation script

**Test Flow**:
```
1. Check Docker environment
2. Start PostgreSQL and Redis
3. Wait for database ready (10s)
4. Check/start backend Docker image
5. Test backend API health
6. Insert test MDX content with:
   - Math formulas (inline and block)
   - Code blocks with syntax highlighting
   - Nested lists
   - Tables
7. Verify test data insertion
8. Validate API response
9. Provide frontend testing guide
```

**Test Content**:
- Title: "测试MDX渲染功能" (Test MDX Rendering)
- Slug: `test-mdx-rendering`
- Status: published
- Features tested:
  - Math: $E = mc^2$ (inline), $$\int_0^\infty e^{-x^2} dx$$ (block)
  - Code: JavaScript example with syntax highlighting
  - Lists: Nested items
  - Tables: Multi-column data

**Usage**:
```bash
./scripts/operations/quick-test.sh
```

**Frontend Testing**:
```bash
# Start frontend (after backend test passes)
cd frontend
pnpm dev

# Visit test article
http://localhost:3001/blog/test-mdx-rendering

# Verify
- Title displays correctly
- Math formulas render
- Code blocks highlight
- Lists and tables format properly
```

## Integration Points

### Docker Compose Files
- `docker-compose.yml`: Development services
- `docker-compose.prod.yml`: Production orchestration
- `docker-compose.local.yml`: Local pre-built images

### Backend Integration
- **Directory**: `./backend`
- **Build**: `cargo build --bin api`
- **Runtime**: `./target/debug/api` (dev) or Docker (prod)
- **Health**: `http://localhost:3000/healthz`

### Frontend Integration
- **Directory**: `./frontend`
- **Build**: `pnpm build`
- **Runtime**: `pnpm dev` (dev) or Docker (prod)
- **Port**: 3001

### Database Services
- **PostgreSQL**: `blog-postgres` container
  - User: `blog_user`
  - Database: `blog_db`
  - Port: 5432 (host), 5432 (container)
- **Redis**: `blog-redis` container
  - Port: 6379 (host), 6379 (container)

## Common Workflows

### Development Setup
```bash
# First time setup
./scripts/operations/start-dev.sh --clean

# Subsequent starts
./scripts/operations/start-dev.sh

# Skip databases if already running
./scripts/operations/start-dev.sh --no-db
```

### Production Deployment
```bash
# Full deployment with clean build
./scripts/operations/start-prod.sh deploy --no-cache

# Quick restart (no rebuild)
./scripts/operations/start-prod.sh restart

# Check status
./scripts/operations/start-prod.sh status

# View logs
./scripts/operations/start-prod.sh logs backend
```

### Testing MDX Rendering
```bash
# Run backend tests and insert test data
./scripts/operations/quick-test.sh

# Then test frontend manually
cd frontend && pnpm dev
# Visit http://localhost:3001/blog/test-mdx-rendering
```

### Troubleshooting
```bash
# Check service status
./scripts/operations/start-prod.sh status

# View backend logs
./scripts/operations/start-prod.sh logs backend

# View database logs
./scripts/operations/start-prod.sh logs postgres

# Restart everything
./scripts/operations/start-prod.sh restart

# Clean and rebuild
./scripts/operations/start-prod.sh clean
./scripts/operations/start-prod.sh deploy --no-cache
```

## Environment Configuration

### Development (.env)
```bash
DATABASE_URL=postgresql://blog_user:blog_password@localhost:5432/blog_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key-for-testing-only-32-chars
HOST=127.0.0.1
PORT=3000
RUST_LOG=debug
ENVIRONMENT=development
PASSWORD_PEPPER=dev-pepper
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
RATE_LIMIT_PER_MINUTE=1000
SESSION_SECRET=dev-session-secret
PROMETHEUS_ENABLED=true
```

### Production (.env.production)
**Must contain**:
- Secure JWT_SECRET (32+ random characters)
- Secure PASSWORD_PEPPER
- Production database URLs
- Production Redis URL
- Proper CORS origins
- SMTP configuration for emails

## Error Handling

### Port Conflicts
**Check**:
```bash
# Unix
lsof -i :3000
lsof -i :3001

# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### Docker Issues
```bash
# Check Docker status
docker ps

# Remove stuck containers
docker container prune -f

# Remove dangling images
docker image prune -f

# Rebuild from scratch
./scripts/operations/start-prod.sh clean
./scripts/operations/start-prod.sh deploy --no-cache
```

### Database Connection Failures
```bash
# Check database is running
docker ps | grep blog-postgres

# Test connectivity
docker exec blog-postgres pg_isready -U blog_user -d blog_db

# View logs
docker logs blog-postgres

# Restart database
docker restart blog-postgres
```

### Build Failures
```bash
# Backend build fails
cd backend
cargo clean
cargo build

# Frontend build fails
cd frontend
rm -rf node_modules .next
pnpm install
pnpm build
```

## Best Practices

### Development
- Always use `start-dev.sh` for local development
- Use `--clean` flag when dependencies change
- Check health status before starting work
- Use Ctrl+C to stop all services gracefully

### Production
- Validate `.env.production` before deployment
- Test in staging environment first
- Use `--dry-run` flag to preview changes
- Monitor logs after deployment
- Keep backups before major deployments

### Testing
- Run `quick-test.sh` after backend changes
- Verify MDX rendering for content features
- Test API endpoints manually
- Check database content after inserts

## See Also

- `./scripts/dev/` - Development utilities (backend restart, local start)
- `./backend/README.md` - Backend architecture and API documentation
- `./frontend/README.md` - Frontend architecture and component documentation
- `./docker-compose.yml` - Container orchestration
- `./backend/deploy.sh` - Backend deployment script
