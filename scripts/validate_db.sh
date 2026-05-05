#!/usr/bin/env bash
# ==============================================================================
# validate_db.sh — BlockNote 0.49.0 Content JSON Validator (wrapper)
#
# Usage:
#   ./scripts/validate_db.sh              # Full validation (loud)
#   ./scripts/validate_db.sh --quiet      # Silent unless errors
#   ./scripts/validate_db.sh --json file  # Validate JSON file instead of DB
#
# Reads DB credentials from .env.local or defaults.
# ==============================================================================
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Load env
if [[ -f .env.local ]]; then
    source .env.local
fi

DB_USER="${POSTGRES_USER:-blog_user}"
DB_PASS="${POSTGRES_PASSWORD:-blog_password}"
DB_NAME="${POSTGRES_DB:-blog_db}"
DB_HOST="${POSTGRES_HOST:-127.0.0.1}"
DB_PORT="${POSTGRES_PORT:-5432}"

QUIET=""
JSON_FILE=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --quiet|-q) QUIET="--quiet"; shift ;;
        --json|-j) JSON_FILE="$2"; shift 2 ;;
        --help|-h)
            echo "Usage: $0 [--quiet] [--json <file.json>]"
            echo ""
            echo "Validates BlockNote 0.49.0 content_json format."
            echo "  --quiet    Silent unless errors found"
            echo "  --json     Validate a JSON file instead of database"
            exit 0
            ;;
        *) echo "Unknown flag: $1"; exit 1 ;;
    esac
done

if [[ -n "$JSON_FILE" ]]; then
    echo "🔍 Validating JSON file: $JSON_FILE"
    python3 scripts/validate_content_json.py --json-file "$JSON_FILE" $QUIET
else
    echo "🔍 Validating database content_json..."
    echo "   Host: $DB_HOST:$DB_PORT / $DB_NAME"
    
    # Export all posts to temp file, then validate from Python
    # (avoids psycopg2 dependency issues with different Docker/host setups)
    
    # Try direct connection first, fall back to docker exec
    if command -v psql &> /dev/null && PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &>/dev/null; then
        # Direct psql available
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -A \
            -c "SELECT json_agg(json_build_object('slug', slug, 'content_json', content_json::text)) FROM posts WHERE content_json IS NOT NULL;" \
            -o /tmp/all_posts_validate.json
    elif docker ps --filter "name=blog-postgres" --format "{{.Names}}" | grep -q blog-postgres; then
        # Use Docker
        docker exec blog-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -A \
            -c "SELECT json_agg(json_build_object('slug', slug, 'content_json', content_json::text)) FROM posts WHERE content_json IS NOT NULL;" \
            -o /tmp/all_posts_validate.json
        docker cp blog-postgres:/tmp/all_posts_validate.json /tmp/all_posts_validate.json 2>/dev/null || true
    else
        echo "❌ Cannot connect to database. Ensure blog-postgres is running or psql is available."
        exit 1
    fi
    
    # Validate
    python3 -c "
import json, sys
sys.path.insert(0, '$PROJECT_ROOT/scripts')
from validate_content_json import validate_blocknote_json

with open('/tmp/all_posts_validate.json') as f:
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
    print(f'\\n❌ Found {len(all_errors)} validation error(s):\\n')
    from collections import Counter
    for k, v in Counter(e.split(':')[-1].strip()[:70] for e in all_errors).most_common(15):
        print(f'  {v:>4}x  {k}')
    print()
    for err in all_errors[:20]:
        print(f'  • {err}')
    if len(all_errors) > 20:
        print(f'  ... and {len(all_errors) - 20} more')
    sys.exit(1)
else:
    print(f'\\n✅ All {len(posts)} articles validate cleanly against BlockNote 0.49.0 schema!')
"
fi
