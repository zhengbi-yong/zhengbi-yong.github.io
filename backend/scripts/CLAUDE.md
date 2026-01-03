# Backend Scripts

## Module Overview

Automation scripts for backend development, testing, and deployment tasks.

## Purpose

Provide convenient utilities for common backend operations (health checks, environment setup, MDX sync, testing).

## Structure

```
backend/scripts/
├── check-backend.ps1          # Windows: Backend health check
├── check-backend.sh           # Unix: Backend health check
├── ensure-env.ps1             # Windows: Ensure environment files exist
├── load-env.ps1               # Windows: Load environment variables
├── load-env.sh                # Unix: Load environment variables
├── run-dev.ps1                # Windows: Run development server
├── run-dev.sh                 # Unix: Run development server
├── setup-env.ps1              # Windows: Setup environment configuration
├── start-backend-and-test.ps1 # Windows: Start backend and run tests
├── sync-mdx.sh                # Sync MDX files with frontend
├── data/                      # Data management scripts
├── database/                  # Database operations
├── deployment/                # Deployment automation
├── development/               # Development utilities
├── openapi/                   # OpenAPI spec generation
├── testing/                   # Testing helpers
```

## Health Check Scripts

### check-backend.sh (Unix)

**Purpose**: Check backend service health status

**Usage**:
```bash
./backend/scripts/check-backend.sh [URL]
```

**Default URL**: `http://localhost:3000`

**Features**:
- Port availability check (`netstat`/`nc`)
- Health endpoint polling (`/healthz`)
- Retry logic with exponential backoff
- Detailed diagnostics on failure

**Output Example**:
```
🔍 检查后端服务状态...
   URL: http://localhost:3000

   检查端口 3000...
   ✓ 端口 3000 正在监听

   尝试连接: http://localhost:3000/healthz (超时: 10秒)...
✅ 后端服务运行正常！
   状态码: 200
   服务状态: healthy
   版本: 1.0.0
   运行时间: 2:30:45
```

**Health Endpoint Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 9045,
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### check-backend.ps1 (Windows)

**Purpose**: Windows-compatible health check

**Features**: Same as Unix version, with Windows-specific commands

## Environment Management

### load-env.sh (Unix)

**Purpose**: Load environment variables from `.env` files

**Usage**:
```bash
source ./backend/scripts/load-env.sh
```

**Behavior**:
- Sources `.env` files from project root
- Exports variables to shell
- Handles special characters and quotes

### load-env.ps1 (Windows)

**Purpose**: PowerShell environment variable loading

**Usage**:
```powershell
.\backend\scripts\load-env.ps1
```

### ensure-env.ps1 (Windows)

**Purpose**: Ensure environment files exist

**Behavior**:
- Checks for `.env` files
- Copies from `.env.*.example` if missing
- Creates necessary directories

### setup-env.ps1 (Windows)

**Purpose**: Complete environment setup

**Features**:
- Create `.env` from examples
- Set default values
- Validate required variables

## Development Scripts

### run-dev.sh (Unix)

**Purpose**: Start development server

**Usage**:
```bash
./backend/scripts/run-dev.sh
```

**Features**:
- Set `RUST_LOG=debug`
- Enable auto-reloading
- Port configuration
- Environment validation

### run-dev.ps1 (Windows)

**Purpose**: Windows development server startup

**Features**: Same as Unix version

### start-backend-and-test.ps1 (Windows)

**Purpose**: Start backend, wait for health, run tests

**Usage**:
```powershell
.\backend\scripts\start-backend-and-test.ps1
```

**Features**:
- Backend startup with timeout
- Health check polling
- Automated test execution
- Cleanup on failure

## MDX Sync Script

### sync-mdx.sh

**Purpose**: Synchronize MDX content files between backend and frontend

**Usage**:
```bash
./backend/scripts/sync-mdx.sh
```

**Features**:
- Copy MDX files from `backend/content/` to `frontend/content/`
- Preserve metadata and frontmatter
- Validate MDX syntax
- Update content index

**Directories**:
- **Source**: `backend/content/posts/`
- **Destination**: `frontend/content/posts/`

## Script Organization

### data/

**Purpose**: Data seeding and management scripts

**Scripts**:
- `seed-dev-data.sh` - Populate development database
- `reset-db.sh` - Reset database to clean state
- `import-content.sh` - Import content from external sources

### database/

**Purpose**: Database operations

**Scripts**:
- `migrate.sh` - Run database migrations
- `rollback.sh` - Rollback last migration
- `backup.sh` - Backup database
- `restore.sh` - Restore from backup

### deployment/

