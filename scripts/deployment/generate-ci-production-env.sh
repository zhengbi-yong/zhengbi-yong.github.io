#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEMPLATE_FILE="${ROOT_DIR}/.env.production.example"
OUTPUT_FILE="${ROOT_DIR}/.env.production.ci"
PROJECT_NAME="blog-platform-ci"
EDGE_PORT="8088"
BACKEND_PORT="3300"
FRONTEND_PORT="3301"
POSTGRES_PORT="55432"
REDIS_PORT="56379"
SITE_URL=""

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deployment/generate-ci-production-env.sh [options]

Options:
  --output <path>          Destination env file (default: .env.production.ci)
  --project-name <name>    Compose project name (default: blog-platform-ci)
  --site-url <url>         Public site URL (default: http://localhost:<edge-port>)
  --edge-port <port>       Published edge proxy port (default: 8088)
  --backend-port <port>    Published backend port (default: 3300)
  --frontend-port <port>   Published frontend port (default: 3301)
  --postgres-port <port>   Published PostgreSQL port (default: 55432)
  --redis-port <port>      Published Redis port (default: 56379)
  --help                   Show this help
EOF
}

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

update_env_file() {
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

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      OUTPUT_FILE="${2:-}"
      shift 2
      ;;
    --project-name)
      PROJECT_NAME="${2:-}"
      shift 2
      ;;
    --site-url)
      SITE_URL="${2:-}"
      shift 2
      ;;
    --edge-port)
      EDGE_PORT="${2:-}"
      shift 2
      ;;
    --backend-port)
      BACKEND_PORT="${2:-}"
      shift 2
      ;;
    --frontend-port)
      FRONTEND_PORT="${2:-}"
      shift 2
      ;;
    --postgres-port)
      POSTGRES_PORT="${2:-}"
      shift 2
      ;;
    --redis-port)
      REDIS_PORT="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail "unknown argument: $1"
      ;;
  esac
done

[[ -f "${TEMPLATE_FILE}" ]] || fail "template env file not found: ${TEMPLATE_FILE}"

if [[ "${OUTPUT_FILE}" != /* ]]; then
  OUTPUT_FILE="${ROOT_DIR}/${OUTPUT_FILE}"
fi

if [[ -z "${SITE_URL}" ]]; then
  SITE_URL="http://localhost:${EDGE_PORT}"
fi

mkdir -p "$(dirname "${OUTPUT_FILE}")"
cp "${TEMPLATE_FILE}" "${OUTPUT_FILE}"

update_env_file "${OUTPUT_FILE}" "COMPOSE_PROJECT_NAME" "${PROJECT_NAME}"
update_env_file "${OUTPUT_FILE}" "APP_VERSION" "ci-smoke"
update_env_file "${OUTPUT_FILE}" "VCS_REF" "ci"
update_env_file "${OUTPUT_FILE}" "BUILD_DATE" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
update_env_file "${OUTPUT_FILE}" "BACKEND_IMAGE" "blog-backend:local"
update_env_file "${OUTPUT_FILE}" "FRONTEND_IMAGE" "blog-frontend:local"
update_env_file "${OUTPUT_FILE}" "NEXT_PUBLIC_SITE_URL" "${SITE_URL}"
update_env_file "${OUTPUT_FILE}" "CORS_ALLOWED_ORIGINS" "${SITE_URL}"
update_env_file "${OUTPUT_FILE}" "NEXT_PUBLIC_BACKEND_URL" ""
update_env_file "${OUTPUT_FILE}" "NEXT_PUBLIC_API_URL" ""
update_env_file "${OUTPUT_FILE}" "BACKEND_INTERNAL_URL" "http://api:3000"
update_env_file "${OUTPUT_FILE}" "ENABLE_EDGE_PROXY" "true"
update_env_file "${OUTPUT_FILE}" "ENABLE_BUNDLED_MEILISEARCH" "false"
update_env_file "${OUTPUT_FILE}" "ENABLE_BUNDLED_MINIO" "false"
update_env_file "${OUTPUT_FILE}" "ENABLE_BUNDLED_MAILPIT" "false"
update_env_file "${OUTPUT_FILE}" "EDGE_BIND_HOST" "127.0.0.1"
update_env_file "${OUTPUT_FILE}" "FRONTEND_BIND_HOST" "127.0.0.1"
update_env_file "${OUTPUT_FILE}" "BACKEND_BIND_HOST" "127.0.0.1"
update_env_file "${OUTPUT_FILE}" "POSTGRES_BIND_HOST" "127.0.0.1"
update_env_file "${OUTPUT_FILE}" "REDIS_BIND_HOST" "127.0.0.1"
update_env_file "${OUTPUT_FILE}" "EDGE_HTTP_PORT" "${EDGE_PORT}"
update_env_file "${OUTPUT_FILE}" "FRONTEND_PORT" "${FRONTEND_PORT}"
update_env_file "${OUTPUT_FILE}" "BACKEND_PORT" "${BACKEND_PORT}"
update_env_file "${OUTPUT_FILE}" "POSTGRES_PORT" "${POSTGRES_PORT}"
update_env_file "${OUTPUT_FILE}" "REDIS_PORT" "${REDIS_PORT}"
update_env_file "${OUTPUT_FILE}" "POSTGRES_PASSWORD" "postgres-password-1234567890"
update_env_file "${OUTPUT_FILE}" "REDIS_PASSWORD" "redis-password-1234567890"
update_env_file "${OUTPUT_FILE}" "JWT_SECRET" "jwt-secret-abcdefghijklmnopqrstuvwxyz123456"
update_env_file "${OUTPUT_FILE}" "PASSWORD_PEPPER" "pepper-secret-abcdefghijklmnopqrstuvwxyz123"
update_env_file "${OUTPUT_FILE}" "SMTP_HOST" "smtp.ci.local"
update_env_file "${OUTPUT_FILE}" "SMTP_USERNAME" "ops@ci.local"
update_env_file "${OUTPUT_FILE}" "SMTP_PASSWORD" "smtp-password-1234567890"
update_env_file "${OUTPUT_FILE}" "SMTP_FROM" "ops@ci.local"
update_env_file "${OUTPUT_FILE}" "DATABASE_POOL_MAX_CONNECTIONS" "8"
update_env_file "${OUTPUT_FILE}" "DATABASE_POOL_MIN_CONNECTIONS" "1"
update_env_file "${OUTPUT_FILE}" "REDIS_POOL_MAX_SIZE" "5"
update_env_file "${OUTPUT_FILE}" "WORKER_BATCH_SIZE" "25"

echo "[OK] generated CI production env: ${OUTPUT_FILE}"
echo "[INFO] site_url=${SITE_URL}"
echo "[INFO] compose_project=${PROJECT_NAME}"
