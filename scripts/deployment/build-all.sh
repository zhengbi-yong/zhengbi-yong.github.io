#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCKER_CMD="${DOCKER_CMD:-docker}"

if ! command -v "${DOCKER_CMD}" >/dev/null 2>&1; then
  echo "[ERROR] docker is required" >&2
  exit 1
fi

eval "$(
  bash "${ROOT_DIR}/scripts/release/oci-metadata.sh" \
    --repository "local/$(basename "${ROOT_DIR}")"
)"

echo "[WARN] scripts/deployment/build-all.sh is a compatibility wrapper."
echo "[INFO] Building canonical production images with APP_VERSION=${app_version}"

"${DOCKER_CMD}" build \
  --build-arg APP_VERSION="${app_version}" \
  --build-arg VCS_REF="${vcs_ref}" \
  --build-arg BUILD_DATE="${build_date}" \
  -t blog-backend:local \
  -t "blog-backend:${app_version}" \
  -f "${ROOT_DIR}/backend/Dockerfile" \
  "${ROOT_DIR}/backend"

"${DOCKER_CMD}" build \
  --build-arg APP_VERSION="${app_version}" \
  --build-arg VCS_REF="${vcs_ref}" \
  --build-arg BUILD_DATE="${build_date}" \
  --build-arg NEXT_IGNORE_BUILD_ERRORS="${NEXT_IGNORE_BUILD_ERRORS:-0}" \
  --build-arg NEXT_IGNORE_ESLINT="${NEXT_IGNORE_ESLINT:-0}" \
  -t blog-frontend:local \
  -t "blog-frontend:${app_version}" \
  -f "${ROOT_DIR}/frontend/Dockerfile" \
  "${ROOT_DIR}/frontend"

echo "[OK] Built blog-backend:{local,${app_version}}"
echo "[OK] Built blog-frontend:{local,${app_version}}"
echo "[INFO] Next steps:"
echo "  bash scripts/deployment/push-images.sh <registry-prefix>"
echo "  bash scripts/deployment/export-images.sh"
