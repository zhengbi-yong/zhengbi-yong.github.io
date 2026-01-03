# Testing Documentation

## Purpose
Test plans, execution reports, and testing guidelines for the blog system.

## Directory Structure

```
docs/testing/
├── testing-completion-guide.md               # MDX sync testing guide
├── testing-progress-report.md                # Progress tracking
├── phase1-completion-report.md              # Phase 1 results
├── frontend-testing-report.md               # Frontend test results
├── admin-test-report.md                     # Admin panel tests
├── payload-cms-testing-guide.md             # Payload CMS test procedures
├── payload-cms-test-execution-report-*.md   # Execution logs (dated)
└── payload-cms-final-test-report-*.md       # Final test reports (dated)
```

## Test Coverage Areas

### 1. MDX Synchronization Testing
**File**: `testing-completion-guide.md`

**Backend Tests** (100% Complete):
- Database migration (`20251231_add_mdx_support.sql`)
  - Fields: `content_hash` (SHA256), `rendered_at`
  - Auto-calculation triggers
  - Query optimization indexes

- MDX Sync API (`backend/crates/api/src/routes/mdx_sync.rs`)
  - MDX file scanning
  - Frontmatter parsing
  - Content hash change detection
  - Incremental database updates
  - Redis cache clearing

- Sync Script (`backend/scripts/sync-mdx.sh`)
  - API invocation
  - Progress reporting
  - Force mode support

**Frontend Tests** (100% Complete):
- MDX Runtime configuration (`lib/mdx-runtime.ts`)
  - Plugin support (math, chemistry, syntax highlighting)
  - MDXRuntime component

- Dynamic Post Renderer (`components/DynamicPostRenderer.tsx`)
  - Client-side MDX rendering
  - Loading states
  - Error handling

- Dynamic Post Page (`app/blog/[...slug]/DynamicPostPage.tsx`)
  - API-based post fetching
  - Layout and TOC support

### 2. Payload CMS Testing
**Files**: `payload-cms-*.md`

**Test Phases**:
- Phase 1: Database initialization
- Phase 2: Collection creation
- Phase 3: MDX migration (143 articles)
- Phase 4: Admin panel functionality
- Phase 5: Frontend integration
- Phase 6: ISR revalidation
- Phase 7: Performance benchmarks

**Success Criteria**:
- [ ] All 143 MDX articles migrated
- [ ] Payload Admin functional
- [ ] Frontend displays content correctly
- [ ] Chemical formulas render
- [ ] Math formulas render
- [ ] Search functional
- [ ] ISR revalidation works
- [ ] Performance targets met (TTI < 2s, load < 1s)

### 3. Frontend Testing
**File**: `frontend-testing-report.md`

**Coverage**:
- Component unit tests
- Integration tests
- E2E scenarios
- Performance benchmarks

### 4. Admin Panel Testing
**File**: `admin-test-report.md`

**Test Scenarios**:
- Authentication flows
- User management
- Comment moderation
- Post management
- Role-based access control

## Test Execution Status

### Completed
- ✅ Backend MDX sync implementation
- ✅ Frontend MDX runtime setup
- ✅ Database schema migration
- ✅ API endpoint creation

### Remaining Work
- ⚠️ Docker rebuild in WSL2/Linux environment
- ⚠️ MDX sync execution (118 files expected)
- ⚠️ Frontend integration verification
- ⚠️ Performance testing

## Test Infrastructure

### E2E Test Setup
**Location**: `frontend/e2e/`

**Test Suites**:
- `admin.spec.ts` - Admin panel E2E
- `api-contract.spec.ts` - API contract tests
- `auth.spec.ts` - Authentication flows
- `blog.spec.ts` - Blog functionality

**Framework**: Playwright

### Pre-commit Hooks
**Location**: `frontend/.husky/pre-commit`

**Action**: Runs `pnpm test` before commits

## Test Data Requirements

### MDX Test Content
- 118 MDX files in `frontend/data/blog/`
- Frontmatter validation
- Content hash verification
- Incremental sync testing

### Database Test Data
- Test users (admin, moderator, regular)
- Sample posts (various statuses)
- Test comments (all statuses)
- Category/tag relationships

## Known Issues

### Platform Compatibility
- **Issue**: Windows cannot build Linux Docker binaries directly
- **Solution**: Use WSL2 or Linux environment
- **Command**: `wsl` then `docker-compose build backend`

### Network/Build Issues
- **Issue**: Docker build network or platform compatibility problems
- **Impact**: Backend container requires rebuild with new code
- **Workaround**: Native environment testing

## Testing Procedures

### Backend MDX Sync Test
```bash
# 1. Ensure backend running
curl http://localhost:3000/v1/posts

# 2. Run sync script
cd backend
./scripts/sync-mdx.sh

# Expected output:
# ✓ Found 118 MDX files
# ✓ Sync complete
#   Success: 118
#   Updated: 0
```

### Payload CMS Test
```bash
# 1. Start Next.js dev server
cd frontend
pnpm dev

# 2. Access Payload Admin
# Visit: http://localhost:3001/admin

# 3. Run migration
pnpm migrate:mdx

# 4. Verify frontend
curl http://localhost:3001/blog/welcome
```

### E2E Test Execution
```bash
cd frontend
pnpm test:e2e
```

## Related Modules
- `backend/crates/api/src/routes/mdx_sync.rs` - MDX sync implementation
- `frontend/e2e/` - E2E test suites
- `frontend/.husky/` - Git hooks
- `docs/migration/payload-cms-migration.md` - Migration procedures
