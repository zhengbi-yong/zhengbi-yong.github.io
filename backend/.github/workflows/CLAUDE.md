# GitHub Workflows

## Module Overview

CI/CD pipeline configuration for automated testing and deployment.

## Architecture Layer

### Layer 3: DevOps Automation

```
.github/workflows/
└── ci.yml    # Continuous integration pipeline
```

## CI Pipeline (ci.yml)

**Purpose**: Automated testing on push/PR

**Triggers**:
- Push to main/master
- Pull requests
- Manual dispatch

**Jobs**:
1. **Lint** - Code quality checks
2. **Test** - Unit and integration tests
3. **Build** - Compilation verification
4. **Security** - Dependency scanning

## Workflow Features

### Matrix Testing
- Multiple Rust versions
- Different OS targets
- Feature flag combinations

### Caching
- Cargo registry
- Build artifacts
- Dependencies

### Artifacts
- Test results
- Coverage reports
- Build binaries

## Related

- `/Cargo.toml` - Root workspace config
- `/backend/Dockerfile` - Container builds
- `.github/dependabot.yml` - Dependency updates
