# Environment Configurations

## Module Overview

Environment-specific configuration templates and examples for all system components.

## Purpose

Provide standardized environment variable templates for different deployment scenarios (local, Docker, production, server).

## Structure

```
config/environments/
├── .env.deploy.example          # Deployment environment template
├── .env.docker.example          # Docker Compose template
├── .env.frontend.example        # Frontend Next.js template
├── .env.local.example           # Local development template
├── .env.production.example      # Production server template
├── .env.root.example            # Root project template
├── .env.server.example          # Server deployment template
└── backend/                     # Backend-specific overrides
```

## Configuration Files

### .env.local.example

**Purpose**: Local development environment configuration

**Database**:
```bash
POSTGRES_USER=blog_user
POSTGRES_PASSWORD=blog_password
POSTGRES_DB=blog_db
POSTGRES_PORT=5432
```

**Redis**:
```bash
REDIS_PORT=6379
```

**Backend**:
```bash
BACKEND_PORT=3000
RUST_LOG=debug
JWT_SECRET=dev-secret-key-for-testing-only-32-chars
PASSWORD_PEPPER=dev-pepper
SESSION_SECRET=dev-session-secret
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
RATE_LIMIT_PER_MINUTE=1000
```

**Frontend**:
```bash
FRONTEND_PORT=3001
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

**Email (Optional)**:
```bash
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=noreply@localhost
```

### .env.docker.example

**Purpose**: Docker Compose environment configuration

**Docker-Specific**:
```bash
# Docker Compose network
COMPOSE_PROJECT_NAME=blog_platform

# Service names
POSTGRES_HOST=postgres
REDIS_HOST=redis
BACKEND_HOST=backend
FRONTEND_HOST=frontend
```

**Volumes**:
```bash
# Data persistence
POSTGRES_DATA=./docker-data/postgres
REDIS_DATA=./docker-data/redis
```

**Ports**:
```bash
# Exposed ports
POSTGRES_PORT=5432
REDIS_PORT=6379
BACKEND_PORT=3000
FRONTEND_PORT=3001
```

### .env.server.example

**Purpose**: Production server configuration

**Security**:
```bash
# Use strong secrets in production!
JWT_SECRET=your-very-secure-jwt-secret-min-32-chars
PASSWORD_PEPPER=your-very-secure-pepper-min-32-chars
SESSION_SECRET=your-very-secure-session-secret-min-32-chars
```

**Database**:
```bash
DATABASE_URL=postgresql://blog_user:secure_password@localhost:5432/blog_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

**CORS**:
```bash
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Rate Limiting**:
```bash
RATE_LIMIT_PER_MINUTE=60
```

### .env.production.example

**Purpose**: Production deployment configuration

**Domain**:
```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
```

**Email**:
```bash
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

**Monitoring**:
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info
```

### .env.deploy.example

**Purpose**: Deployment automation configuration

**SSH**:
```bash
DEPLOY_SERVER=user@your-server-ip
DEPLOY_PATH=~/blog-deployment
DEPLOY_SSH_PORT=22
```

**Docker Registry**:
```bash
DOCKER_REGISTRY=ghcr.io
DOCKER_IMAGE_NAME=blog-platform
DOCKER_TAG=latest
```

### .env.frontend.example

**Purpose**: Next.js frontend configuration

**Next.js Public Variables**:
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
```

**Next.js Private Variables**:
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3001
```

### .env.root.example

**Purpose**: Root project-level configuration

**Paths**:
```bash
PROJECT_ROOT=.
BACKEND_PATH=./backend
FRONTEND_PATH=./frontend
DEPLOYMENTS_PATH=./deployments
```

**Common**:
```bash
COMPOSE_PROJECT_NAME=blog_platform
NODE_ENV=development
```

## Environment Variable Categories

### Database Configuration

**PostgreSQL**:
- `DATABASE_URL` - Full connection string (overrides individual settings)
- `POSTGRES_HOST` - Database host (default: localhost)
- `POSTGRES_PORT` - Database port (default: 5432)
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name

**Connection Pool**:
- `DB_MAX_CONNECTIONS` - Max pool size (default: 20)
- `DB_MIN_CONNECTIONS` - Min pool size (default: 5)
- `DB_CONNECTION_TIMEOUT` - Connection timeout in seconds (default: 30)

### Redis Configuration

**Connection**:
- `REDIS_URL` - Full connection string
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)

**Authentication** (Optional):
- `REDIS_PASSWORD` - Redis password (if required)
- `REDIS_DB` - Redis database number (default: 0)

### Backend Configuration

**Server**:
- `BACKEND_PORT` - Server port (default: 3000)
- `BACKEND_HOST` - Server host (default: 0.0.0.0)

**Logging**:
- `RUST_LOG` - Log level: error, warn, info, debug, trace
- `LOG_FORMAT` - Log format: json, pretty

**Security**:
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `PASSWORD_PEPPER` - Password pepper for hashing (min 32 chars)
- `SESSION_SECRET` - Session encryption secret (min 32 chars)

**CORS**:
- `CORS_ENABLED` - Enable CORS (default: true)
- `CORS_ALLOWED_ORIGINS` - Comma-separated origins
- `CORS_ALLOWED_METHODS` - GET,POST,PUT,PATCH,DELETE
- `CORS_ALLOWED_HEADERS` - Content-Type,Authorization

**Rate Limiting**:
- `RATE_LIMIT_ENABLED` - Enable rate limiting (default: true)
- `RATE_LIMIT_PER_MINUTE` - Requests per minute
- `RATE_LIMIT_BURST` - Burst size

### Frontend Configuration

**Next.js**:
- `NEXT_PUBLIC_SITE_URL` - Public site URL (client-side)
- `NEXT_PUBLIC_API_URL` - Public API URL (client-side)
- `NEXTAUTH_SECRET` - NextAuth secret
- `NEXTAUTH_URL` - NextAuth URL

**Build**:
- `NODE_ENV` - Node environment: development, production
- `NEXT_TELEMETRY_DISABLED` - Disable Next.js telemetry (1)

### Email Configuration

**SMTP**:
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port (587 for TLS)
- `SMTP_USERNAME` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_FROM` - Sender email address