**Purpose**: Deployment automation

**Scripts**:
- `build.sh` - Build release binary
- `deploy.sh` - Deploy to server
- `rollback.sh` - Rollback deployment
- `health-check.sh` - Post-deployment health check

### development/

**Purpose**: Development utilities

**Scripts**:
- `format.sh` - Format Rust code (`cargo fmt`)
- `lint.sh` - Run linters (`cargo clippy`)
- `test.sh` - Run tests
- `watch.sh` - Watch mode for development

### openapi/

**Purpose**: OpenAPI specification generation

**Scripts**:
- `generate.sh` - Generate OpenAPI spec from code
- `validate.sh` - Validate OpenAPI spec
- `docs.sh` - Generate API documentation

### testing/

**Purpose**: Testing helpers

**Scripts**:
- `unit.sh` - Run unit tests
- `integration.sh` - Run integration tests
- `coverage.sh` - Generate test coverage report
- `e2e.sh` - Run end-to-end tests

## Script Conventions

### Shebang

**Unix Scripts**:
```bash
#!/bin/bash
set -euo pipefail  # Strict error handling
```

### Error Handling

**Unix**:
```bash
set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure
```

**PowerShell**:
```powershell
$ErrorActionPreference = "Stop"
```

### Logging

**Format**:
```bash
echo "✓ Success message"
echo "✗ Error message"
echo "⚠️  Warning message"
echo "→ Info message"
```

### Usage Information

**Every script should include**:
```bash
usage() {
    echo "Usage: $0 [options] [arguments]"
    echo "Description of what the script does"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose output"
    exit 1
}
```

## Environment Variables

### Required Variables

**Database**:
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name

**Backend**:
- `BACKEND_PORT` - Backend server port (default: 3000)
- `RUST_LOG` - Log level (debug, info, warn, error)
- `JWT_SECRET` - JWT signing secret
- `PASSWORD_PEPPER` - Password pepper for hashing
- `SESSION_SECRET` - Session encryption secret

**Redis**:
- `REDIS_URL` - Redis connection string

**CORS**:
- `CORS_ALLOWED_ORIGINS` - Comma-separated allowed origins

**Rate Limiting**:
- `RATE_LIMIT_PER_MINUTE` - Requests per minute limit

### Optional Variables

**Email**:
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USERNAME` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_FROM` - Sender email address

## Cross-Platform Compatibility

### Platform Detection

**Unix/Linux**:
```bash
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "macOS"
fi
```

**Windows**:
```powershell
if ($IsWindows) {
    # Windows-specific code
}
```

### Command Compatibility

**Netstat** (Windows/Unix):
```bash
# Unix
netstat -an | grep ":3000"

# Windows
netstat -ano | findstr ":3000"
```

**ps** (Process list):
```bash
# Unix
ps aux | grep blog-backend

# Windows
Get-Process | Where-Object {$_.ProcessName -like "blog*"}
```

## CI/CD Integration

### GitHub Actions

```yaml
steps:
  - name: Run backend health check
    run: ./backend/scripts/check-backend.sh

  - name: Run tests
    run: ./backend/scripts/testing/integration.sh
```

### Docker

```dockerfile
COPY backend/scripts /scripts
RUN chmod +x /scripts/*.sh
ENTRYPOINT ["/scripts/run-dev.sh"]
```

## Best Practices

### Script Design
1. **Single Responsibility**: Each script does one thing well
2. **Idempotency**: Safe to run multiple times
3. **Fail Fast**: Exit on first error
4. **Verbose Logging**: Show what's happening
5. **Help Messages**: Document usage

### Error Messages
- Clear and actionable
- Suggest solutions
- Include relevant context

### Testing
- Test scripts on multiple platforms
- Validate environment handling
- Check error scenarios

## Troubleshooting

### Permission Denied (Unix)
```bash
chmod +x backend/scripts/*.sh
```

### Execution Policy (Windows)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Environment Variables Not Loading
- Check `.env` file exists
- Verify file format (no extra spaces)
- Ensure proper sourcing

## Related Modules

- **Backend Source**: `../src/` - Application code
- **Migrations**: `../migrations/` - Database migrations
- **GitHub Workflows**: `../../.github/workflows/` - CI/CD scripts
- **Deployment Scripts**: `../../deployments/scripts/` - Deployment automation

## Resources

- [Bash Scripting Best Practices](https://github.com/alexandreborges/bash-best-practices)
- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [ShellCheck](https://www.shellcheck.net/) - Linter for shell scripts

---

**Last Updated**: 2026-01-03
**Maintained By**: Backend Team
