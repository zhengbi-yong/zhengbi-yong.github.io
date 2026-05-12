#!/usr/bin/env bash
# ==============================================================================
# import_mdx.sh — MDX → BlockNote JSON (SSOT) → Database
#
# NEW SSOT ARCHITECTURE:
#   1. MDX file → rebuild_content_json.py → content_json (BlockNote JSON)
#   2. content_json → rebuild_content_mdx.py → content_mdx (MDX for rendering)
#   3. Both written to database: content_json = SSOT, content_mdx = derived
#   4. content column synced from content_mdx
#
# Usage:
#   ./scripts/import_mdx.sh                          # Import all MDX from frontend/data/blog/
#   ./scripts/import_mdx.sh --single article.mdx     # Import a single file
#   ./scripts/import_mdx.sh --dry-run                # Convert only, no DB write
# ==============================================================================
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────
MDX_DIR="frontend/data/blog"
SINGLE_FILE=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --single|-s) SINGLE_FILE="$2"; shift 2 ;;
        --dry-run|-n) DRY_RUN=true; shift ;;
        --help|-h)
            echo "Usage: $0 [--single <file.mdx>] [--dry-run]"
            echo ""
            echo "SSOT Architecture: MDX → content_json (BlockNote JSON, SSOT) → content_mdx (auto-derived)"
            echo ""
            echo "  --single <file>  Import a single MDX file"
            echo "  --dry-run        Convert only, don't write to DB"
            exit 0
            ;;
        *) echo "Unknown flag: $1"; exit 1 ;;
    esac
done

echo "═══════════════════════════════════════════════════════"
echo "  MDX → content_json (SSOT) Import Pipeline"
echo "═══════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Prepare MDX export JSON
# ─────────────────────────────────────────────────────────────────────────────
echo "📦 Step 1: Preparing MDX input..."

if [[ -n "$SINGLE_FILE" ]]; then
    if [[ ! -f "$SINGLE_FILE" ]]; then
        echo "❌ File not found: $SINGLE_FILE"
        exit 1
    fi
    python3 -c "
import json, os
filepath = '$SINGLE_FILE'
# Derive slug from path relative to MDX_DIR
rel = os.path.relpath(filepath, '$MDX_DIR')
slug = os.path.splitext(rel)[0]
with open(filepath) as f:
    content = f.read()
parts = content.split('---', 2)
body = parts[2].strip() if len(parts) >= 3 else content
posts = [{'slug': slug, 'content_mdx': body, 'id': slug}]
with open('/tmp/mdx_export.json', 'w') as f:
    json.dump(posts, f, ensure_ascii=False)
print(f'Prepared 1 post: {slug}')
"
else
    python3 -c "
import json, os
mdx_dir = '$MDX_DIR'
posts = []
for root, dirs, files in os.walk(mdx_dir):
    for f in sorted(files):
        if not f.endswith('.mdx'):
            continue
        filepath = os.path.join(root, f)
        rel = os.path.relpath(filepath, mdx_dir)
        slug = os.path.splitext(rel)[0]
        with open(filepath) as fh:
            content = fh.read()
        parts = content.split('---', 2)
        body = parts[2].strip() if len(parts) >= 3 else content
        posts.append({'slug': slug, 'content_mdx': body, 'id': slug})
with open('/tmp/mdx_export.json', 'w') as f:
    json.dump(posts, f, ensure_ascii=False)
print(f'Prepared {len(posts)} posts from {mdx_dir}')
"
fi

# Copy to the filename the converter expects
cp /tmp/mdx_export.json /tmp/posts_mdx_export.json

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: MDX → content_json (BlockNote JSON, the SSOT)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🔄 Step 2: Converting MDX → content_json (BlockNote JSON)..."
python3 frontend/scripts/rebuild_content_json.py

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: content_json → content_mdx (reverse, for rendering)
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🔄 Step 3: Generating content_mdx from content_json..."
python3 -c "
import json, subprocess, sys
sys.path.insert(0, 'frontend/scripts')
from rebuild_content_mdx import parse_blocks_to_mdx

with open('/tmp/content_json_rebuilt.json') as f:
    data = json.load(f)

output = {}
for post_id, blocks_json in data.items():
    blocks = json.loads(blocks_json) if isinstance(blocks_json, str) else blocks_json
    mdx = parse_blocks_to_mdx(blocks)
    output[post_id] = mdx

with open('/tmp/content_mdx_rebuilt.json', 'w') as f:
    json.dump(output, f, ensure_ascii=False)
print(f'Generated content_mdx for {len(output)} posts')
"

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Generate SQL
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "💾 Step 4: Generating SQL..."

python3 -c "
import json

with open('/tmp/content_json_rebuilt.json') as f:
    cj = json.load(f)
with open('/tmp/content_mdx_rebuilt.json') as f:
    cm = json.load(f)

lines = ['BEGIN;']
for post_id in cj:
    content_json = cj[post_id]
    content_mdx = cm.get(post_id, '')
    
    escaped_cj = content_json.replace(\"'\", \"''\")
    escaped_cm = content_mdx.replace(\"'\", \"''\")
    
    # content_json = SSOT
    # content_mdx = auto-derived
    # content = synced from content_mdx
    lines.append(f\"UPDATE posts SET content_json = '{escaped_cj}', content_mdx = '{escaped_cm}', content = '{escaped_cm}' WHERE slug = '{post_id}';\")
lines.append('COMMIT;')

sql = '\n'.join(lines)
with open('/tmp/import_sql.sql', 'w') as f:
    f.write(sql)
print(f'SQL generated ({len(sql)} bytes, {len(cj)} posts)')
"

if $DRY_RUN; then
    echo ""
    echo "🏁 --dry-run mode: Skipping database write."
    echo "   Generated files:"
    echo "     /tmp/content_json_rebuilt.json"
    echo "     /tmp/content_mdx_rebuilt.json"
    echo "     /tmp/import_sql.sql"
    exit 0
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 5: Apply to database
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "💾 Step 5: Applying to database..."

docker cp /tmp/import_sql.sql blog-postgres:/tmp/
docker exec blog-postgres psql -U blog_user -d blog_db -f /tmp/import_sql.sql > /dev/null

echo "   ✅ Import complete"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ SSOT Import pipeline complete"
echo "     content_json = BlockNote JSON (SSOT)"
echo "     content_mdx  = auto-generated from content_json"
echo "     content      = synced from content_mdx"
echo "═══════════════════════════════════════════════════════"
