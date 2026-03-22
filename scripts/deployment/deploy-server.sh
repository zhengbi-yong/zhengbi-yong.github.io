#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REGISTRY="${1:-}"
VERSION="${2:-}"
ENV_FILE="${3:-${ROOT_DIR}/.env.production}"

usage() {
  cat <<'EOF'
Usage: bash scripts/deployment/deploy-server.sh <registry-prefix> <version> [env-file]

Example:
  bash scripts/deployment/deploy-server.sh ghcr.io/acme/blog 1.8.2
EOF
}

upsert_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"
  local escaped

  escaped="$(printf '%s' "${value}" | sed 's/[\/&]/\\&/g')"

  if grep -q "^${key}=" "${file}"; then
    sed -i "s/^${key}=.*/${key}=${escaped}/" "${file}"
  else
    printf '%s=%s\n' "${key}" "${value}" >> "${file}"
  fi
}

if [[ -z "${REGISTRY}" || -z "${VERSION}" ]]; then
  usage
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[ERROR] env file not found: ${ENV_FILE}" >&2
  exit 1
fi

normalized_version="${VERSION#v}"
backend_image="${REGISTRY%/}/blog-backend:${normalized_version}"
frontend_image="${REGISTRY%/}/blog-frontend:${normalized_version}"

echo "[WARN] scripts/deployment/deploy-server.sh is now a compatibility wrapper."
echo "[INFO] Updating ${ENV_FILE} to use:"
echo "  ${backend_image}"
echo "  ${frontend_image}"

upsert_env_var "${ENV_FILE}" "APP_VERSION" "${normalized_version}"
upsert_env_var "${ENV_FILE}" "BACKEND_IMAGE" "${backend_image}"
upsert_env_var "${ENV_FILE}" "FRONTEND_IMAGE" "${frontend_image}"
upsert_env_var "${ENV_FILE}" "NEXT_PUBLIC_SENTRY_RELEASE" "${normalized_version}"
upsert_env_var "${ENV_FILE}" "FRONTEND_OTEL_SERVICE_VERSION" "${normalized_version}"
upsert_env_var "${ENV_FILE}" "OTEL_SERVICE_VERSION" "${normalized_version}"

exec bash "${ROOT_DIR}/scripts/deployment/deploy-compose-stack.sh" \
  --env-file "${ENV_FILE}" \
  --pull
