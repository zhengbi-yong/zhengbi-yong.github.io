# docs

## Purpose

Comprehensive project documentation covering architecture, development, deployment, and operational procedures.

## Structure

```
docs/
├── README.md                  # Main documentation index (462 lines)
├── INDEX.md                   # Quick navigation guide
├── quick-start.md             # Fast setup guide
├── RESOLUTION_SUMMARY.md      # Issue resolutions and decisions
│
├── getting-started/           # Onboarding guides
│   ├── installation.md
│   ├── first-project.md
│   └── basic-usage.md
│
├── configuration/             # Configuration guides
│   ├── system-config.md
│   ├── database.md
│   ├── nginx.md
│   └── ssl-tls.md
│
├── development/               # Development documentation
│   ├── architecture.md
│   ├── backend-dev.md
│   ├── frontend-dev.md
│   ├── debugging.md
│   └── testing.md
│
├── deployment/                # Deployment procedures
│   ├── docker.md
│   ├── production.md
│   ├── staging.md
│   └── monitoring.md
│
├── operations/                # Operational procedures
│   ├── backup-restore.md
│   ├── maintenance.md
│   ├── troubleshooting.md
│   └── performance-tuning.md
│
├── migration/                 # Migration guides
│   ├── data-migration.md
│   ├── version-migration.md
│   └── platform-migration.md
│
├── testing/                   # Testing documentation
│   ├── unit-tests.md
│   ├── integration-tests.md
│   ├── e2e-tests.md
│   └── load-tests.md
│
├── guides/                    # How-to guides
│   ├── adding-features.md
│   ├── customizing-ui.md
│   ├── writing-plugins.md
│   └── contributing.md
│
├── reference/                 # Reference materials
│   ├── api-reference.md
│   ├── database-schema.md
│   ├── environment-vars.md
│   └── cli-commands.md
│
├── appendix/                  # Supplementary materials
│   ├── glossary.md
│   ├── changelog.md
│   └── faq.md
│
└── archive/                   # Deprecated documentation
    └── ...                    # Old versions kept for reference
```

## Quick Navigation

### New Users
1. Start with `quick-start.md`
2. Read `getting-started/` guides
3. Follow `development/` for setup

### Developers
1. `development/architecture.md` - System overview
2. `development/backend-dev.md` - Backend development
3. `development/frontend-dev.md` - Frontend development
4. `testing/` - Test procedures

### Operators
1. `deployment/` - Deployment strategies
2. `operations/` - Daily operations
3. `troubleshooting.md` - Common issues

### Contributors
1. `guides/contributing.md` - Contribution workflow
2. `development/testing.md` - Test requirements
3. `reference/` - API and CLI references

## Core Documentation

### README.md (462 lines)
**Purpose**: Main project documentation hub

**Contents**:
- Project overview
- Architecture diagram
- Technology stack
- Setup instructions
- Development workflow
- Deployment procedures
- Troubleshooting guide
- Contributing guidelines

### INDEX.md
**Purpose**: Navigation and search optimization

**Contents**:
- Categorized links
- Quick reference cards
- Common task shortcuts
- Related documentation links

### quick-start.md
**Purpose**: 5-minute setup guide

**Prerequisites**:
- Docker installed
- Git installed
- Basic CLI knowledge

**Steps**:
1. Clone repository
2. Configure environment
3. Start services
4. Access application
5. Next steps

## Development Guides

### Architecture (`development/architecture.md`)
**Topics**:
- System design overview
- Component interactions
- Data flow diagrams
- Technology choices
- Scalability considerations

### Backend Development (`development/backend-dev.md`)
**Topics**:
- Rust workspace structure
- API endpoint design
- Database migrations
- Testing strategies
- Code organization

### Frontend Development (`development/frontend-dev.md`)
**Topics**:
- Next.js 15 app structure
- Component architecture
- State management
- MDX rendering
- Performance optimization

## Configuration Guides

### System Configuration (`configuration/system-config.md`)
**Covers**:
- `config/config.yml` structure
- Environment-specific settings
- Secret management
- Configuration validation

### Database Configuration (`configuration/database.md`)
**Covers**:
- PostgreSQL setup
- Redis configuration
- Connection pooling
- Backup strategies
- Migration procedures

### Nginx Configuration (`configuration/nginx.md`)
**Covers**:
- Reverse proxy setup
- SSL/TLS termination
- Load balancing
- Static asset serving
- Security headers

