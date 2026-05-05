#!/usr/bin/env bash
# ==============================================================================
# import_mdx.sh — MDX → BlockNote JSON → Database (with validation gates)
#
# Usage:
#   ./scripts/import_mdx.sh                          # Import all MDX from content/posts/
#   ./scripts/import_mdx.sh --dir /path/to/mdx       # Import from custom directory
#   ./scripts/import_mdx.sh --dry-run                # Convert and validate only, no DB write
#   ./scripts/import_mdx.sh --single article.mdx     # Import a single file
#
# Gate 1: Converter runs without errors
# Gate 2: ALL generated JSON validates against BlockNote 0.49.0 schema
# Gate 3: (if not --dry-run) DB validate after writing
# ==============================================================================
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────
MDX_DIR="content/posts"
SINGLE_FILE=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dir)   MDX_DIR="$2"; shift 2 ;;
        --single|-s) SINGLE_FILE="$2"; shift 2 ;;
        --dry-run|-n) DRY_RUN=true; shift ;;
        --help|-h)
            echo "Usage: $0 [--dir <path>] [--single <file.mdx>] [--dry-run]"
            echo ""
            echo "Imports MDX files as BlockNote JSON into the database."
            echo "With validation gates at every step."
            echo ""
            echo "  --dir <path>    MDX source directory (default: content/posts/)"
            echo "  --single <file> Import a single MDX file"
            echo "  --dry-run       Convert + validate only, don't write to DB"
            exit 0
            ;;
        *) echo "Unknown flag: $1"; exit 1 ;;
    esac
done

# ─────────────────────────────────────────────────────────────────────────────
# Gate 0: Check prerequisites
# ─────────────────────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════"
echo "  MDX → BlockNote JSON Import Pipeline"
echo "═══════════════════════════════════════════════════════"
echo ""

if ! $DRY_RUN && ! docker ps --filter "name=blog-postgres" --format "{{.Names}}" | grep -q blog-postgres; then
    echo "❌ blog-postgres container not running. Start it first."
    exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Prepare MDX export JSON
# ─────────────────────────────────────────────────────────────────────────────
echo "📦 Step 1: Preparing MDX input..."

if [[ -n "$SINGLE_FILE" ]]; then
    # Single file import
    if [[ ! -f "$SINGLE_FILE" ]]; then
        echo "❌ File not found: $SINGLE_FILE"
        exit 1
    fi
    SLUG=$(basename "$SINGLE_FILE" .mdx)
    python3 -c "
import json
with open('$SINGLE_FILE') as f:
    content = f.read()
parts = content.split('---', 2)
body = parts[2] if len(parts) > 2 else content
posts = [{'slug': '$SLUG', 'content_mdx': body.strip(), 'id': '$SLUG'}]
with open('/tmp/mdx_import.json', 'w') as f:
    json.dump(posts, f, ensure_ascii=False)
print(f'Prepared 1 post: $SLUG')
"
else
    # Directory import
    python3 -c "
import json, os
mdx_dir = '$MDX_DIR'
if not os.path.isdir(mdx_dir):
    print(f'❌ Directory not found: {mdx_dir}')
    exit(1)
files = sorted(f for f in os.listdir(mdx_dir) if f.endswith('.mdx'))
posts = []
for f in files:
    slug = f.replace('.mdx', '')
    with open(os.path.join(mdx_dir, f)) as fh:
        content = fh.read()
    parts = content.split('---', 2)
    body = parts[2] if len(parts) > 2 else content
    posts.append({'slug': slug, 'content_mdx': body.strip(), 'id': slug})
with open('/tmp/mdx_import.json', 'w') as f:
    json.dump(posts, f, ensure_ascii=False)
print(f'Prepared {len(posts)} posts from {mdx_dir}')
"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Convert MDX → BlockNote JSON
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🔄 Step 2: Converting MDX → BlockNote JSON..."

python3 frontend/scripts/rebuild_content_json.py
# Expects /tmp/posts_mdx_export.json as input
# Writes /tmp/content_json_rebuilt.json and /tmp/update_content_json.sql

