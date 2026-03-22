#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SPEC_FILES=(
  "backend/openapi/openapi.json"
  "frontend/openapi.json"
  "frontend/src/lib/types/openapi-generated.ts"
)

require_command() {
  local name="$1"
  if ! command -v "${name}" >/dev/null 2>&1; then
    echo "[ERROR] missing required command: ${name}" >&2
    exit 1
  fi
}

require_command cargo
require_command pnpm
require_command git

echo "[INFO] Exporting OpenAPI specification from backend sources"
(
  cd "${ROOT_DIR}/backend"
  cargo run --locked --bin export_openapi
)

echo "[INFO] Regenerating frontend API types"
(
  cd "${ROOT_DIR}/frontend"
  pnpm generate:api-types
)

if ! (
  cd "${ROOT_DIR}"
  git diff --quiet -- "${SPEC_FILES[@]}"
); then
  echo "[FAIL] API contract artifacts drifted from source code" >&2
  echo "[INFO] Regenerated files:" >&2
  (
    cd "${ROOT_DIR}"
    git --no-pager diff --stat -- "${SPEC_FILES[@]}"
  ) >&2 || true
  echo "[INFO] Run 'make generate-api' and commit the updated contract files." >&2
  exit 1
fi

echo "[OK] OpenAPI spec and generated frontend types are in sync"
