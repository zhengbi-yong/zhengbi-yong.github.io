# Operations Documentation

## Purpose
Procedures for system maintenance, troubleshooting, and operational workflows.

## Directory Structure

```
docs/operations/
├── restart-guide.md            # Complete restart and testing procedures
├── RESTRUCTURE_GUIDE.md        # Codebase restructuring guide
└── TROUBLESHOOTING.md          # Common issues and solutions
```

## Content Scope

### Operational Procedures
1. **System Restart**
   - Backend process management (Task Manager/PowerShell/Cygwin)
   - Database verification
   - Port conflict resolution
   - Service startup order

2. **Code Fixes Applied**
   - MDX sync status field type conversion
   - ToSchema trait implementation
   - SQL column name conflict resolution

3. **Verification Steps**
   - Backend health checks
   - MDX synchronization testing
   - Article count validation
   - Frontend access verification
   - Admin panel functionality

## Key Information

### Restart Methods
**Method A - Task Manager**:
- Ctrl+Shift+Esc → Details tab → End api.exe process

**Method B - PowerShell**:
```powershell
Stop-Process -Id 26576 -Force
```

**Method C - Cygwin/bash**:
```bash
/usr/bin/kill -f 26576
```

### Fixed Issues

#### 1. MDX Sync Status Type Error
**File**: `backend/crates/api/src/routes/mdx_sync.rs:245-253`
```rust
// Before: Direct binding caused type mismatch
.bind(if frontmatter.draft { "draft" } else { "published" })

// After: Explicit type conversion in SQL
let status_str = if frontmatter.draft { "draft" } else { "published" };
// ... uses $6::post_status for type casting
```

#### 2. ToSchema Trait Missing
**File**: `backend/crates/shared/src/api_response.rs`
- Added `ToSchema` trait to: `ApiResponse<T>`, `PaginatedResponse<T>`, `ResourceResponse<T>`

#### 3. SQL Column Conflict
**File**: `backend/crates/api/src/routes/posts.rs:897`
```sql
c.name as category_name, c.slug as category_slug
-- Prevents duplicate 'slug' column error
```

## Verification Checklist

### Backend Health
```bash
curl http://localhost:3000/health
# Expected: {"status":"healthy","timestamp":"...","version":"0.1.0"}
```

### MDX Sync Test
```bash
# Sync should report:
# {
#   "total": 133,
#   "created": 133,
#   "updated": 0,
#   "failed": 0
# }
```

### Article Count
```bash
docker exec blog-postgres psql -U blog_user -d blog_db -c "SELECT COUNT(*) FROM posts;"
# Expected: 133+ articles
```

## Expected Results

### Article Data
- ✅ 133 MDX articles synchronized to database
- ✅ All articles in "Published" status
- ✅ Complete frontmatter data preserved

### Comment Data
- ✅ Minimum 2 test comments per article
- ✅ All comments in "approved" status

### Frontend Functionality
- ✅ Homepage displays article list
- ✅ Article detail pages load without 404
- ✅ Approved comments visible
- ✅ Admin panel accessible

## Troubleshooting

### Issue: Backend Start Failure
**Symptom**: `cargo run --bin api` errors

**Diagnosis**:
```bash
netstat -ano | grep ":3000"
```

**Resolution**: Terminate conflicting process

### Issue: MDX Sync Fails
**Symptom**: `failed: 133` in sync results

**Common Causes**:
- PostgreSQL connection issues
- Incorrect file paths
- Permission problems

### Issue: Article 404 Errors
**Symptom**: Clicking article shows 404

**Diagnosis Steps**:
1. Verify slug correctness
2. Test API: `curl http://localhost:3000/v1/posts/{slug}`
3. Check backend logs

## Related Modules
- `docs/guides/admin-panel.md` - Admin panel usage
- `docs/migration/` - Migration procedures
- `backend/crates/api/src/routes/` - API route implementations
- `scripts/deployment/` - Deployment automation
