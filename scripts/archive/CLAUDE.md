# Archive Scripts Directory

## Purpose
Historical and deprecated migration scripts preserved for reference and potential reuse.

## Directory Structure

```
scripts/archive/
├── migrate_mdx.py                # Python MDX migration script
├── migrate_mdx.sh                # Bash MDX migration script
└── migrate_mdx_crate/            # Rust migration crate (archived)
    └── src/
        └── CLAUDE.md             # Crate documentation
```

## Archived Scripts

### 1. MDX Migration Scripts

#### migrate_mdx.sh
**Purpose**: Migrate MDX files from filesystem to PostgreSQL database

**Functionality**:
- Scan `frontend/data/blog/` directory
- Parse MDX frontmatter (title, date, category, tags)
- Generate SQL INSERT statements
- Create test categories and tags
- Handle slug generation
- Validate database connections

**Environment Variables**:
```bash
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-blog_db}
DB_USER=${DB_USER:-blog_user}
DB_PASSWORD=${DB_PASSWORD:-blog_password}
```

**Usage**:
```bash
./scripts/archive/migrate_mdx.sh
```

**Workflow**:
1. Check PostgreSQL connection
2. Count MDX files (typically 118+ files)
3. Create temporary SQL file
4. Insert test categories (5 categories)
5. Insert test tags (4 tags)
6. Extract and process each MDX file
7. Execute SQL migration

#### migrate_mdx.py
**Purpose**: Python alternative for MDX migration

**Status**: Alternative implementation to bash script

### 2. Rust Migration Crate
**Location**: `migrate_mdx_crate/`

**Purpose**: Rust-based migration tool (archived implementation)

**Contents**:
- Source code for Rust migration utility
- Documentation (CLAUDE.md)

## Migration Strategy Evolution

### Current Implementation
**Active**: `backend/crates/api/src/routes/mdx_sync.rs`
- MDX sync API endpoint
- Content hash-based change detection
- Incremental updates
- Redis cache integration
- Triggered via `backend/scripts/sync-mdx.sh`

### Archived Implementation
**Archived**: Scripts in this directory
- One-time migration approach
- Manual SQL generation
- No change detection
- Superseded by API-based sync

## Why Archived?

### Limitations of Original Scripts
1. **One-time execution**: No incremental updates
2. **No validation**: Limited error checking
3. **Manual intervention**: Required direct SQL execution
4. **No rollback**: Difficult to undo changes
5. **Platform-specific**: Bash/Python dependencies

### Replacement Advantages
1. **API-based integration**: RESTful endpoint
2. **Change detection**: SHA256 content hashing
3. **Incremental sync**: Only process changed files
4. **Cache management**: Redis integration
5. **Better error handling**: Structured error responses

## Reference Usage

### Understanding Original Approach
Review these scripts to understand:
- Initial migration requirements
- Data transformation logic
- Frontmatter parsing patterns
- Database schema assumptions

### Reuse Scenarios
Consider these scripts for:
- **Database reset**: Fresh migration from scratch
- **Testing**: Isolated test environment setup
- **Documentation**: Understanding migration history
- **Rollback**: Reverting to original content structure

## Running Archived Scripts

### Prerequisites
```bash
# PostgreSQL must be running
docker ps | grep blog-postgres

# Database must exist
PGPASSWORD=blog_password psql -h localhost -U blog_user -d blog_db -c '\dt'
```

### Execution
```bash
cd scripts/archive
chmod +x migrate_mdx.sh
./migrate_mdx.sh
```

### Expected Output
```
================================
MDX 文件迁移脚本
================================

1. 检查数据库连接...
✓ 数据库连接正常

2. 统计 MDX 文件...
找到 118 个 MDX 文件

3. 生成迁移 SQL...
处理: frontend/data/blog/chemistry/xxx.mdx
处理: frontend/data/blog/cs/yyy.mdx
...
```

## Migration Data Schema

### Categories Created
```sql
INSERT INTO categories (slug, name, description) VALUES
('computer-science', 'Computer Science', 'AI, algorithms, programming'),
('robotics', 'Robotics', 'ROS, control systems, automation'),
('mathematics', 'Mathematics', 'Linear algebra, calculus, theory'),
('chemistry', 'Chemistry', 'Molecular visualization, structures'),
('tactile-sensing', 'Tactile Sensing', 'Research papers, experiments')
```

### Tags Created
```sql
INSERT INTO tags (slug, name, description) VALUES
('nextjs', 'Next.js', 'Next.js framework'),
('rust', 'Rust', 'Rust programming language'),
('tutorial', 'Tutorial', 'Tutorial articles'),
('research', 'Research', 'Research papers')
```

## Maintenance

### When to Update Archive
- Before deleting, ensure active replacement is fully functional
- Document reason for archiving in this CLAUDE.md
- Keep for at least 6 months after replacement
- Mark with deprecation date if applicable

### Cleanup Policy
- **6 months**: Safe to remove after confirmed stability
- **1 year**: Remove unless referenced in documentation
- **Major version**: Archive before breaking changes

## Related Modules
- `backend/crates/api/src/routes/mdx_sync.rs` - Active MDX sync API
- `backend/scripts/sync-mdx.sh` - Active sync script
- `docs/migration/payload-cms-migration.md` - Payload CMS migration
- `frontend/data/blog/` - Source MDX files
