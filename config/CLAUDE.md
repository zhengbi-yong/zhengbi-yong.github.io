# config

## Purpose

Centralized configuration management for development, staging, and production environments using YAML-based system.

## Structure

```
config/
├── config.yml                      # Main configuration (325 lines)
└── environments/                   # Environment-specific overrides
    ├── development.yml
    ├── staging.yml
    └── production.yml
```

## Configuration Hierarchy

```
config.yml (base)
    ↓
environments/<environment>.yml (overrides)
    ↓
Environment variables (highest priority)
```

## Core Configuration Sections

### System Settings
```yaml
system:
  project_name: blog
  environment: production          # development, staging, production
  timezone: Asia/Shanghai
  log_level: info                 # error, warn, info, debug, trace
```

### Port Allocation
```yaml
ports:
  frontend: 3001
  backend: 3000
  postgres: 5432
  redis: 6379
  nginx_http: 80
  nginx_https: 443
```

**Note**: Ports are fixed - avoid changes without network reconfiguration

### Domain Configuration
```yaml
domain:
  main: zhengbi-yong.top
  www: www.zhengbi-yong.top
  server_ip: 152.136.43.194
  force_https: false              # Set to true after SSL configured
```

### Database Configuration

**PostgreSQL**:
```yaml
database:
  postgres:
    name: blog_db
    user: blog_user
    password: ""                  # Empty = auto-generate
    max_connections: 200
    shared_buffers: 256           # MB
    work_mem: 4                   # MB
    persistence:
      enabled: true
      backup_retention_days: 30
```

**Redis**:
```yaml
database:
  redis:
    password: ""                  # Empty = no password
    persistence_mode: appendonly  # no, appendonly, etc.
    max_memory: 512              # MB
    eviction_policy: allkeys-lru
```

### Security Settings
```yaml
security:
  jwt_secret: ""                 # Empty = auto-generate (32 chars)
  password_pepper: ""            # Empty = auto-generate (32 chars)
  session_secret: ""             # Empty = auto-generate (32 chars)
  cors_origins: "http://localhost:3001,https://zhengbi-yong.top"
  rate_limit:
    requests_per_minute: 60
    burst: 10
  ip_whitelist: ""               # Empty = no restriction
```

### Email Configuration (Optional)
```yaml
email:
  enabled: false
  smtp_host: smtp.gmail.com
  smtp_port: 587
  smtp_username: ""
  smtp_password: ""
  from_address: noreply@zhengbi-yong.top
  from_name: "Zhengbi's Blog"
```

### SSL/TLS Configuration
```yaml
ssl:
  enabled: false
  certificate_path: /etc/nginx/ssl/fullchain.pem
  private_key_path: /etc/nginx/ssl/privkey.pem
  chain_path: /etc/nginx/ssl/chain.pem
  letsencrypt:
    auto_renew: true
    email: ""
```

### Performance Tuning
```yaml
performance:
  frontend:
    compression: true
    static_cache_ttl: 31536000    # 365 days
    image_cache_ttl: 2592000      # 30 days
  backend:
    worker_threads: 0             # 0 = auto
    pool_size: 10
    query_timeout: 30             # seconds
  database:
    slow_query_log: true
    slow_query_threshold: 2       # seconds
```

### Backup Configuration
```yaml
backup:
  enabled: true
  directory: ./backups
  schedule: "0 2 * * *"          # Daily at 2 AM
  retention_days: 30
  type: full                      # full, incremental
```

### Monitoring (Optional)
```yaml
monitoring:
  enabled: false
  prometheus:
    port: 9090
    enabled: false
  grafana:
    port: 3001
    enabled: false
    admin_password: ""
```

### Logging Configuration
```yaml
logging:
  driver: json-file               # json-file, syslog, journald, etc.
  max_size: 10                   # MB
  max_files: 3
  level: info
```

### Resource Limits
```yaml
resources:
  frontend:
    cpu_limit: "1"
    memory_limit: "1G"
  backend:
    cpu_limit: "2"
    memory_limit: "2G"
  postgres:
    cpu_limit: "2"
    memory_limit: "2G"
  redis:
    cpu_limit: "1"
    memory_limit: "1G"
```

### Health Checks
```yaml
healthcheck:
  interval: 10                    # seconds
  timeout: 5                      # seconds
  retries: 5
  start_period: 30                # seconds
```

## Environment-Specific Overrides

### Development (`environments/development.yml`)
```yaml
system:
  environment: development
  log_level: debug

security:
  rate_limit:
    requests_per_minute: 1000     # Relaxed for dev

development:
  hot_reload: true
  source_maps: true
  debug_mode: true
```

