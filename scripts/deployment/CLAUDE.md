# Deployment Scripts Directory

## Purpose
Complete deployment automation for Docker-based infrastructure, including building, deploying, and monitoring.

## Directory Structure

```
scripts/deployment/
├── build-all.sh                 # Complete build pipeline
├── build-all.ps1                # Windows PowerShell build
├── build-local-images.sh        # Build Docker images locally
├── deploy.sh                    # Main deployment orchestration
├── deploy-docker.sh             # Docker deployment
├── deploy-docker.ps1            # Windows Docker deployment
├── deploy-production.sh         # Production deployment
├── deploy-server.sh             # Server-specific deployment
├── deploy-simple.sh             # Simplified deployment
├── export-images.sh             # Export Docker images
├── export-images.ps1            # Windows image export
├── load-images.sh               # Load Docker images
├── package-deployment.js        # Deployment packaging
├── push-images.sh               # Push images to registry
├── push-images.ps1              # Windows push to registry
├── quick-deploy.sh              # Quick deployment workflow
├── setup-ssl.sh                 # SSL certificate setup
├── start-from-images.sh         # Start from exported images
├── upload-rsync.js              # Rsync-based deployment
└── verify-deployment.sh         # Deployment verification
```

## Deployment Workflows

### 1. Quick Deployment
**File**: `quick-deploy.sh`

**Purpose**: Fast deployment for development/testing

**Workflow**:
1. Environment checks (Docker, disk space, memory)
2. Stop existing containers
3. Build new images (if needed)
4. Start services via docker-compose
5. Health checks
6. Verification

**Usage**:
```bash
chmod +x scripts/deployment/quick-deploy.sh
./scripts/deployment/quick-deploy.sh
```

### 2. Production Deployment
**File**: `deploy-production.sh`

**Purpose**: Production-ready deployment with zero-downtime

**Features**:
- Pre-deployment backups
- Rolling updates
- Health check validation
- Automatic rollback on failure
- Monitoring integration

**Usage**:
```bash
./scripts/deployment/deploy-production.sh
```

### 3. Server Deployment
**File**: `deploy-server.sh`

**Purpose**: Deploy to remote server

**Requirements**:
- SSH access configured
- Docker installed on server
- Environment variables set

**Usage**:
```bash
./scripts/deployment/deploy-server.sh user@server.com
```

## Build Scripts

### Complete Build
**File**: `build-all.sh` (Linux/Mac) / `build-all.ps1` (Windows)

**Purpose**: Build all Docker images

**Images Built**:
- Backend (Rust API)
- Frontend (Next.js)
- PostgreSQL (with migrations)
- Redis

**Usage**:
```bash
# Linux/Mac
./scripts/deployment/build-all.sh

# Windows PowerShell
.\scripts\deployment\build-all.ps1
```

### Local Image Build
**File**: `build-local-images.sh`

**Purpose**: Build images for local development

**Features**:
- Fast builds using cache
- Development configuration
- No registry push

**Usage**:
```bash
./scripts/deployment/build-local-images.sh
```

## Docker Image Management

### Export Images
**File**: `export-images.sh`

**Purpose**: Export Docker images as tar files

**Use Cases**:
- Air-gapped deployment
- Backup images
- Transfer between systems

**Usage**:
```bash
./scripts/deployment/export-images.sh
# Output: ./images/backend.tar, ./images/frontend.tar, etc.
```

### Load Images
**File**: `load-images.sh`

**Purpose**: Load exported Docker images

**Usage**:
```bash
./scripts/deployment/load-images.sh
# Loads images from ./images/*.tar
```

### Push to Registry
**File**: `push-images.sh`

**Purpose**: Push images to Docker registry (Docker Hub, GHCR, etc.)

**Prerequisites**:
- Registry credentials configured
- Images tagged with registry prefix

**Usage**:
```bash
./scripts/deployment/push-images.sh
```

## SSL/TLS Setup

### Automated SSL Configuration
**File**: `setup-ssl.sh`

**Purpose**: Configure SSL certificates using Let's Encrypt

**Features**:
- Automated certificate generation
- Nginx configuration
- Auto-renewal setup
- Certificate validation