## Deployment Documentation

### Docker Deployment (`deployment/docker.md`)
**Process**:
1. Building images
2. Container orchestration
3. Service dependencies
4. Health checks
5. Rolling updates

### Production Deployment (`deployment/production.md`)
**Checklist**:
- Pre-deployment validation
- Security hardening
- Performance tuning
- Monitoring setup
- Backup verification

### Staging Environment (`deployment/staging.md`)
**Purpose**: Pre-production testing environment

**Configuration**: Mirrors production with relaxed security

## Operational Procedures

### Backup and Restore (`operations/backup-restore.md`)
**Procedures**:
- Database backups (daily automated)
- Volume snapshots
- Configuration backups
- Restore procedures
- Disaster recovery

### Maintenance (`operations/maintenance.md`)
**Tasks**:
- Regular maintenance schedule
- Log rotation
- Database vacuuming
- Cache clearing
- Dependency updates

### Troubleshooting (`operations/troubleshooting.md`)
**Common Issues**:
- Service failures
- Database connection errors
- Performance degradation
- SSL/TLS problems
- Memory leaks

## Migration Guides

### Data Migration (`migration/data-migration.md`)
**Scenarios**:
- Database schema changes
- Content migration
- User data transfer
- Backup restoration

### Version Migration (`migration/version-migration.md`)
**Process**:
1. Review changelog
2. Test in staging
3. Backup production
4. Run migrations
5. Verify functionality
6. Monitor issues

## Testing Documentation

### Unit Tests (`testing/unit-tests.md`)
**Backend**: `cargo test`
**Frontend**: `pnpm test`

**Coverage Goals**:
- Backend: 80%+
- Frontend: 75%+

### Integration Tests (`testing/integration-tests.md`)
**Scenarios**:
- API endpoint testing
- Database operations
- Authentication flows
- Payment processing

### E2E Tests (`testing/e2e-tests.md`)
**Tools**: Playwright (planned)

**Scenarios**:
- User registration
- Content creation
- Comment submission
- Admin operations

## Reference Materials

### API Reference (`reference/api-reference.md`)
**Contents**:
- Endpoint listings
- Request/response formats
- Authentication methods
- Error codes
- Rate limits

### Database Schema (`reference/database-schema.md`)
**Contents**:
- Table definitions
- Indexes
- Relationships
- Constraints
- Migration history

### Environment Variables (`reference/environment-vars.md`)
**Categories**:
- Backend variables
- Frontend variables
- Database credentials
- Security secrets
- Feature flags

## Contribution Guidelines

### Contributing (`guides/contributing.md`)
**Process**:
1. Fork repository
2. Create feature branch
3. Make changes
4. Write tests
5. Update documentation
6. Submit PR

### Code Standards
- Backend: `cargo fmt` + `cargo clippy`
- Frontend: ESLint + Prettier
- Commits: Conventional Commits
- Documentation: Markdown format

## Issue Resolution

### RESOLUTION_SUMMARY.md
**Purpose**: Track important decisions and problem solutions

**Contents**:
- Architectural decisions
- Bug resolutions
- Performance improvements
- Security fixes
- Breaking changes

## Archive

### Deprecated Documentation
**Purpose**: Keep old documentation for reference

**Contents**:
- Previous version docs
- Deprecated features
- Historical procedures
- Legacy configurations

## Documentation Best Practices

### Writing Style
- Use clear, concise language
- Provide code examples
- Include diagrams where helpful
- Keep descriptions up to date
- Link related topics

### Maintenance
- Review quarterly
- Update with each release
- Archive deprecated docs
- Solicit feedback
- Track metrics

## Search Tips

### Finding Information
1. Use `INDEX.md` for categorized links
2. Search filenames for topics
3. Check reference/ for specifications
4. Look in guides/ for how-tos
5. See troubleshooting for issues

### Quick Commands
```bash
# Search documentation
grep -r "keyword" docs/

# Find files by type
find docs/ -name "*api*"

# View table of contents
head -100 docs/README.md
```

## See Also

- `../README.md` - Main project README
- `../backend/README.md` - Backend-specific documentation
- `../frontend/README.md` - Frontend-specific documentation
- `../config/config.yml` - Configuration reference
- `../.github/` - CI/CD workflows
