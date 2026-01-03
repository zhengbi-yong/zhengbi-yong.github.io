# Deployment Scripts

## Module Overview

Automation scripts for deploying the blog platform to production servers.

## Purpose

Provide automated, reliable, and repeatable deployment processes with error handling and rollback capabilities.

## Structure

```
deployments/scripts/
├── deploy-server.sh           # Complete server deployment
└── complete-deploy.sh         # End-to-end deployment with migration
```

## Deployment Scripts

### deploy-server.sh

**Purpose**: Deploy blog system to server

**Usage**:
```bash
./deployments/scripts/deploy-server.sh
```

**Prerequisites**:
- Docker and Docker Compose installed
- `.env` file configured
- Docker images built locally
- SSH access (if remote deployment)

#### Deployment Steps

**Step 1/6: Environment Variables Check**
```bash
# Check for .env file
if [ ! -f ".env" ]; then
    # Create from example
    cp .env.server.example .env
    # Prompt user to edit
fi
```

**Step 2/6: Create Directories**
```bash
mkdir -p nginx/conf.d
mkdir -p nginx/ssl
mkdir -p uploads
mkdir -p logs
```

**Step 3/6: Configure Nginx**
- Create main `nginx.conf` if missing
- Create site configuration `nginx/conf.d/default.conf`
- Configure reverse proxy for frontend and backend

**Step 4/6: Check Docker Images**
```bash
docker images | grep -E 'blog-backend:local|blog-frontend:local'
```

**Step 5/6: Start Services**
```bash
docker compose -f docker-compose.server.yml up -d
```

**Step 6/6: Verify Services**
```bash
sleep 5
docker compose -f docker-compose.server.yml ps
```

#### Output

**Success Message**:
```
✅ 部署完成！

服务访问地址:
  前端: http://localhost:3001
  后端: http://localhost:3000

查看日志:
  所有服务: docker compose -f docker-compose.server.yml logs -f
  后端: docker compose -f docker-compose.server.yml logs -f backend
  前端: docker compose -f docker-compose.server.yml logs -f frontend

常用命令:
  停止服务: docker compose -f docker-compose.server.yml down
  重启服务: docker compose -f docker-compose.server.yml restart
  查看状态: docker compose -f docker-compose.server.yml ps
```

### complete-deploy.sh

**Purpose**: Complete deployment with database migration

**Features**:
- Run database migrations before starting services
- Wait for database to be ready
- Rollback on failure

## Configuration Files

### Docker Compose Server

**File**: `docker-compose.server.yml` (project root)

**Services**:
- `backend` - Blog backend API
- `frontend` - Next.js frontend
- `postgres` - PostgreSQL database
- `redis` - Redis cache
- `nginx` - Reverse proxy

## Script Features

### Error Handling

```bash
set -e  # Exit on error
```

### Colored Output

```bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
```

### Progress Indication

```bash
log_info "步骤 1/6: 检查环境变量配置..."
```

## Deployment Workflow

### Pre-Deployment

1. **Build Images**:
```bash
# Backend
cd backend
docker build -t blog-backend:local .

# Frontend
cd ../frontend
docker build -t blog-frontend:local .
```

2. **Test Images**:
```bash
docker run --rm blog-backend:local --version
docker run --rm blog-frontend:local --version
```

3. **Prepare Environment**:
```bash
cp config/environments/.env.server.example .env
# Edit .env with production values
```

### Deployment

1. **Run Script**:
```bash
./deployments/scripts/deploy-server.sh
```

2. **Verify Services**:
```bash
docker compose -f docker-compose.server.yml ps
```

3. **Check Health**:
```bash
curl http://localhost:3000/healthz
curl http://localhost:3001
```

### Post-Deployment

1. **View Logs**:
```bash
docker compose -f docker-compose.server.yml logs -f
```

2. **Run Database Migrations**:
```bash
docker compose -f docker-compose.server.yml exec backend sqlx migrate run
```

3. **Create Admin User**:
```bash
docker compose -f docker-compose.server.yml exec backend /scripts/create-admin.sh
```

