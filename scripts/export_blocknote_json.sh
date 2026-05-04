#!/usr/bin/env bash
# ==============================================================================
# export_blocknote_json.sh — Export articles as BlockNote JSON for editing/backup
#
# Usage:
#   ./scripts/export_blocknote_json.sh                    # Export all to ./exports/
#   ./scripts/export_blocknote_json.sh --slug my-post     # Single article
#   ./scripts/export_blocknote_json.sh --status published # Only published
#   ./scripts/export_blocknote_json.sh --dir ./my-backup  # Custom output dir
#
# Output: <slug>.blocknote.json files (BlockNote blocks array)
# ==============================================================================
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# ── Config ────────────────────────────────────────────────────────────────────
OUTPUT_DIR="./exports/blocknote_$(date +%Y%m%d_%H%M%S)"
SLUG=""
STATUS=""
FORMAT="json"  # json (BlockNote blocks) or mdx (markdown)

while [[ $# -gt 0 ]]; do
    case "$1" in
        --slug|-s)   SLUG="$2"; shift 2 ;;
        --status)    STATUS="$2"; shift 2 ;;
        --dir|-d)    OUTPUT_DIR="$2"; shift 2 ;;
        --mdx)       FORMAT="mdx"; shift ;;
        --help|-h)
            echo "Usage: $0 [--slug <slug>] [--status <status>] [--dir <output>] [--mdx]"
            echo ""
            echo "Exports articles as BlockNote JSON files."
            echo "  --slug <s>    Export single article"
            echo "  --status <s>  Filter by status (published/draft)"
            echo "  --dir <path>  Output directory"
            echo "  --mdx         Export as MDX format instead of JSON"
            exit 0
            ;;
        *) echo "Unknown flag: $1"; exit 1 ;;
    esac
done

mkdir -p "$OUTPUT_DIR"

# ── Check database ────────────────────────────────────────────────────────────
if ! docker ps --filter "name=blog-postgres" --format "{{.Names}}" | grep -q blog-postgres; then
    echo "❌ blog-postgres container not running"
    exit 1
fi

# ── Build query ───────────────────────────────────────────────────────────────
WHERE="WHERE content_json IS NOT NULL"
if [[ -n "$SLUG" ]]; then
    WHERE="$WHERE AND slug = '$SLUG'"
fi
if [[ -n "$STATUS" ]]; then
    WHERE="$WHERE AND status = '$STATUS'"
fi

echo "📦 Exporting articles to: $OUTPUT_DIR"
echo "   Filter: ${WHERE}"
echo ""

# ── Export ────────────────────────────────────────────────────────────────────
if [[ "$FORMAT" == "mdx" ]]; then
    # MDX format export (uses existing export script)
    echo "   Format: MDX"
    python3 scripts/export/export-all-posts.py "$OUTPUT_DIR"
else
    # BlockNote JSON format export
    docker exec blog-postgres psql -U blog_user -d blog_db -t -A \
        -c "SELECT json_agg(json_build_object('slug', slug, 'title', title, 'content_json', content_json::text, 'status', status)) FROM posts $WHERE;" \
        -o /tmp/blocknote_export.json
    docker cp blog-postgres:/tmp/blocknote_export.json /tmp/
    
    python3 -c "
import json, os

with open('/tmp/blocknote_export.json') as f:
    posts = json.load(f)

if not posts:
    print('No articles found matching criteria.')
    exit(0)

exported = 0
errors = 0

for post in posts:
    slug = post['slug']
    title = post.get('title', slug)
    cj_raw = post.get('content_json')
    
    if not cj_raw:
        print(f'  ⚠️  {slug}: empty content_json, skipping')
        errors += 1
        continue
    
    try:
        blocks = json.loads(cj_raw) if isinstance(cj_raw, str) else cj_raw
    except:
        print(f'  ❌ {slug}: invalid JSON, skipping')
        errors += 1
        continue
    
    # Write as pretty-printed BlockNote JSON
    filepath = os.path.join('$OUTPUT_DIR', f'{slug}.blocknote.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump({
            '_meta': {
                'slug': slug,
                'title': title,
                'status': post.get('status', 'unknown'),
                'block_count': len(blocks),
                'exported_at': '$(date -Iseconds)',
            },
            'blocks': blocks
        }, f, ensure_ascii=False, indent=2)
    
    exported += 1
    status_icon = '✅' if post.get('status') == 'published' else '📝'
    print(f'  {status_icon} {slug}.blocknote.json ({len(blocks)} blocks)')

print()
print(f'Done: {exported} exported, {errors} skipped → {os.path.abspath(\"$OUTPUT_DIR\")}')
"
fi

# ── Validate exports ──────────────────────────────────────────────────────────
echo ""
echo "🔍 Validating exports..."
python3 -c "
import json, os, sys
sys.path.insert(0, '$PROJECT_ROOT/scripts')
from validate_content_json import validate_blocknote_json

export_dir = '$OUTPUT_DIR'
files = sorted(f for f in os.listdir(export_dir) if f.endswith('.blocknote.json'))
all_errors = []

for f in files:
    with open(os.path.join(export_dir, f)) as fh:
        data = json.load(fh)
    blocks = data.get('blocks', data)  # Support both wrapped and raw format
    slug = data.get('_meta', {}).get('slug', f.replace('.blocknote.json', ''))
    all_errors.extend(validate_blocknote_json(blocks, slug))

if all_errors:
    print(f'❌ {len(all_errors)} validation errors in exported files:')
    for e in all_errors[:15]:
        print(f'   • {e}')
    print()
    print('   Exported files may have format issues. Check the source database.')
else:
    print(f'✅ All {len(files)} exported files valid')
"