**TLS**:
- `SMTP_USE_TLS` - Use TLS (true)

### Monitoring & Analytics

**Sentry**:
- `SENTRY_DSN` - Sentry DSN for error tracking
- `SENTRY_ENVIRONMENT` - Environment name (production, staging)

**Analytics** (Optional):
- `GOOGLE_ANALYTICS_ID` - Google Analytics tracking ID
- `PLAUSIBLE_ANALYTICS_DOMAIN` - Plausible analytics domain

## Usage

### Local Development

1. **Copy example file**:
```bash
cp config/environments/.env.local.example .env
```

2. **Customize values**:
```bash
# Edit .env
JWT_SECRET=your-local-dev-secret
```

3. **Load environment**:
```bash
source backend/scripts/load-env.sh  # Unix
./backend/scripts/load-env.ps1      # Windows
```

### Docker Deployment

1. **Copy Docker example**:
```bash
cp config/environments/.env.docker.example .env
```

2. **Update configuration**:
```bash
COMPOSE_PROJECT_NAME=blog_platform
```

3. **Start services**:
```bash
docker-compose up -d
```

### Production Server

1. **Copy production example**:
```bash
cp config/environments/.env.server.example .env
```

2. **Generate secure secrets**:
```bash
# Generate 32-byte secret
openssl rand -base64 32
```

3. **Set environment**:
```bash
export $(cat .env | xargs)
```

## Security Best Practices

### Secret Management

**Never Commit**:
- `.env` files
- Production secrets
- API keys
- Passwords

**Gitignore**:
```
.env
.env.local
.env.production
.env.*.local
```

### Secret Generation

**JWT Secret**:
```bash
openssl rand -base64 32
```

**Password Pepper**:
```bash
openssl rand -base64 32
```

**Session Secret**:
```bash
openssl rand -base64 32
```

### Environment-Specific Secrets

**Development**:
- Use weak but non-empty secrets
- Document secret locations
- Rotate regularly

**Production**:
- Use strong, randomly generated secrets
- Store in secret manager (Vault, AWS Secrets Manager)
- Rotate regularly (every 90 days)

## Validation

### Required Variables Check

```bash
# Check if all required variables are set
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
# Check minimum secret length (32 chars)
if [[ ${#JWT_SECRET} -lt 32 ]]; then
  echo "Error: JWT_SECRET must be at least 32 characters"
  exit 1
fi
```

## File Loading Priority

**Backend (Rust)**:
1. `.env` (current directory)
2. `.env.local` (local overrides)
3. System environment variables

**Frontend (Next.js)**:
1. `.env.local` (highest priority)
2. `.env.development` / `.env.production`
3. `.env`
4. System environment variables

## Docker Compose Integration

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    env_file:
      - config/environments/.env.docker.example
    environment:
      - DATABASE_URL=postgresql://...
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Setup environment
  run: |
    cp config/environments/.env.local.example .env
    echo "JWT_SECRET=${{ secrets.JWT_SECRET }}" >> .env
```

## Troubleshooting

### Variables Not Loading

**Check**:
- File exists in correct location
- File format (no extra spaces around `=`)
- File permissions

### Conflicting Variables

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

## Related Modules

- **Backend Config**: `../../backend/src/config/` - Backend config loading
- **Frontend Config**: `../../frontend/` - Next.js environment handling
- **Deployment**: `../../deployments/` - Deployment environment setup
- **Docker**: `../../docker-compose.yml` - Docker environment

## Resources

- [The Twelve-Factor App: Config](https://12factor.net/config)
- [dotenv-rust](https://github.com/dotenv-rs/dotenv)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Last Updated**: 2026-01-03
**Maintained By**: DevOps Team