# ─────────────────────────────────────────────────────────────────────────────
# Gate 1: Validate generated JSON (BEFORE touching database)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🔍 Gate 1: Validating generated JSON..."

VALIDATION_FAILED=false
python3 -c "
import json, sys
sys.path.insert(0, '$PROJECT_ROOT/scripts')
from validate_content_json import validate_blocknote_json
from collections import Counter

with open('/tmp/content_json_rebuilt.json') as f:
    data = json.load(f)

all_errors = []
for post_id, cj_str in data.items():
    try:
        blocks = json.loads(cj_str) if isinstance(cj_str, str) else cj_str
    except:
        all_errors.append(f'[{post_id}] Invalid JSON string')
        continue
    all_errors.extend(validate_blocknote_json(blocks, str(post_id)[:50]))

if all_errors:
    print(f'\\n❌ GATE 1 FAILED: {len(all_errors)} validation errors in generated JSON')
    print(f'   These errors would corrupt the database if imported.')
    print()
    
    # Error breakdown
    error_types = Counter()
    for e in all_errors:
        key = e.split(':')[-1].strip()[:80]
        error_types[key] += 1
    
    print('   Error type breakdown:')
    for k, v in error_types.most_common(10):
        print(f'     {v:>4}x  {k}')
    
    print()
    print('   First 10 errors:')
    for e in all_errors[:10]:
        print(f'     • {e}')
    
    print()
    print('   DO NOT PROCEED. Fix the converter (rebuild_content_json.py) and retry.')
    sys.exit(1)
else:
    print(f'   ✅ All {len(data)} posts pass validation')
"

if $VALIDATION_FAILED; then
    exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Apply to database
# ─────────────────────────────────────────────────────────────────────────────
if $DRY_RUN; then
    echo ""
    echo "🏁 --dry-run mode: Skipping database write."
    echo "   Generated files:"
    echo "     /tmp/content_json_rebuilt.json"
    echo "     /tmp/update_content_json.sql"
    echo ""
    echo "   Run without --dry-run to apply to database."
    exit 0
fi

echo ""
echo "💾 Step 3: Applying to database..."

docker cp /tmp/update_content_json.sql blog-postgres:/tmp/
docker exec blog-postgres psql -U blog_user -d blog_db -f /tmp/update_content_json.sql > /dev/null

echo "   ✅ SQL applied"

# ─────────────────────────────────────────────────────────────────────────────
# Gate 2: Validate database after write
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🔍 Gate 2: Validating database after import..."

python3 -c "
import json, sys
sys.path.insert(0, '$PROJECT_ROOT/scripts')
from validate_content_json import validate_blocknote_json

# Export from DB
import subprocess
subprocess.run(['docker', 'exec', 'blog-postgres', 'psql', '-U', 'blog_user', '-d', 'blog_db', '-t', '-A',
    '-c', 'SELECT json_agg(json_build_object(\"slug\", slug, \"content_json\", content_json::text)) FROM posts WHERE content_json IS NOT NULL;',
    '-o', '/tmp/all_posts_check.json'], check=True)
subprocess.run(['docker', 'cp', 'blog-postgres:/tmp/all_posts_check.json', '/tmp/all_posts_check.json'], check=True)

with open('/tmp/all_posts_check.json') as f:
    posts = json.load(f)

all_errors = []
for post in posts:
    slug = post['slug']
    raw = post['content_json']
    try:
        content = json.loads(raw) if isinstance(raw, str) else raw
    except:
        all_errors.append(f'[{slug}] Invalid JSON')
        continue
    all_errors.extend(validate_blocknote_json(content, slug))

if all_errors:
    print(f'❌ GATE 2 FAILED: {len(all_errors)} errors in database after import')
    for e in all_errors[:10]:
        print(f'   • {e}')
    print()
    print('   Something went wrong during import. Restore from backup if needed.')
    sys.exit(1)
else:
    print(f'   ✅ Database clean — all {len(posts)} articles valid')
"

# ─────────────────────────────────────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ Import pipeline complete"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Next: docker compose -f docker-compose.local.yml restart frontend"