### Staging (`environments/staging.yml`)
```yaml
system:
  environment: staging
  log_level: info

security:
  cors_origins: "https://staging.zhengbi-yong.top"
```

### Production (`environments/production.yml`)
```yaml
system:
  environment: production
  log_level: warn                 # Reduced logging

ssl:
  enabled: true

domain:
  force_https: true

monitoring:
  enabled: true
  prometheus:
    enabled: true
```

## Usage

### Reading Configuration

**Rust Backend** (using `serde_yaml`):
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
struct Config {
    system: SystemConfig,
    database: DatabaseConfig,
    // ... other sections
}

fn load_config(path: &str) -> Result<Config, Error> {
    let file = std::fs::File::open(path)?;
    serde_yaml::from_reader(file)
}
```

**Frontend** (Next.js):
```typescript
// next.config.js or custom loader
import config from '../config/config.yml';

export default {
  env: {
    NEXT_PUBLIC_API_URL: config.domain.main,
  },
};
```

### Environment Variable Overrides

**Priority**: Environment variables > config files

**Backend**:
```bash
export DATABASE_URL="postgresql://..."
export REDIS_URL="redis://..."
export JWT_SECRET="production-secret-key"
```

**Frontend**:
```bash
NEXT_PUBLIC_API_URL=https://api.zhengbi-yong.top
NEXT_PUBLIC_SITE_URL=https://zhengbi-yong.top
```

## Security Best Practices

### Secret Management
1. Never commit secrets to Git
2. Use empty string in `config.yml` to auto-generate
3. Store real secrets in environment variables
4. Use secret management systems (HashiCorp Vault, AWS Secrets Manager)

### Production Checklist
- [ ] All secrets use environment variables
- [ ] SSL/TLS enabled (`ssl.enabled: true`)
- [ ] HTTPS redirection on (`domain.force_https: true`)
- [ ] Rate limiting configured
- [ ] Backups enabled
- [ ] Monitoring enabled
- [ ] Logging level appropriate (warn/error)

## Configuration Validation

### Pre-deployment Checks
```bash
# Check YAML syntax
python -c "import yaml; yaml.safe_load(open('config/config.yml'))"

# Validate required fields
./scripts/utils/config-manager.sh validate production

# Check environment override
./scripts/utils/config-manager.sh diff development production
```

## Migration Guide

### Moving from .env to config.yml

**Before** (.env files):
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=secret-key
```

**After** (config.yml):
```yaml
database:
  postgres:
    user: blog_user
    password: ""
    name: blog_db
security:
  jwt_secret: ""
```

**Benefits**:
- Single source of truth
- Version controlled structure
- Environment-specific overrides
- Validation and type checking

## Backup and Restore

### Configuration Backup
```bash
# Backup all configs
tar -czf config-backup-$(date +%Y%m%d).tar.gz config/

# Git version control
git add config/
git commit -m "docs: update configuration"
```

### Restore
```bash
# Extract backup
tar -xzf config-backup-20250103.tar.gz

# Or from Git
git checkout HEAD -- config/config.yml
```

## Common Issues

### Port Conflicts
**Problem**: Services fail to start
**Solution**:
```yaml
# Change conflicting port
ports:
  backend: 3000        # Try 3002, 3003, etc.
```

### Database Connection Failures
**Problem**: Cannot connect to PostgreSQL
**Check**:
1. Database container running: `docker ps | grep blog-postgres`
2. Credentials match: `config.yml` vs `.env`
3. Network connectivity: `docker network inspect blog-network`

### SSL Certificate Errors
**Problem**: HTTPS not working
**Solution**:
1. Ensure SSL files exist at configured paths
2. Check file permissions: `chmod 644 /etc/nginx/ssl/*`
3. Verify `ssl.enabled: true`

## Best Practices

### Development
1. Use `development.yml` for local overrides
2. Keep secrets in `.env` (not in Git)
3. Use relaxed rate limiting for debugging
4. Enable debug logging

### Production
1. Use strong auto-generated secrets
2. Enable SSL/TLS
3. Configure monitoring and alerts
4. Regular backup verification
5. Log rotation configured

### Team Collaboration
1. Document configuration changes
2. Use pull requests for config updates
3. Validate changes in staging first
4. Version control all configs
5. Use environment variables for secrets

## See Also

- `../scripts/utils/config-manager.sh` - Config management tools
- `../scripts/operations/start-prod.sh` - Production deployment
- `../backend/.env.example` - Backend environment template
- `../frontend/.env.local.example` - Frontend environment template
- `../docs/configuration/` - Detailed configuration documentation
