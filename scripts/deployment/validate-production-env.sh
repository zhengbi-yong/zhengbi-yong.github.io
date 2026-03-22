#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${1:-${ROOT_DIR}/.env.production}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[ERROR] env file not found: ${ENV_FILE}" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

errors=0
warnings=0

log_error() {
  echo "[ERROR] $*" >&2
  errors=$((errors + 1))
}

log_warn() {
  echo "[WARN] $*" >&2
  warnings=$((warnings + 1))
}

require_var() {
  local name="$1"
  local value="${!name:-}"
  if [[ -z "${value}" ]]; then
    log_error "${name} must be set"
  fi
}

reject_placeholder() {
  local name="$1"
  local value="${!name:-}"
  if [[ -z "${value}" ]]; then
    return
  fi

  case "${value}" in
    *replace-with*|*change-me*|*example.com*|*blog.example.com*|*your-* )
      log_error "${name} still contains a placeholder value"
      ;;
  esac
}

require_min_length() {
  local name="$1"
  local min_length="$2"
  local value="${!name:-}"

  if [[ ${#value} -lt ${min_length} ]]; then
    log_error "${name} must be at least ${min_length} characters"
  fi
}

require_var APP_VERSION
require_var COMPOSE_PROJECT_NAME
require_var NEXT_PUBLIC_SITE_URL
require_var BACKEND_INTERNAL_URL
require_var CORS_ALLOWED_ORIGINS
require_var BACKEND_IMAGE
require_var FRONTEND_IMAGE
require_var POSTGRES_USER
require_var POSTGRES_PASSWORD
require_var POSTGRES_DB
require_var REDIS_PASSWORD
require_var JWT_SECRET
require_var PASSWORD_PEPPER
require_var SMTP_HOST
require_var SMTP_USERNAME
require_var SMTP_PASSWORD
require_var SMTP_FROM

reject_placeholder NEXT_PUBLIC_SITE_URL
reject_placeholder CORS_ALLOWED_ORIGINS
if [[ "${BACKEND_IMAGE:-}" != "blog-backend:local" ]]; then
  reject_placeholder BACKEND_IMAGE
fi
if [[ "${FRONTEND_IMAGE:-}" != "blog-frontend:local" ]]; then
  reject_placeholder FRONTEND_IMAGE
fi
reject_placeholder POSTGRES_PASSWORD
reject_placeholder REDIS_PASSWORD
reject_placeholder JWT_SECRET
reject_placeholder PASSWORD_PEPPER
reject_placeholder SMTP_HOST
reject_placeholder SMTP_USERNAME
reject_placeholder SMTP_PASSWORD
reject_placeholder SMTP_FROM

require_min_length POSTGRES_PASSWORD 16
require_min_length REDIS_PASSWORD 16
require_min_length JWT_SECRET 32
require_min_length PASSWORD_PEPPER 32

if [[ "${JWT_SECRET:-}" == "${PASSWORD_PEPPER:-}" && -n "${JWT_SECRET:-}" ]]; then
  log_error "JWT_SECRET and PASSWORD_PEPPER must be different values"
fi

if [[ "${NEXT_PUBLIC_SITE_URL:-}" != https://* && "${NEXT_PUBLIC_SITE_URL:-}" != http://localhost* ]]; then
  log_warn "NEXT_PUBLIC_SITE_URL should usually use HTTPS in production"
fi

if [[ "${CORS_ALLOWED_ORIGINS:-}" != *"${NEXT_PUBLIC_SITE_URL:-}"* ]]; then
  log_warn "CORS_ALLOWED_ORIGINS does not include NEXT_PUBLIC_SITE_URL"
fi

if [[ "${ENABLE_BUNDLED_MEILISEARCH:-false}" == "true" ]]; then
  require_var MEILISEARCH_MASTER_KEY
  reject_placeholder MEILISEARCH_MASTER_KEY
fi

if [[ -n "${MEILISEARCH_URL:-}" ]]; then
  require_var MEILISEARCH_MASTER_KEY
  reject_placeholder MEILISEARCH_MASTER_KEY
fi

if [[ "${STORAGE_BACKEND:-local}" == "minio" || "${ENABLE_BUNDLED_MINIO:-false}" == "true" ]]; then
  require_var MINIO_ENDPOINT
  require_var MINIO_PUBLIC_URL
  require_var MINIO_ACCESS_KEY
  require_var MINIO_SECRET_KEY
  require_var MINIO_BUCKET
  reject_placeholder MINIO_ACCESS_KEY
  reject_placeholder MINIO_SECRET_KEY
  reject_placeholder MINIO_BUCKET
fi

if [[ "${ENABLE_EDGE_PROXY:-true}" == "false" && -z "${NEXT_PUBLIC_BACKEND_URL:-}" ]]; then
  log_warn "NEXT_PUBLIC_BACKEND_URL is empty while ENABLE_EDGE_PROXY=false; browsers will rely on same-origin /api routes"
fi

if [[ -n "${APP_RUNTIME_ENVIRONMENT:-}" && "${APP_RUNTIME_ENVIRONMENT}" != "production" && "${APP_RUNTIME_ENVIRONMENT}" != "staging" ]]; then
  log_warn "APP_RUNTIME_ENVIRONMENT should normally be production or staging"
fi

if [[ ${errors} -gt 0 ]]; then
  echo "[FAIL] production env validation failed with ${errors} error(s) and ${warnings} warning(s)" >&2
  exit 1
fi

echo "[OK] production env validation passed with ${warnings} warning(s)"
