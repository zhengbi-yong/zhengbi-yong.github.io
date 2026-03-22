#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.production"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.production.yml"
BUILD_IMAGES=false
PULL_IMAGES=false
SKIP_MIGRATE=false
FORCE_NO_EDGE=false

usage() {
  cat <<'EOF'
Usage: bash scripts/deployment/deploy-compose-stack.sh [options]

Options:
  --env-file PATH    Use a custom environment file (default: .env.production)
  --build            Build application images before deploy
  --pull             Pull referenced images before deploy
  --skip-migrate     Skip the migration job
  --no-edge          Do not start the bundled edge proxy even if enabled in env
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --build)
      BUILD_IMAGES=true
      shift
      ;;
    --pull)
      PULL_IMAGES=true
      shift
      ;;
    --skip-migrate)
      SKIP_MIGRATE=true
      shift
      ;;
    --no-edge)
      FORCE_NO_EDGE=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[ERROR] unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "[ERROR] compose file not found: ${COMPOSE_FILE}" >&2
  exit 1
fi

bash "${ROOT_DIR}/scripts/deployment/validate-production-env.sh" "${ENV_FILE}"

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

profiles=()
if [[ "${ENABLE_BUNDLED_MEILISEARCH:-false}" == "true" ]]; then
  profiles+=(--profile search)
fi
if [[ "${ENABLE_BUNDLED_MINIO:-false}" == "true" ]]; then
  profiles+=(--profile object-storage)
fi
if [[ "${ENABLE_BUNDLED_MAILPIT:-false}" == "true" ]]; then
  profiles+=(--profile mail)
fi
if [[ "${ENABLE_EDGE_PROXY:-true}" == "true" && "${FORCE_NO_EDGE}" != "true" ]]; then
  profiles+=(--profile edge)
  edge_enabled=true
else
  edge_enabled=false
fi

compose_cmd=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}")
compose_cmd+=("${profiles[@]}")

echo "[INFO] Using env file: ${ENV_FILE}"
echo "[INFO] Compose project: ${COMPOSE_PROJECT_NAME:-blog-platform}"
echo "[INFO] Runtime environment: ${APP_RUNTIME_ENVIRONMENT:-production}"
echo "[INFO] Compose profiles: ${profiles[*]:-(none)}"

if [[ "${PULL_IMAGES}" == "true" ]]; then
  echo "[INFO] Pulling referenced images"
  "${compose_cmd[@]}" pull
fi

if [[ "${BUILD_IMAGES}" == "true" ]]; then
  echo "[INFO] Building application images"
  "${compose_cmd[@]}" build api frontend
fi

infra_services=(postgres redis)
if [[ "${ENABLE_BUNDLED_MEILISEARCH:-false}" == "true" ]]; then
  infra_services+=(meilisearch)
fi
if [[ "${ENABLE_BUNDLED_MINIO:-false}" == "true" ]]; then
  infra_services+=(minio)
fi
if [[ "${ENABLE_BUNDLED_MAILPIT:-false}" == "true" ]]; then
  infra_services+=(mailpit)
fi

echo "[INFO] Starting infrastructure: ${infra_services[*]}"
"${compose_cmd[@]}" up -d --wait "${infra_services[@]}"

if [[ "${SKIP_MIGRATE}" != "true" ]]; then
  echo "[INFO] Running migration job"
  "${compose_cmd[@]}" --profile ops run --rm migrate
fi

app_services=(api worker frontend)
if [[ "${edge_enabled}" == "true" ]]; then
  app_services+=(edge)
fi

echo "[INFO] Starting application services: ${app_services[*]}"
"${compose_cmd[@]}" up -d --wait "${app_services[@]}"

api_check_url="http://127.0.0.1:${BACKEND_PORT:-3000}/readyz"
frontend_check_url="http://127.0.0.1:${FRONTEND_PORT:-3001}/"

if [[ "${edge_enabled}" == "true" ]]; then
  api_check_url="http://127.0.0.1:${EDGE_HTTP_PORT:-80}/readyz"
  frontend_check_url="http://127.0.0.1:${EDGE_HTTP_PORT:-80}/"
fi

echo "[INFO] Verifying API readiness: ${api_check_url}"
curl --fail --silent --show-error --retry 10 --retry-all-errors "${api_check_url}" >/dev/null

echo "[INFO] Verifying frontend availability: ${frontend_check_url}"
curl --fail --silent --show-error --retry 10 --retry-all-errors "${frontend_check_url}" >/dev/null

echo "[OK] deployment completed successfully"
echo "[INFO] Stack status:"
"${compose_cmd[@]}" ps