**Requirements**:
- Domain name pointed to server
- Port 80 accessible
- Certbot installed

**Usage**:
```bash
sudo ./scripts/deployment/setup-ssl.sh yourdomain.com
```

## Deployment Verification

### Health Checks
**File**: `verify-deployment.sh`

**Purpose**: Verify deployment success

**Checks**:
1. Container status (running?)
2. Backend health endpoint (`/health`)
3. Frontend accessibility
4. Database connectivity
5. Redis connectivity
6. SSL certificate validity

**Usage**:
```bash
./scripts/deployment/verify-deployment.sh
```

**Output**:
```
========================================
Deployment Verification Report
========================================

✓ Containers Running: 4/4
✓ Backend Health: OK (200)
✓ Frontend Accessible: OK
✓ Database Connected: OK
✓ Redis Connected: OK
✓ SSL Certificate: Valid

Deployment Status: SUCCESS
========================================
```

## Alternative Deployment Methods

### Rsync Deployment
**File**: `upload-rsync.js`

**Purpose**: Deploy via rsync (non-Docker)

**Use Case**: Traditional hosting without Docker

**Workflow**:
1. Build frontend locally
2. Use rsync to transfer files
3. Restart application server

**Usage**:
```bash
node scripts/deployment/upload-rsync.js user@server:/var/www/html
```

### Deployment Packaging
**File**: `package-deployment.js`

**Purpose**: Package deployment artifacts

**Output**: ZIP file with all deployment files

**Usage**:
```bash
node scripts/deployment/package-deployment.js
# Output: deployment-package.zip
```

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/blog_db
POSTGRES_PASSWORD=secure_password

# Redis
REDIS_URL=redis://localhost:6379

# Backend
JWT_SECRET=your-secret-key
PASSWORD_PEPPER=your-pepper
RUST_LOG=info

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=production
```

### Environment Files
- **Development**: `.env.development`
- **Production**: `.env.production`
- **Docker**: `.env.docker`

## Deployment Strategies

### Rolling Deployment
**File**: `deploy.sh` (main orchestration)

**Process**:
1. Deploy new version to staging container
2. Health checks on staging
3. Switch traffic to new version
4. Monitor for issues
5. Keep old version for rollback

**Advantages**:
- Zero downtime
- Easy rollback
- Gradual rollout

### Blue-Green Deployment
**Alternative approach**:
1. Maintain two environments (blue, green)
2. Deploy to inactive environment
3. Switch traffic entirely
4. Keep previous as backup

### Canary Deployment
**For high-traffic sites**:
1. Deploy to small subset of servers
2. Monitor metrics
3. Gradually increase traffic
4. Full rollout or rollback

## Monitoring and Logging

### Container Logs
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Health Monitoring
```bash
# Continuous monitoring
watch -n 5 './scripts/deployment/verify-deployment.sh'
```

## Troubleshooting

### Common Issues

**Port Conflicts**:
```bash
# Check port usage
netstat -tuln | grep -E ':(3000|3001|5432|6379)'

# Kill conflicting processes
./scripts/deployment/quick-deploy.sh --force
```

**Image Build Failures**:
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

**Container Startup Failures**:
```bash
# Check container logs
docker-compose logs backend

# Enter container for debugging
docker-compose exec backend bash
```

## Best Practices

### Pre-deployment Checklist
- [ ] Backup database
- [ ] Test in staging environment
- [ ] Verify environment variables
- [ ] Check disk space
- [ ] Review changelog
- [ ] Prepare rollback plan

### Deployment Safety
1. **Always backup** before production deployment
2. **Use tags** for Docker images (versioning)
3. **Test thoroughly** in staging
4. **Monitor closely** after deployment
5. **Have rollback** ready to execute

### Post-deployment
- Monitor error rates
- Check performance metrics
- Verify critical user flows
- Review logs for issues
- Document any problems

## Related Modules
- `backend/docker-compose.yml` - Docker service definitions
- `backend/Dockerfile` - Backend container configuration
- `frontend/Dockerfile` - Frontend container configuration
- `docs/operations/` - Operational procedures
- `scripts/backup/` - Backup utilities
