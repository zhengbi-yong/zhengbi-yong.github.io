#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEMPLATE_FILE="${ROOT_DIR}/.env.production.example"
OUTPUT_FILE="${ROOT_DIR}/.env.production.generated"
SCHEME="http"
PUBLIC_HOST=""
SITE_URL=""
RELEASE_VERSION=""
REGISTRY="ghcr.io"
REPOSITORY=""
BACKEND_IMAGE=""
FRONTEND_IMAGE=""
ENABLE_BUNDLED_MEILISEARCH=false
ENABLE_BUNDLED_MINIO=false
ENABLE_BUNDLED_MAILPIT=false
SMTP_MODE="external"
COMPOSE_PROJECT_NAME_VALUE=""
EXTRA_ENV_OVERRIDES=()

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deployment/generate-production-env.sh [options]

Options:
  --output PATH                    Write generated env here (default: .env.production.generated)
  --public-host HOST               Public host or IP used to derive the site URL
  --site-url URL                   Full public site URL; overrides --public-host/--scheme
  --scheme http|https              URL scheme when using --public-host (default: http)
  --release-version VERSION        Release version written to APP_VERSION and image tags
  --repository OWNER/REPO          OCI repository path for derived image names
  --registry HOST                  OCI registry host (default: ghcr.io)
  --backend-image IMAGE            Explicit backend image reference
  --frontend-image IMAGE           Explicit frontend image reference
  --compose-project-name NAME      Override COMPOSE_PROJECT_NAME
  --set-env KEY=VALUE              Override any generated env key (repeatable)
  --smtp-mode external|mailpit     SMTP profile (default: external)
  --enable-bundled-meilisearch     Enable the bundled Meilisearch profile
  --enable-bundled-minio           Enable the bundled MinIO profile and switch storage backend
  --enable-bundled-mailpit         Enable the bundled Mailpit profile
  --help                           Show this help
EOF
}

