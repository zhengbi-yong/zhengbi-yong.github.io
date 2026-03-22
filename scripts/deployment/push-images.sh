#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REGISTRY="${1:-}"
DOCKER_CMD="${DOCKER_CMD:-docker}"
REGISTRY_FILE="${ROOT_DIR}/.docker-registry"

usage() {
  cat <<'EOF'
Usage: bash scripts/deployment/push-images.sh <registry-prefix>

Example:
  bash scripts/deployment/push-images.sh ghcr.io/acme/blog
EOF
}

if [[ -z "${REGISTRY}" && -f "${REGISTRY_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${REGISTRY_FILE}"
fi

if [[ -z "${REGISTRY:-}" ]]; then
  usage
  exit 1
fi

if ! command -v "${DOCKER_CMD}" >/dev/null 2>&1; then
  echo "[ERROR] docker is required" >&2
  exit 1
fi

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

tags_backend=(
  "${REGISTRY}/blog-backend:${app_version}"
  "${REGISTRY}/blog-backend:sha-${sha_short}"
)
tags_frontend=(
  "${REGISTRY}/blog-frontend:${app_version}"
  "${REGISTRY}/blog-frontend:sha-${sha_short}"
)

if [[ -n "${major_minor_version}" ]]; then
  tags_backend+=("${REGISTRY}/blog-backend:${major_minor_version}")
  tags_frontend+=("${REGISTRY}/blog-frontend:${major_minor_version}")
fi

if [[ "${publish_latest}" == "true" ]]; then
  tags_backend+=("${REGISTRY}/blog-backend:latest")
  tags_frontend+=("${REGISTRY}/blog-frontend:latest")
fi

for tag in "${tags_backend[@]}"; do
  "${DOCKER_CMD}" tag "${backend_source}" "${tag}"
done

for tag in "${tags_frontend[@]}"; do
  "${DOCKER_CMD}" tag "${frontend_source}" "${tag}"
done

registry_host="${REGISTRY%%/*}"
if [[ "${registry_host}" == "${REGISTRY}" ]]; then
  registry_host="docker.io"
fi

echo "[INFO] Logging in to ${registry_host}"
"${DOCKER_CMD}" login "${registry_host}"

echo "[INFO] Pushing backend tags"
for tag in "${tags_backend[@]}"; do
  "${DOCKER_CMD}" push "${tag}"
done

echo "[INFO] Pushing frontend tags"
for tag in "${tags_frontend[@]}"; do
  "${DOCKER_CMD}" push "${tag}"
done

printf 'REGISTRY=%q\n' "${REGISTRY}" > "${REGISTRY_FILE}"

echo "[OK] Pushed versioned images:"
printf '  %s\n' "${tags_backend[@]}" "${tags_frontend[@]}"
