# .husky

## Purpose

Git hooks automation using Husky for code quality enforcement and commit message validation.

## Core Components

### pre-commit
**Purpose**: Execute code quality checks before allowing commits

**Checks Performed**:

**Frontend**:
1. ESLint with max 200 warnings
2. Console call detection (warning only)
3. Automated cleanup suggestions

**Backend**:
1. Rust formatting check (`cargo fmt --check`)
2. Clippy linting (`cargo clippy -- -D warnings`)
3. Quick library tests (`cargo test --lib`)

**Usage**: Automatic on `git commit`

**Error Handling**:
- Fails commit if any check fails
- Provides actionable error messages
- Suggests fix commands

### commit-msg
**Purpose**: Enforce Conventional Commits standard

**Validation**:
- Format: `<type>(<scope>): <subject>`
- Minimum subject length: 10 characters
- Allowed types: feat, fix, docs, style, refactor, perf, test, chore, ci, revert

**Examples**:
```
feat(auth): add OAuth2 login support
fix(api): resolve race condition in user creation
docs(readme): update installation instructions
```

**Usage**: Automatic on `git commit`

**Error Handling**:
- Rejects non-conforming messages
- Shows format requirements
- Provides example messages

## Installation

```bash
# Husky is typically installed via package.json
pnpm install husky --save-dev

# Initialize Git hooks
pnpm exec husky install

# Create hooks (if not exists)
pnpm exec husky add .husky/pre-commit "pnpm lint"
pnpm exec husky add .husky/commit-msg 'npx --no -- commitlint --edit $1'
```

## Configuration

### Husky Settings
**Location**: `package.json` (frontend)

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

## Hook Execution Flow

```
git commit
    │
    ├─→ pre-commit
    │   ├─→ Frontend ESLint
    │   ├─→ Console check (warning)
    │   ├─→ Backend rustfmt
    │   ├─→ Backend clippy
    │   └─→ Backend tests
    │
    └─→ commit-msg
        └─→ Format validation
```

## Frontend Checks

### ESLint
```bash
cd frontend
pnpm lint --max-warnings=200
```

**Config**: `frontend/eslint.config.mjs`

**Scope**: `app/`, `components/`, `lib/`, `layouts/`, `scripts/`

**Exclusions**: `node_modules`, `.next`, test files, debug files

### Console Detection
```bash
grep -r "console\." app components lib layouts scripts \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next
```

**Fix Command**: `pnpm cleanup-console` (if exists)

## Backend Checks

### Formatting
```bash
cd backend
cargo fmt --check
```

**Fix**: `cargo fmt`

### Linting
```bash
cargo clippy --quiet -- -D warnings
```

**Flags**:
- `--quiet`: Suppress cargo output
- `-D warnings`: Deny all warnings

### Testing
```bash
cargo test --quiet --lib
```

**Scope**: Library tests only (fast check)

## Commit Message Format

### Structure
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `revert`: Revert a previous commit

### Scopes
Common scopes:
- `auth`: Authentication/authorization
- `api`: API endpoints
- `frontend`: Frontend changes
- `backend`: Backend changes
- `docs`: Documentation
- `config`: Configuration
- `deploy`: Deployment

## Best Practices

### Writing Commit Messages
1. Use imperative mood ("add" not "added")
2. Keep first line under 72 characters
3. Explain what and why, not how
4. Reference issues in footer: `Closes #123`

### Pre-commit Efficiency
1. Keep checks fast (< 30 seconds)
2. Use incremental test selection
3. Cache dependencies properly
4. Run tests in parallel when possible

## Troubleshooting

### Hooks Not Running
```bash
# Check hooks are executable
ls -la .husky/

# Make executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# Reinstall hooks
pnpm exec husky install
```

### Bypassing Hooks (Not Recommended)
```bash
# Bypass pre-commit
git commit --no-verify -m "message"

# Bypass commit-msg
git commit --no-verify -m "message"
```

**Warning**: Only use for emergencies, not routine commits

### Clippy Fails
```bash
# Run clippy with explanations
cd backend
cargo clippy -- -D warnings -W clippy::all

# Auto-fix some issues
cargo clippy --fix -- -D warnings
```

### ESLint Timeout
```bash
# Check configuration
cd frontend
cat eslint.config.mjs

# Run with verbose output
pnpm lint --debug
```

## Integration with CI/CD

**GitHub Actions**: Hooks run locally first
- CI provides safety net if hooks bypassed
- Parallel verification of code quality
- Consistent checks across team

## See Also

- `./frontend/.github/workflows/frontend-ci.yml` - CI linting
- `./backend/.github/workflows/backend-ci.yml` - CI testing
- `CONTRIBUTING.md` - Contribution guidelines
- Conventional Commits: https://www.conventionalcommits.org/