## Nginx Configuration

### Auto-Generated Configs

**nginx.conf**:
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    gzip on;
    gzip_comp_level 6;
    # ... gzip types

    include /etc/nginx/conf.d/*.conf;
}
```

**conf.d/default.conf**:
```nginx
server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
        proxy_pass http://frontend:3001;
        proxy_http_version 1.1;
        # ... proxy headers
    }

    # Backend API
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        # ... proxy headers
    }
}
```

## Service Management

### Start Services

```bash
docker compose -f docker-compose.server.yml up -d
```

### Stop Services

```bash
docker compose -f docker-compose.server.yml down
```

### Restart Services

```bash
docker compose -f docker-compose.server.yml restart
```

### View Logs

```bash
# All services
docker compose -f docker-compose.server.yml logs -f

# Specific service
docker compose -f docker-compose.server.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.server.yml logs --tail=100 backend
```

### Update Services

```bash
# Pull new images
docker pull ghcr.io/your-org/blog-backend:latest
docker pull ghcr.io/your-org/blog-frontend:latest

# Restart with new images
docker compose -f docker-compose.server.yml up -d

# Clean up old images
docker image prune -a
```

## Rollback

### Rollback Deployment

```bash
# Stop current services
docker compose -f docker-compose.server.yml down

# Start previous version
docker compose -f docker-compose.server.yml.previous.yml up -d
```

### Database Rollback

```bash
# List migrations
docker compose -f docker-compose.server.yml exec backend sqlx migrate info

# Rollback last migration
docker compose -f docker-compose.server.yml exec backend sqlx migrate revert
```

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3000/healthz

# Frontend
curl http://localhost:3001

# Nginx status
docker compose -f docker-compose.server.yml exec nginx nginx -t
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Service status
docker compose -f docker-compose.server.yml ps
```

## Troubleshooting

### Services Won't Start

**Check logs**:
```bash
docker compose -f docker-compose.server.yml logs backend
docker compose -f docker-compose.server.yml logs frontend
```

**Check port conflicts**:
```bash
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
```

**Check environment variables**:
```bash
docker compose -f docker-compose.server.yml config
```

### Database Connection Issues

**Check database is running**:
```bash
docker compose -f docker-compose.server.yml ps postgres
```

**Test connection**:
```bash
docker compose -f docker-compose.server.yml exec backend pg_isready
```

**Check migrations**:
```bash
docker compose -f docker-compose.server.yml exec backend sqlx migrate info
```

### Nginx 502 Errors

**Check upstream services**:
```bash
curl http://localhost:3000/healthz
curl http://localhost:3001
```

**Check Nginx configuration**:
```bash
docker compose -f docker-compose.server.yml exec nginx nginx -t
```

**Reload Nginx**:
```bash
docker compose -f docker-compose.server.yml exec nginx nginx -s reload
```

## Security Best Practices

### Environment Variables

- Never commit `.env` files
- Use strong secrets in production
- Rotate secrets regularly

### SSL/TLS

```bash
# Obtain Let's Encrypt certificate
certbot certonly --webroot -w /var/www/html -d yourdomain.com

# Configure Nginx for SSL
# Edit nginx/conf.d/default.conf
```

### Firewall Rules

```bash
# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Deny other incoming
ufw default deny incoming
ufw default allow outgoing
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Deploy to server
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: ${{ secrets.SERVER_USER }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      cd ~/blog-deployment
      git pull
      ./deployments/scripts/deploy-server.sh
```

## Related Modules

- **Deployment Config**: `../config/` - Configuration files
- **Nginx Config**: `../nginx/` - Reverse proxy configuration
- **Environment Config**: `../../config/environments/` - Environment templates
- **Backend Scripts**: `../../backend/scripts/` - Backend utilities

## Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Deployment Guide](https://docs.nginx.com/nginx/admin-guide/)
- [Let's Encrypt Certbot](https://certbot.eff.org/)

---

**Last Updated**: 2026-01-03
**Maintained By**: DevOps Team
