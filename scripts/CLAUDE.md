# scripts

## Purpose

Root-level scripts directory serving as organizational container for specialized automation scripts.

## Structure

```
scripts/
├── dev/                       # Development utilities
│   ├── restart_backend.sh     # Backend restart with rebuild
│   └── start-local.sh         # Local full-stack startup
│
├── export/                    # Data export utilities
│   └── export-posts-to-mdx.sh # Database export to multiple formats
│
├── operations/                # Operations and deployment
│   ├── quick-test.sh          # MDX rendering validation
│   ├── start-dev.sh           # Development environment launcher
│   ├── start-prod.sh          # Production deployment orchestrator
│   └── start.sh               # Quick startup with pre-built images
│
├── testing/                   # Testing utilities (placeholder)
│   └── CLAUDE.md              # Testing documentation
│
└── utils/                     # Utility scripts
    ├── analyze-bundle.sh      # Bundle size analysis
    ├── cleanup-project.sh     # Project structure cleanup
    ├── config-manager.sh      # Configuration management
    ├── download-chemistry-deps.js  # MDX dependency manager
    ├── fix-images.sh          # Image optimization
    ├── test-images.sh         # Image validation
    └── test-local.sh          # Local testing
```

## Script Categories

### Development Scripts (`scripts/dev/`)
**Purpose**: Local development workflow automation

**Key Scripts**:
- `restart_backend.sh` - Fast backend rebuild and restart
- `start-local.sh` - Full stack development server

**When to Use**:
- Active development on backend
- Testing frontend-backend integration
- Local feature development

**See**: `./dev/CLAUDE.md` for detailed documentation

### Export Scripts (`scripts/export/`)
**Purpose**: Data backup and migration utilities

**Key Script**: `export-posts-to-mdx.sh`

**Features**:
- SQL full database dump
- CSV export for spreadsheets
- JSON export with metadata
- MDX export for frontend
- Statistics generation

**When to Use**:
- Regular backups (cron jobs)
- Before major changes
- Content migration
- Disaster recovery

**See**: `./export/CLAUDE.md` for detailed documentation

### Operations Scripts (`scripts/operations/`)
**Purpose**: Deployment and service management

**Key Scripts**:
- `start-dev.sh` - Complete development environment
- `start-prod.sh` - Production deployment with Docker
- `quick-test.sh` - MDX rendering validation
- `start.sh` - Quick deployment with pre-built images

**When to Use**:
- Environment startup
- Production deployment
- System testing
- Service management

**See**: `./operations/CLAUDE.md` for detailed documentation

### Testing Scripts (`scripts/testing/`)
**Status**: Documentation directory (testing in operations/)

**Purpose**: Testing strategy and reference

**Content**:
- Backend testing procedures
- Frontend testing procedures
- Integration testing
- Performance testing guidelines

**See**: `./testing/CLAUDE.md` for detailed documentation

### Utility Scripts (`scripts/utils/`)
**Purpose**: Development productivity tools

**Key Scripts**:
- `analyze-bundle.sh` - Frontend bundle analysis
- `cleanup-project.sh` - Remove duplicates after reorganization
- `config-manager.sh` - Configuration management
- `fix-images.sh` / `test-images.sh` - Image optimization
- `test-local.sh` - Local validation

**When to Use**:
- Bundle size monitoring
- Project cleanup
- Image optimization
- Configuration validation
- Pre-deployment checks

**See**: `./utils/CLAUDE.md` for detailed documentation

## Common Workflows

### Initial Development Setup
```bash
# Option 1: Full development environment
./scripts/operations/start-dev.sh

# Option 2: Quick local start
./scripts/dev/start-local.sh

# Option 3: Manual control
# Terminal 1:
./scripts/dev/restart_backend.sh

# Terminal 2:
cd frontend && pnpm dev
```

### Feature Development
```bash
# 1. Start services
./scripts/operations/start-dev.sh

# 2. Make changes
# ... edit code ...

# 3. Test changes
./scripts/operations/quick-test.sh

# 4. Check bundle size (frontend)
cd frontend && ../scripts/utils/analyze-bundle.sh
```

### Pre-deployment Checklist
```bash
# 1. Run tests
./scripts/operations/quick-test.sh

# 2. Analyze bundle
cd frontend && ../scripts/utils/analyze-bundle.sh

# 3. Validate configuration
./scripts/utils/config-manager.sh validate production

# 4. Test images
./scripts/utils/test-images.sh ./public

# 5. Build deployment
./scripts/operations/start-prod.sh deploy --no-cache
```