fail() {
  echo "error: $*" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "missing required command: $1"
  fi
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

random_secret() {
  local bytes="$1"

  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "${bytes}"
    return
  fi

  python3 - "$bytes" <<'PY'
import secrets
import sys
print(secrets.token_hex(int(sys.argv[1])))
PY
}

derive_repository_from_git() {
  local remote_url normalized

  if ! remote_url="$(git -C "${ROOT_DIR}" config --get remote.origin.url 2>/dev/null)"; then
    return
  fi

  normalized="${remote_url%.git}"
  normalized="${normalized#git@github.com:}"
  normalized="${normalized#https://github.com/}"
  normalized="${normalized#ssh://git@github.com/}"

  if [[ "${normalized}" == */* ]]; then
    REPOSITORY="${normalized}"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --public-host)
      PUBLIC_HOST="$2"
      shift 2
      ;;
    --site-url)
      SITE_URL="$2"
      shift 2
      ;;
    --scheme)
      SCHEME="$2"
      shift 2
      ;;
    --release-version)
      RELEASE_VERSION="$2"
      shift 2
      ;;
    --repository)
      REPOSITORY="$2"
      shift 2
      ;;
    --registry)
      REGISTRY="$2"
      shift 2
      ;;
    --backend-image)
      BACKEND_IMAGE="$2"
      shift 2
      ;;
    --frontend-image)
      FRONTEND_IMAGE="$2"
      shift 2
      ;;
    --compose-project-name)
      COMPOSE_PROJECT_NAME_VALUE="$2"
      shift 2
      ;;
    --set-env)
      EXTRA_ENV_OVERRIDES+=("$2")
      shift 2
      ;;
    --smtp-mode)
      SMTP_MODE="$2"
      shift 2
      ;;
    --enable-bundled-meilisearch)
      ENABLE_BUNDLED_MEILISEARCH=true
      shift
      ;;
    --enable-bundled-minio)
      ENABLE_BUNDLED_MINIO=true
      shift
      ;;
    --enable-bundled-mailpit)
      ENABLE_BUNDLED_MAILPIT=true
      shift
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

[[ -f "${TEMPLATE_FILE}" ]] || fail "template not found: ${TEMPLATE_FILE}"
require_command python3

case "${SCHEME}" in
  http|https) ;;
  *) fail "--scheme must be http or https" ;;
esac

case "${SMTP_MODE}" in
  external|mailpit) ;;
  *) fail "--smtp-mode must be external or mailpit" ;;
esac

if [[ -z "${SITE_URL}" ]]; then
  if [[ -z "${PUBLIC_HOST}" ]]; then
    fail "set --site-url or --public-host"
  fi
  SITE_URL="${SCHEME}://${PUBLIC_HOST}"
fi

if [[ "${SITE_URL}" != http://* && "${SITE_URL}" != https://* ]]; then
  fail "--site-url must start with http:// or https://"
fi

PUBLIC_HOST="${PUBLIC_HOST:-${SITE_URL#http://}}"
PUBLIC_HOST="${PUBLIC_HOST#https://}"
PUBLIC_HOST="${PUBLIC_HOST%%/*}"

if [[ -z "${REPOSITORY}" && ( -n "${RELEASE_VERSION}" || -z "${BACKEND_IMAGE}" || -z "${FRONTEND_IMAGE}" ) ]]; then
  derive_repository_from_git
fi

default_version="$(grep '^APP_VERSION=' "${TEMPLATE_FILE}" | head -n1 | cut -d= -f2-)"
app_version="${RELEASE_VERSION:-${default_version}}"
[[ -n "${app_version}" ]] || fail "could not derive APP_VERSION"

if [[ -z "${BACKEND_IMAGE}" ]]; then
  [[ -n "${REPOSITORY}" ]] || fail "--repository is required to derive image references"
  BACKEND_IMAGE="${REGISTRY%/}/${REPOSITORY}/blog-backend:${app_version}"
fi

if [[ -z "${FRONTEND_IMAGE}" ]]; then
  [[ -n "${REPOSITORY}" ]] || fail "--repository is required to derive image references"
  FRONTEND_IMAGE="${REGISTRY%/}/${REPOSITORY}/blog-frontend:${app_version}"
fi

mkdir -p "$(dirname "${OUTPUT_FILE}")"
cp "${TEMPLATE_FILE}" "${OUTPUT_FILE}"

domain_for_email="${PUBLIC_HOST%%:*}"
postgres_password="$(random_secret 24)"
redis_password="$(random_secret 24)"
jwt_secret="$(random_secret 32)"
password_pepper="$(random_secret 32)"
meili_key="$(random_secret 24)"
minio_access_key="minio$(random_secret 8)"
minio_secret_key="$(random_secret 24)"

update_env_file "${OUTPUT_FILE}" "APP_VERSION" "${app_version}"
update_env_file "${OUTPUT_FILE}" "NEXT_PUBLIC_SENTRY_RELEASE" "${app_version}"
update_env_file "${OUTPUT_FILE}" "FRONTEND_OTEL_SERVICE_VERSION" "${app_version}"
update_env_file "${OUTPUT_FILE}" "OTEL_SERVICE_VERSION" "${app_version}"
update_env_file "${OUTPUT_FILE}" "BACKEND_IMAGE" "${BACKEND_IMAGE}"
update_env_file "${OUTPUT_FILE}" "FRONTEND_IMAGE" "${FRONTEND_IMAGE}"
update_env_file "${OUTPUT_FILE}" "NEXT_PUBLIC_SITE_URL" "${SITE_URL}"
update_env_file "${OUTPUT_FILE}" "CORS_ALLOWED_ORIGINS" "${SITE_URL}"
update_env_file "${OUTPUT_FILE}" "POSTGRES_PASSWORD" "${postgres_password}"
update_env_file "${OUTPUT_FILE}" "REDIS_PASSWORD" "${redis_password}"
update_env_file "${OUTPUT_FILE}" "JWT_SECRET" "${jwt_secret}"
update_env_file "${OUTPUT_FILE}" "PASSWORD_PEPPER" "${password_pepper}"
update_env_file "${OUTPUT_FILE}" "ENABLE_BUNDLED_MEILISEARCH" "${ENABLE_BUNDLED_MEILISEARCH}"
update_env_file "${OUTPUT_FILE}" "ENABLE_BUNDLED_MINIO" "${ENABLE_BUNDLED_MINIO}"
update_env_file "${OUTPUT_FILE}" "ENABLE_BUNDLED_MAILPIT" "${ENABLE_BUNDLED_MAILPIT}"

if [[ -n "${COMPOSE_PROJECT_NAME_VALUE}" ]]; then
  update_env_file "${OUTPUT_FILE}" "COMPOSE_PROJECT_NAME" "${COMPOSE_PROJECT_NAME_VALUE}"
fi

if [[ "${SMTP_MODE}" == "mailpit" || "${ENABLE_BUNDLED_MAILPIT}" == "true" ]]; then
  update_env_file "${OUTPUT_FILE}" "ENABLE_BUNDLED_MAILPIT" "true"
  update_env_file "${OUTPUT_FILE}" "SMTP_HOST" "mailpit"
  update_env_file "${OUTPUT_FILE}" "SMTP_PORT" "1025"
  update_env_file "${OUTPUT_FILE}" "SMTP_USERNAME" "mailpit"
  update_env_file "${OUTPUT_FILE}" "SMTP_PASSWORD" "mailpit"
  update_env_file "${OUTPUT_FILE}" "SMTP_FROM" "noreply@${domain_for_email}"
  update_env_file "${OUTPUT_FILE}" "SMTP_TLS" "false"
fi

if [[ "${ENABLE_BUNDLED_MEILISEARCH}" == "true" ]]; then
  update_env_file "${OUTPUT_FILE}" "MEILISEARCH_URL" "http://meilisearch:7700"
  update_env_file "${OUTPUT_FILE}" "MEILISEARCH_MASTER_KEY" "${meili_key}"
fi

if [[ "${ENABLE_BUNDLED_MINIO}" == "true" ]]; then
  update_env_file "${OUTPUT_FILE}" "STORAGE_BACKEND" "minio"
  update_env_file "${OUTPUT_FILE}" "MINIO_ENDPOINT" "http://minio:9000"
  update_env_file "${OUTPUT_FILE}" "MINIO_PUBLIC_URL" "${SITE_URL%/}/minio"
  update_env_file "${OUTPUT_FILE}" "MINIO_ACCESS_KEY" "${minio_access_key}"
  update_env_file "${OUTPUT_FILE}" "MINIO_SECRET_KEY" "${minio_secret_key}"
  update_env_file "${OUTPUT_FILE}" "MINIO_BUCKET" "blog-uploads"
fi

for override in "${EXTRA_ENV_OVERRIDES[@]}"; do
  if [[ "${override}" != *=* ]]; then
    fail "--set-env expects KEY=VALUE, got: ${override}"
  fi

  override_key="${override%%=*}"
  override_value="${override#*=}"

  if [[ -z "${override_key}" ]]; then
    fail "--set-env expects a non-empty key"
  fi

  update_env_file "${OUTPUT_FILE}" "${override_key}" "${override_value}"
done

bash "${ROOT_DIR}/scripts/deployment/validate-production-env.sh" "${OUTPUT_FILE}"

echo "[OK] generated production env: ${OUTPUT_FILE}"
echo "[INFO] site url: ${SITE_URL}"
echo "[INFO] backend image: ${BACKEND_IMAGE}"
echo "[INFO] frontend image: ${FRONTEND_IMAGE}"
