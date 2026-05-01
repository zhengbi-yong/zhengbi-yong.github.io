# CI Quality Gates

**Last updated**: 2026-05-01

## Overview

This document describes all automated quality gates enforced in the CI/CD pipeline and pre-commit hooks. Every check listed here must pass before code can be merged to `main` or `develop`.

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Git Push / PR                        │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌──────────────────────┐               ┌──────────────────────┐
│    Pre-commit Hook   │               │    GitHub Actions    │
│    (.husky/)         │               │    CI Workflows      │
└──────────────────────┘               └──────────────────────┘
          │                                       │
          ▼                           ┌───────────┴───────────┐
┌──────────────────────┐              ▼                       ▼
│  ✅ ESLint           │   ┌──────────────────┐   ┌──────────────────┐
│  ✅ Console check    │   │  Frontend CI     │   │  Backend CI      │
│  ✅ Frontend tests   │   │  (.github/       │   │  (.github/        │
│  ✅ rustfmt          │   │   workflows/     │   │   workflows/      │
│  ✅ clippy           │   │   frontend-ci)   │   │   backend-ci)     │
└──────────────────────┘   └──────────────────┘   └──────────────────┘
                                       │                       │
                            ┌──────────┴──────────┐    ┌──────┴──────┐
                            ▼          ▼          ▼    ▼             ▼
                       ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
                       │ Lint   ││ Test + ││ Build  ││Clippy  ││ Test   │
                       │        ││Coverage││        ││(strict)││(DB)    │
                       └────────┘└────────┘└────────┘└────────┘└────────┘
