# Git Hooks Configuration

## Purpose
Git hooks automation for code quality, testing, and commit standards.

## Directory Structure

```
frontend/.husky/
└── pre-commit          # Pre-commit hook script
```

## Hook Configuration

### Pre-commit Hook
**File**: `.husky/pre-commit`

**Action**: Runs test suite before allowing commits

**Command**:
```bash
pnpm test
```

**Behavior**:
- Blocks commits if tests fail
- Ensures code quality before pushing
- Catches bugs early in development cycle

## Hook Types

### Currently Active
- **pre-commit**: Runs before commit creation

### Recommended Additions
```bash
# Pre-commit: Lint + Format + Test
.husky/pre-commit: pnpm lint && pnpm format && pnpm test

# Commit-msg: Validate commit message format
.husky/commit-msg: commitlint --edit $1

# Pre-push: Full test suite + E2E
.husky/pre-push: pnpm test && pnpm test:e2e
```

## Maintenance

### Hook Installation
Hooks are installed via `husky` npm package:

```bash
pnpm install husky
pnpm prepare  # Sets up .git/hooks
```

### Hook Updates
Edit files directly in `.husky/` directory.
Changes take effect immediately on next git operation.

### Permissions
Hooks must be executable:
```bash
chmod +x .husky/*
```

## Best Practices

### Hook Performance
- Keep hooks fast (< 30 seconds)
- Use caching for expensive operations
- Run only necessary checks per hook type

### Hook Responsibilities
1. **pre-commit**: Fast checks (linting, formatting, unit tests)
2. **commit-msg**: Commit message validation
3. **pre-push**: Comprehensive checks (E2E, integration tests)

### User Override
To bypass hooks (use sparingly):
```bash
git commit --no-verify
git push --no-verify
```

## Related Modules
- `frontend/package.json` - Test scripts
- `frontend/e2e/` - E2E test suites
- `.github/workflows/` - CI/CD pipelines (if exists)
