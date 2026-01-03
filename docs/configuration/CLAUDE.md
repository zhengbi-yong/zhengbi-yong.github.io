# Configuration Documentation

## Module Overview

Comprehensive configuration management guide for the blog platform.

## Purpose

Provide detailed documentation for configuring all system components using centralized `config/config.yml` and environment-specific templates.

## Structure

```
docs/configuration/
└── config-guide.md          # Complete configuration management guide
```

## Configuration Guide Overview

### config/config.yml Structure

The system uses a **single source of truth** configuration approach:

```yaml
system:          # System-level settings
ports:           # Port configuration (fixed)
domain:          # Domain configuration
database:        # Database settings
security:        # Security parameters
email:           # Email/SMTP configuration
ssl:             # SSL/TLS certificates
performance:     # Performance tuning
backup:          # Backup settings
monitoring:      # Monitoring configuration
logging:         # Logging preferences
resources:       # Resource limits
healthcheck:     # Health check settings
development:     # Development environment
```

### Configuration Priority

1. **config/config.yml** - Main configuration file (version controlled)
2. **.env** - Auto-generated, not in version control
3. **Environment Variables** - Runtime override (special cases only)

## Key Configuration Sections

### System Configuration

```yaml
system:
  project_name: blog
  environment: production    # development, staging, production
  timezone: Asia/Shanghai
  log_level: info           # error, warn, info, debug, trace
```

**Importance**:
- `environment` affects default behaviors
- Production must use `production`
- Log level impacts performance

### Port Configuration

```yaml
ports:
  frontend: 3001
  backend: 3000
  postgres: 5432
  redis: 6379
  nginx_http: 80
  nginx_https: 443
```

**Warning**: Do not modify ports after initial setup to avoid breaking reverse proxy and firewall rules.

### Database Configuration

```yaml
database:
  host: postgres
  port: 5432
  name: blog_db
  user: blog_user
  password: ${POSTGRES_PASSWORD}  # From .env
  pool_size: 20
  max_connections: 100
```

### Security Configuration

```yaml
security:
  jwt_secret: ${JWT_SECRET}           # Min 32 chars
  password_pepper: ${PASSWORD_PEPPER}  # Min 32 chars
  session_secret: ${SESSION_SECRET}   # Min 32 chars
  cors_allowed_origins:
    - https://yourdomain.com
    - https://www.yourdomain.com
  rate_limit_per_minute: 60
```

### SSL/TLS Configuration

```yaml
ssl:
  enabled: true
  certificate_path: /etc/nginx/ssl/fullchain.pem
  private_key_path: /etc/nginx/ssl/privkey.pem
  auto_renew: true
  provider: letsencrypt
```

## Configuration Management Tools

### Setup Script

**Location**: `./backend/scripts/setup-env.ps1` (Windows)

**Purpose**: Generate `.env` files from configuration templates

**Usage**:
```powershell
.\backend\scripts\setup-env.ps1
```

### Environment Templates

**Location**: `config/environments/`

**Templates**:
- `.env.local.example` - Local development
- `.env.docker.example` - Docker Compose
- `.env.server.example` - Production server
- `.env.production.example` - Production settings

## Common Configuration Scenarios

### Local Development Setup

1. Copy local template:
```bash
cp config/environments/.env.local.example .env
```

2. Edit values:
```bash
JWT_SECRET=dev-secret-key-for-testing-only-32-chars
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

3. Load environment:
```bash
source backend/scripts/load-env.sh
```

### Docker Deployment

1. Copy Docker template:
```bash
cp config/environments/.env.docker.example .env
```

2. Update Docker-specific settings:
```bash
COMPOSE_PROJECT_NAME=blog_platform
POSTGRES_HOST=postgres
REDIS_HOST=redis
```

3. Start services:
```bash
docker-compose up -d
```

### Production Server

1. Copy production template:
```bash
cp config/environments/.env.server.example .env
```

2. Generate secure secrets:
```bash
openssl rand -base64 32  # For each secret
```

3. Update configuration:
```bash
JWT_SECRET=<generated-secret>
PASSWORD_PEPPER=<generated-secret>
SESSION_SECRET=<generated-secret>
```

## Security Best Practices

### Secret Generation

**Generate strong secrets**:
```bash
# JWT Secret
openssl rand -base64 32

# Password Pepper
openssl rand -base64 32

# Session Secret
openssl rand -base64 32
```

### Secret Storage

**Never commit secrets**:
```
# .gitignore
.env
.env.local
.env.production
*.key
*.pem
```

### Environment-Specific Secrets

**Development**:
- Use weak but non-empty secrets
- Document secret locations
- Change before production deployment

**Production**:
- Use strong, randomly generated secrets
- Store in secret manager (Vault, AWS Secrets Manager)
- Rotate every 90 days

## Configuration Validation

### Required Variables Check

**Script**:
```bash
required_vars=(
  "DATABASE_URL"
  "JWT_SECRET"
  "PASSWORD_PEPPER"
  "SESSION_SECRET"
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var}" ]]; then
    echo "Error: $var is not set"
    exit 1
  fi
done
```

### Secret Strength Check

```bash
# Check minimum length (32 chars)
if [[ ${#JWT_SECRET} -lt 32 ]]; then
  echo "Error: JWT_SECRET must be at least 32 characters"
  exit 1
fi
```

### Configuration Test

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Test backend startup
cargo run --bin blog-backend -- --check-config

# Test frontend build
cd frontend && npm run build
```

## Configuration Files Reference

### Backend Configuration

**Location**: `backend/.env`

**Key Variables**:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing key
- `RUST_LOG` - Log level (debug, info, warn, error)

### Frontend Configuration

**Location**: `frontend/.env.local`

**Public Variables** (exposed to browser):
- `NEXT_PUBLIC_SITE_URL` - Site URL
- `NEXT_PUBLIC_API_URL` - API base URL

**Private Variables** (server-side only):
- `DATABASE_URL` - Database connection
- `NEXTAUTH_SECRET` - NextAuth secret

### Nginx Configuration

**Location**: `deployments/nginx/nginx.conf`

**Key Settings**:
- Worker processes
- Client max body size
- Gzip compression
- SSL protocols

## Troubleshooting

### Variables Not Loading

**Check**:
1. File exists in correct location
2. File format (no extra spaces around `=`)
3. File permissions
4. Proper sourcing

### Configuration Conflicts

**Priority**: System env > `.env.local` > `.env`

### Special Characters

**Quotes for spaces**:
```bash
CORS_ALLOWED_ORIGINS="http://localhost:3001, http://localhost:3002"
```

**Escape special chars**:
```bash
SMTP_PASSWORD="p\@ssw0rd!#$"
```

### Port Conflicts

**Check port availability**:
```bash
# Unix/Linux
netstat -tulpn | grep :3000
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

## Related Modules

- **Environment Templates**: `../../config/environments/` - Environment examples
- **Deployment Config**: `../../deployments/config/` - Deployment settings
- **Backend Config**: `../../backend/src/config/` - Configuration loading
- **Frontend Config**: `../../frontend/` - Next.js environment handling

## Resources

- [The Twelve-Factor App: Config](https://12factor.net/config)
- [Environment Variables Best Practices](https://snyk.io/blog/securing-secrets-in-env-vars/)
- [Configuration Management](https://www.12factor.net/config)

---

**Last Updated**: 2026-01-03
**Maintained By**: Configuration Team
