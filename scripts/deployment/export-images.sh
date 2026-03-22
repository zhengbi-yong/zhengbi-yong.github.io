#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EXPORT_DIR="${ROOT_DIR}/exports"
DOCKER_CMD="${DOCKER_CMD:-docker}"

mkdir -p "${EXPORT_DIR}"

eval "$(
  bash "${ROOT_DIR}/scripts/release/oci-metadata.sh" \
    --repository "local/$(basename "${ROOT_DIR}")"
)"

backend_source="blog-backend:${app_version}"
frontend_source="blog-frontend:${app_version}"

if ! "${DOCKER_CMD}" image inspect "${backend_source}" >/dev/null 2>&1; then
  backend_source="blog-backend:local"
fi
if ! "${DOCKER_CMD}" image inspect "${frontend_source}" >/dev/null 2>&1; then
  frontend_source="blog-frontend:local"
fi

backend_export="${EXPORT_DIR}/blog-backend-${app_version}.tar"
frontend_export="${EXPORT_DIR}/blog-frontend-${app_version}.tar"

echo "[WARN] scripts/deployment/export-images.sh is a compatibility export path."
echo "[INFO] Exporting ${backend_source} -> ${backend_export}"
"${DOCKER_CMD}" save "${backend_source}" -o "${backend_export}"

echo "[INFO] Exporting ${frontend_source} -> ${frontend_export}"
"${DOCKER_CMD}" save "${frontend_source}" -o "${frontend_export}"

echo "[OK] Export completed"
ls -lh "${EXPORT_DIR}"