```

---

## Pre-commit Hook (`.husky/pre-commit`)

Runs automatically before every `git commit`. All checks must pass or the commit is blocked.

### Quality Gates

| # | Gate | Command | What It Checks | Fail Behavior |
|---|------|---------|----------------|---------------|
| 1 | **ESLint** | `pnpm lint --max-warnings=600` | JavaScript/TypeScript code quality in `frontend/` | Blocks commit |
| 2 | **Console check** | `grep -r "console\\." ...` | Accidental `console.log` in production code | Warning only |
| 3 | **Frontend tests (fast)** | `pnpm test --bail=2` | Fast subset of frontend Vitest tests | Blocks commit |
| 4 | **rustfmt** | `cargo fmt --check` | Rust code formatting in `backend/` | Blocks commit |
| 5 | **Clippy** | `cargo clippy --quiet -- -D warnings` | Rust linting — all warnings are errors | Blocks commit |

> **Note**: Full `cargo test --lib` is intentionally NOT run in pre-commit (too slow). It runs in CI instead.

### What's NOT in Pre-commit

| Excluded | Why | Where It Runs |
|----------|-----|---------------|
| Full `cargo test --workspace` | Too slow, requires PostgreSQL/Redis | Backend CI |
| TypeScript type check | Handled by `next build` in CI | Frontend CI build job |
| E2E tests | Requires browser, very slow | Frontend CI e2e job |
| Coverage thresholds | Only meaningful with full suite | Frontend CI test job |

---

## Frontend CI (`.github/workflows/frontend-ci.yml`)

**Triggers**: Push/PR to `main` or `develop` with changes in `frontend/**`

### Quality Gates

#### Gate 1: Lint & Type Check (`lint` job)
| Aspect | Detail |
|--------|--------|
| **What** | ESLint code quality |
| **Command** | `pnpm lint` |
| **Failure** | ESLint errors or exceeding max warnings |
| **Blocking** | Yes — build depends on this job |

#### Gate 2: Unit Tests + Coverage (`test` job)
| Aspect | Detail |
|--------|--------|
| **What** | All Vitest tests with coverage |
| **Command** | `pnpm test --coverage` |
| **Coverage Thresholds** | Statements: 70%, Branches: 65%, Functions: 70%, Lines: 70% |
| **Config location** | `frontend/vitest.config.mts` |
| **Failure** | Any test failure OR coverage below threshold |
| **Blocking** | Yes — build depends on this job |

#### Gate 3: Build (`build` job)
| Aspect | Detail |
|--------|--------|
| **What** | Production build (`next build`) — catches TypeScript errors |
| **Command** | `pnpm build` |
| **Dependencies** | Must pass `lint` AND `test` jobs first |
| **Failure** | Build errors or TypeScript errors |
| **Blocking** | Yes — E2E depends on this job |

#### Gate 4: E2E Tests (`e2e` job)
| Aspect | Detail |
|--------|--------|
| **What** | Playwright browser tests |
| **Command** | `pnpm exec playwright test e2e/abc-notation.spec.ts e2e/search.spec.ts --project=chromium` |
| **Dependencies** | Must pass `build` job first |
| **Failure** | Any E2E test failure |
| **Blocking** | No (informational) |

### Job Dependencies
```
lint ──┬── test ── build ── e2e
       │
       └── build (needs: [lint, test])
```

---

## Backend CI (`.github/workflows/backend-ci.yml`)

**Triggers**: Push/PR to `main` or `develop` with changes in `backend/**`

### Quality Gates

#### Gate 1: Clippy Lint (`lint` job)
| Aspect | Detail |
|--------|--------|
| **What** | Rust static analysis — all warnings treated as errors |
| **Command** | `cargo clippy --workspace -- -D warnings` |
| **Failure** | Any Clippy warning |
| **Blocking** | No (informational) |

#### Gate 2: Database Migration + Tests (`test` job)
| Aspect | Detail |
|--------|--------|
| **What** | Full Rust test suite with real PostgreSQL database |
| **Service containers** | PostgreSQL 17, Redis 7.4-alpine |
| **Migration** | `cargo sqlx migrate run` runs before tests |
| **Command** | `cargo test --workspace --locked` |
| **`--locked` flag** | Ensures `Cargo.lock` is up to date (fails if lockfile is stale) |
| **Failure** | Any test failure OR stale lockfile |
| **Blocking** | Yes (only job besides lint) |

### Service Containers

| Service | Image | Port | Health Check |
|---------|-------|------|--------------|
| PostgreSQL | `postgres:17` | 5432 | `pg_isready` |
| Redis | `redis:7.4-alpine` | 6379 | `redis-cli ping` |

**Test database**: `blog_test` with user `blog_user` / password `blog_password`

---

## Coverage Thresholds

### Frontend (Vitest)

Configured in `frontend/vitest.config.mts`:

```typescript
coverage: {
  provider: 'v8',
  thresholds: {
    statements: 70,
    branches: 65,
    functions: 70,
    lines: 70,
  },
}
```

Vitest exits with a non-zero status code if any threshold is not met, causing the CI test job to fail.

---

## How to Add a New Quality Gate

### Adding a Frontend Quality Gate

1. **Determine where it belongs** in the pipeline:
   - **Pre-commit**: Fast checks (< 30 seconds), no external dependencies
   - **CI job**: Slower checks, needs services or browsers
   - **New CI job**: Entirely new category of check

2. **Add to pre-commit** (`.husky/pre-commit`):
   ```sh
   echo "  → Running [check name]..."
   cd frontend
   pnpm [command] || {
     echo "❌ [check name] failed. [fix instructions]"
     exit 1
   }
   ```

3. **Add to frontend CI** (`.github/workflows/frontend-ci.yml`):
   ```yaml
   [job-name]:
     name: [Display Name]
     needs: [dependent-jobs]
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: pnpm/action-setup@v4
       - uses: actions/setup-node@v4
         with:
           node-version: '20'
           cache: 'pnpm'
           cache-dependency-path: 'frontend/pnpm-lock.yaml'
       - name: Install dependencies
         working-directory: ./frontend
         run: pnpm install --frozen-lockfile
       - name: [Step name]
         working-directory: ./frontend
         run: [command]
   ```

4. **Update dependencies** if the new job should block others:
   - Add `needs: [new-job-name]` to downstream jobs
   - Update this document

### Adding a Backend Quality Gate

1. **Add to backend CI** (`.github/workflows/backend-ci.yml`):
   ```yaml
   [job-name]:
     name: [Display Name]
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: actions-rust-lang/setup-rust-toolchain@v1
       - name: [Step name]
         working-directory: ./backend
         run: [command]
   ```

2. **Add service containers** if needed:
   ```yaml
   services:
     [service-name]:
       image: [image]:[tag]
       ports:
         - [port]:[port]
       options: >-
         --health-cmd [health-check]
         --health-interval 10s
         --health-timeout 5s
   ```

3. **Update this document** with the new gate details.

---

## Bypassing Quality Gates

### Emergency Bypass

In rare emergencies, pre-commit hooks can be bypassed:

```bash
git commit --no-verify -m "emergency: reason for bypass"
```

⚠️ **Warning**: CI will still run on push/PR. Bypassing pre-commit does not bypass CI gates.

### CI Bypass

CI quality gates on protected branches (`main`, `develop`) cannot be bypassed. All required checks must pass before merging.

---

## Monitoring and Troubleshooting

### Check CI Status

- **GitHub Actions tab**: https://github.com/zhengbi-yong/zhengbi-yong.github.io/actions
- **PR status checks**: Visible at the bottom of every pull request

### Common Failures

| Failure | Likely Cause | Fix |
|---------|-------------|-----|
| Frontend `lint` fails | ESLint errors or >600 warnings | Run `pnpm lint` locally, fix issues |
| Frontend `test` fails | Test failure or coverage below threshold | Run `pnpm test:coverage` locally |
| Frontend `build` fails | TypeScript errors or build issue | Run `pnpm build` locally |
| Backend `clippy` fails | Rust lint warnings | Run `cargo clippy -- -D warnings` locally |
| Backend `test` fails | Test failure or stale lockfile | Run `cargo test --workspace --locked` locally |
| Backend migration fails | Database schema mismatch | Run `cargo sqlx migrate run` locally |
| Pre-commit blocks | Any hook failure | See error message for specific fix |

### Local Pre-commit Diagnosis

```bash
# Run all pre-commit checks manually
bash .husky/pre-commit

# Run individual checks
cd frontend && pnpm lint
cd frontend && pnpm test --bail=2
cd backend && cargo fmt --check
cd backend && cargo clippy --quiet -- -D warnings
```

---

## Related Documentation

- `docs/testing/testing-completion-guide.md` — MDX testing guide
- `docs/testing/frontend-testing-report.md` — Frontend test report
- `docs/testing/admin-test-report.md` — Admin panel test report
- `.github/workflows/frontend-ci.yml` — Frontend CI workflow definition
- `.github/workflows/backend-ci.yml` — Backend CI workflow definition
- `.husky/pre-commit` — Pre-commit hook script
- `frontend/vitest.config.mts` — Vitest configuration with coverage thresholds
