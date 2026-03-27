#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCKER_CMD="${DOCKER_CMD:-docker}"
export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}"
BACKEND_SQLX_OFFLINE="${BACKEND_SQLX_OFFLINE:-false}"
BACKEND_DATABASE_URL="${BACKEND_DATABASE_URL:-postgresql://blog_user:blog_password@host.docker.internal:5432/blog_db}"
BACKEND_DOCKER_TARGET="${BACKEND_DOCKER_TARGET:-local-runtime}"
BACKEND_DEBIAN_APT_FORCE_HTTPS="${BACKEND_DEBIAN_APT_FORCE_HTTPS:-false}"
FRONTEND_DOCKER_TARGET="${FRONTEND_DOCKER_TARGET:-}"
BACKEND_SWAGGER_UI_CACHE_PATH="${ROOT_DIR}/backend/swagger-ui-cache/v5.17.14.zip"

if [[ -z "${BACKEND_SWAGGER_UI_DOWNLOAD_URL:-}" ]]; then
  if [[ -f "${BACKEND_SWAGGER_UI_CACHE_PATH}" ]]; then
    BACKEND_SWAGGER_UI_DOWNLOAD_URL="file:///app/swagger-ui-cache/v5.17.14.zip"
  else
    BACKEND_SWAGGER_UI_DOWNLOAD_URL=""
  fi
fi

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

backend_build_args=(
  build
  --build-arg APP_VERSION="${app_version}"
  --build-arg VCS_REF="${vcs_ref}"
  --build-arg BUILD_DATE="${build_date}"
  --build-arg SQLX_OFFLINE="${BACKEND_SQLX_OFFLINE}"
  --build-arg DATABASE_URL="${BACKEND_DATABASE_URL}"
  --build-arg DEBIAN_APT_FORCE_HTTPS="${BACKEND_DEBIAN_APT_FORCE_HTTPS}"
)

if [[ -n "${BACKEND_SWAGGER_UI_DOWNLOAD_URL}" ]]; then
  backend_build_args+=(
    --build-arg SWAGGER_UI_DOWNLOAD_URL="${BACKEND_SWAGGER_UI_DOWNLOAD_URL}"
  )
  echo "[INFO] Backend Swagger UI cache source: ${BACKEND_SWAGGER_UI_DOWNLOAD_URL}"
else
  echo "[INFO] Backend Swagger UI cache source: crate default download behavior"
fi

backend_build_args+=(
  --target "${BACKEND_DOCKER_TARGET}"
  -t blog-backend:local
  -t "blog-backend:${app_version}"
  -f "${ROOT_DIR}/backend/Dockerfile"
  "${ROOT_DIR}/backend"
)

if [[ -z "${FRONTEND_DOCKER_TARGET}" ]]; then
  if [[ -f "${ROOT_DIR}/frontend/.next/standalone/server.js" && -d "${ROOT_DIR}/frontend/.next/static" && -d "${ROOT_DIR}/frontend/.contentlayer" ]]; then
    FRONTEND_DOCKER_TARGET="prebuilt-runner"
  else
    FRONTEND_DOCKER_TARGET="runner"
  fi
fi

echo "[INFO] Backend Docker target: ${BACKEND_DOCKER_TARGET}"
echo "[INFO] Backend apt source https rewrite: ${BACKEND_DEBIAN_APT_FORCE_HTTPS}"
echo "[INFO] Frontend Docker target: ${FRONTEND_DOCKER_TARGET}"

"${DOCKER_CMD}" "${backend_build_args[@]}"

if [[ "${FRONTEND_DOCKER_TARGET}" == "prebuilt-runner" ]]; then
  echo "[INFO] Verifying host-built frontend runtime artifacts"

  for required_path in \
    "${ROOT_DIR}/frontend/.next/standalone/server.js" \
    "${ROOT_DIR}/frontend/.next/static" \
    "${ROOT_DIR}/frontend/.contentlayer"; do
    if [[ ! -e "${required_path}" ]]; then
      echo "[ERROR] Missing required frontend runtime artifact: ${required_path}" >&2
      echo "[ERROR] Run 'pnpm build' in ${ROOT_DIR}/frontend before using FRONTEND_DOCKER_TARGET=prebuilt-runner" >&2
      exit 1
    fi
  done
fi

"${DOCKER_CMD}" build \
  --build-arg APP_VERSION="${app_version}" \
  --build-arg VCS_REF="${vcs_ref}" \
  --build-arg BUILD_DATE="${build_date}" \
  --build-arg NEXT_IGNORE_BUILD_ERRORS="${NEXT_IGNORE_BUILD_ERRORS:-0}" \
  --build-arg NEXT_IGNORE_ESLINT="${NEXT_IGNORE_ESLINT:-0}" \
  --target "${FRONTEND_DOCKER_TARGET}" \
  -t blog-frontend:local \
  -t "blog-frontend:${app_version}" \
  -f "${ROOT_DIR}/frontend/Dockerfile" \
  "${ROOT_DIR}/frontend"

echo "[OK] Built blog-backend:{local,${app_version}}"
echo "[OK] Built blog-frontend:{local,${app_version}}"
echo "[INFO] Next steps:"
echo "  bash scripts/deployment/push-images.sh <registry-prefix>"
echo "  bash scripts/deployment/export-images.sh"