### Backup Before Major Changes
```bash
# Export database content
./scripts/export/export-posts-to-mdx.sh ./backups/pre-migration-$(date +%Y%m%d)
```

### Production Deployment
```bash
# Full deployment
./scripts/operations/start-prod.sh deploy

# Skip database (if already running)
./scripts/operations/start-prod.sh deploy --force

# Check status
./scripts/operations/start-prod.sh status

# View logs
./scripts/operations/start-prod.sh logs backend
```

## Script Execution

### Making Scripts Executable
```bash
# Make all shell scripts executable
find scripts/ -name "*.sh" -exec chmod +x {} \;

# Or specific directory
chmod +x scripts/dev/*.sh
chmod +x scripts/operations/*.sh
chmod +x scripts/utils/*.sh
```

### Running Scripts
```bash
# From project root
./scripts/dev/restart_backend.sh

# Or with explicit shell
bash scripts/dev/restart_backend.sh

# JavaScript utilities
node scripts/utils/download-chemistry-deps.js
```

## Error Handling

### Script Failures
**Common Issues**:
1. Permission denied: `chmod +x script-name.sh`
2. Command not found: Check shebang (`#!/bin/bash`)
3. Docker not running: Start Docker Desktop
4. Port conflicts: Check with `lsof -i :3000`

### Debugging Scripts
```bash
# Run with bash debug mode
bash -x scripts/operations/start-dev.sh

# Check for syntax errors
bash -n scripts/operations/start-dev.sh

# View script output
./scripts/operations/start-dev.sh 2>&1 | tee startup.log
```

## Script Maintenance

### Adding New Scripts
1. Place in appropriate subdirectory
2. Make executable: `chmod +x script-name.sh`
3. Add shebang: `#!/bin/bash` or `#!/usr/bin/env node`
4. Document in this CLAUDE.md
5. Add usage examples
6. Test thoroughly

### Script Documentation
Each script directory has its own `CLAUDE.md`:
- `dev/CLAUDE.md` - Development utilities
- `export/CLAUDE.md` - Export utilities
- `operations/CLAUDE.md` - Operations scripts
- `testing/CLAUDE.md` - Testing procedures
- `utils/CLAUDE.md` - Utility scripts

### Best Practices
1. Use `set -e` for error handling
2. Add helpful error messages
3. Provide usage instructions
4. Include examples in comments
5. Log important actions
6. Clean up temporary files
7. Handle interrupts (trap signals)

## Integration Points

### Docker Integration
Scripts interact with Docker containers:
- `blog-postgres` - PostgreSQL database
- `blog-redis` - Redis cache
- `blog-backend` - Backend API
- `blog-frontend` - Frontend application

### Backend Integration
Scripts build and manage backend:
- Rust compilation: `cargo build`
- Environment setup: `.env` file creation
- Server management: Start/stop/restart

### Frontend Integration
Scripts interact with frontend:
- Package management: `pnpm install`
- Development server: `pnpm dev`
- Production build: `pnpm build`
- Bundle analysis: `ANALYZE=true pnpm build`

### Database Integration
Scripts work with PostgreSQL:
- Migrations: SQLx managed
- Data export: pg_dump and psql
- Backup generation: Automated dumps

## Automation Opportunities

### Cron Jobs
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/scripts/export/export-posts-to-mdx.sh

# Weekly bundle analysis
0 0 * * 0 cd /path/to/frontend && ../scripts/utils/analyze-bundle.sh

# Monthly cleanup
0 0 1 * * /path/to/scripts/utils/cleanup-project.sh
```

### GitHub Actions
Scripts can be called from CI/CD:
```yaml
- name: Run tests
  run: ./scripts/operations/quick-test.sh

- name: Build bundles
  run: |
    cd frontend
    ../scripts/utils/analyze-bundle.sh
```

## See Also

- `./dev/CLAUDE.md` - Development utilities
- `./export/CLAUDE.md` - Export utilities
- `./operations/CLAUDE.md` - Operations scripts
- `./testing/CLAUDE.md` - Testing documentation
- `./utils/CLAUDE.md` - Utility scripts
- `../.github/workflows/` - CI/CD automation
- `../docs/deployment/` - Deployment documentation
