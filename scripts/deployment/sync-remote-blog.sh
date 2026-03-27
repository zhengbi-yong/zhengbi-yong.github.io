#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DEFAULT_TARGET="ubuntu@152.136.43.194"
DEFAULT_REMOTE_DIR="/home/ubuntu/blog-platform-live"
DEFAULT_IDENTITY_FILE="$HOME/.ssh/zhengbi_prod_ed25519"

TARGET="${TARGET:-$DEFAULT_TARGET}"
REMOTE_DIR="${REMOTE_DIR:-$DEFAULT_REMOTE_DIR}"
IDENTITY_FILE="${IDENTITY_FILE:-$DEFAULT_IDENTITY_FILE}"
FORCE_SYNC="${FORCE_SYNC:-false}"

SSH_OPTS=(
  -i "$IDENTITY_FILE"
  -o StrictHostKeyChecking=no
  -o ConnectTimeout=10
)

usage() {
  cat <<'EOF'
Usage: bash scripts/deployment/sync-remote-blog.sh [options]

Sync blog content from frontend/data/blog to remote production server.

Options:
  --target USER@HOST        Target server (default: ubuntu@152.136.43.194)
  --remote-dir PATH         Remote deployment directory (default: /home/ubuntu/blog-platform-live)
  --identity-file PATH      SSH identity file (default: ~/.ssh/zhengbi_prod_ed25519)
  --force                   Force sync even if posts exist

Environment Variables:
  TARGET                    Same as --target
  REMOTE_DIR                Same as --remote-dir
  IDENTITY_FILE             Same as --identity-file
  FORCE_SYNC                Same as --force

Example:
  # Basic sync
  bash scripts/deployment/sync-remote-blog.sh

  # Force sync to overwrite existing posts
  bash scripts/deployment/sync-remote-blog.sh --force

  # Custom target
  bash scripts/deployment/sync-remote-blog.sh --target user@example.com --remote-dir /var/www/blog
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="$2"
      shift 2
      ;;
    --remote-dir)
      REMOTE_DIR="$2"
      shift 2
      ;;
    --identity-file)
      IDENTITY_FILE="$2"
      shift 2
      ;;
    --force)
      FORCE_SYNC=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[ERROR] Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ! -d "${PROJECT_ROOT}/frontend/data/blog" ]]; then
  echo "[ERROR] Blog directory not found: ${PROJECT_ROOT}/frontend/data/blog" >&2
  exit 1
fi

echo "[INFO] Syncing blog content to ${TARGET}..."
echo "[INFO] Remote directory: ${REMOTE_DIR}"
echo "[INFO] Force sync: ${FORCE_SYNC}"

CONTAINER_NAME="$REMOTE_DIR/current | grep -oP '(?<=project_name=)[^[:space:]]+' | head -1 || echo 'blog-platform-live')"
API_CONTAINER="${CONTAINER_NAME}-api-1"

ssh "${SSH_OPTS[@]}" "$TARGET" bash -s <<EOF
set -euo pipefail

echo "[INFO] Checking existing posts..."
EXISTING_COUNT=\$(docker exec "\$(${REMOTE_DIR}/current/docker-compose.production.yml ps -q api 2>/dev/null | head -1 | xargs docker inspect --format='{{.Name}}' | sed 's/^///')" 2>/dev/null || echo "blog-platform-live-api-1")
EXISTING_COUNT=\$(docker exec "\${API_CONTAINER}" curl -s http://localhost:3000/api/v1/posts | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('total', 0))" 2>/dev/null || echo "0")

if [[ "$FORCE_SYNC" != "true" && "\$EXISTING_COUNT" -gt 0 ]]; then
  echo "[INFO] Database already has \$EXISTING_COUNT post(s). Use --force to overwrite."
  exit 0
fi

echo "[INFO] Creating temporary blog directory in container..."
docker exec "\${API_CONTAINER}" mkdir -p /tmp/blog-import

echo "[INFO] Copying blog files to container..."
# We'll use docker cp from the remote host after transferring files
EOF

TEMP_BLOG_DIR="/tmp/blog-sync-$$"
mkdir -p "$TEMP_BLOG_DIR"
cp -r "${PROJECT_ROOT}/frontend/data/blog" "$TEMP_BLOG_DIR/"

echo "[INFO] Transferring blog files to remote host..."
scp "${SSH_OPTS[@]}" -r "$TEMP_BLOG_DIR/blog" "$TARGET:/tmp/blog-sync/"

ssh "${SSH_OPTS[@]}" "$TARGET" bash -s <<EOF
set -euo pipefail

echo "[INFO] Copying blog files into API container..."
docker cp /tmp/blog-sync/blog "\$(docker ps --filter "name=blog-platform-live-api" --format "{{.Names}}" | head -1):/app/data/"

echo "[INFO] Setting FRONTEND_BLOG_DIR environment..."
docker exec "\$(docker ps --filter "name=blog-platform-live-api" --format "{{.Names}}" | head -1)" sh -c 'export FRONTEND_BLOG_DIR=/app/data && echo "\$FRONTEND_BLOG_DIR"'

echo "[INFO] Triggering MDX sync..."
SYNC_RESPONSE=\$(docker exec "\$(docker ps --filter "name=blog-platform-live-api" --format "{{.Names}}" | head -1)" \
  curl -s -X POST http://localhost:3000/api/v1/sync/mdx/public \
  -H "Content-Type: application/json" \
  -d '{"force": $FORCE_SYNC}')

echo "\$SYNC_RESPONSE" | python3 -m json.tool || echo "\$SYNC_RESPONSE"

echo "[INFO] Cleaning up temporary files..."
rm -rf /tmp/blog-sync
docker exec "\$(docker ps --filter "name=blog-platform-live-api" --format "{{.Names}}" | head -1)" rm -rf /tmp/blog-import

echo "[INFO] Verifying sync..."
NEW_COUNT=\$(docker exec "\$(docker ps --filter "name=blog-platform-live-api" --format "{{.Names}}" | head -1)" \
  curl -s http://localhost:3000/api/v1/posts | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('total', 0))" 2>/dev/null || echo "0")

echo "[INFO] Database now has \$NEW_COUNT post(s)"
EOF

rm -rf "$TEMP_BLOG_DIR"

echo "[SUCCESS] Blog content sync completed!"
