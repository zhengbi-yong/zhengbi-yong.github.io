#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.production"
COMPOSE_FILE="${ROOT_DIR}/deployments/docker/compose-files/prod/docker-compose.yml"
BUILD_IMAGES=false
PULL_IMAGES=false
SKIP_MIGRATE=false
FORCE_NO_EDGE=false
SKIP_INFRA=false
SERVICES_CSV=""

usage() {
  cat <<'EOF'
Usage: bash scripts/deployment/deploy-compose-stack.sh [options]

Options:
  --env-file PATH    Use a custom environment file (default: .env.production)
  --build            Build application images before deploy
  --pull             Pull referenced images before deploy
  --skip-migrate     Skip the migration job
  --skip-infra       Reuse current infrastructure containers
  --services CSV     Restart only these app services (api,worker,frontend,edge)
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
    --skip-infra)
      SKIP_INFRA=true
      shift
      ;;
    --services)
      SERVICES_CSV="$2"
      shift 2
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

requested_edge=false
app_services=(api worker frontend)
if [[ -n "${SERVICES_CSV}" ]]; then
  app_services=()
  IFS=',' read -r -a requested_services <<< "${SERVICES_CSV}"

  for service in "${requested_services[@]}"; do
    service="${service//[[:space:]]/}"
    [[ -n "${service}" ]] || continue

    case "${service}" in
      api|worker|frontend)
        app_services+=("${service}")
        ;;
      edge)
        requested_edge=true
        ;;
      *)
        echo "[ERROR] unsupported service in --services: ${service}" >&2
        exit 1
        ;;
    esac
  done
fi

if [[ "${requested_edge}" == "true" && "${edge_enabled}" != "true" ]]; then
  echo "[ERROR] edge was requested, but ENABLE_EDGE_PROXY is disabled" >&2
  exit 1
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

if [[ "${SKIP_INFRA}" == "true" ]]; then
  echo "[INFO] Reusing existing infrastructure containers"
else
  echo "[INFO] Starting infrastructure: ${infra_services[*]}"
  "${compose_cmd[@]}" up -d --wait "${infra_services[@]}"
fi

if [[ "${SKIP_MIGRATE}" != "true" ]]; then
  echo "[INFO] Running migration job"
  "${compose_cmd[@]}" --profile ops run --rm migrate
fi

if [[ ${#app_services[@]} -gt 0 ]]; then
  echo "[INFO] Starting application services: ${app_services[*]}"
  "${compose_cmd[@]}" up -d --wait "${app_services[@]}"
else
  echo "[INFO] No direct application services requested"
fi

if [[ "${edge_enabled}" == "true" && ( "${requested_edge}" == "true" || -z "${SERVICES_CSV}" || " ${app_services[*]} " == *" api "* || " ${app_services[*]} " == *" frontend "* ) ]]; then
  echo "[INFO] Recreating edge proxy to refresh upstream DNS bindings"
  "${compose_cmd[@]}" up -d --wait --force-recreate edge
fi

api_check_url="http://127.0.0.1:${BACKEND_PORT:-3000}/readyz"
frontend_check_url="http://127.0.0.1:${FRONTEND_PORT:-3001}/"
verify_api=false
verify_frontend=false

if [[ "${edge_enabled}" == "true" ]]; then
  api_check_url="http://127.0.0.1:${EDGE_HTTP_PORT:-80}/readyz"
  frontend_check_url="http://127.0.0.1:${EDGE_HTTP_PORT:-80}/"
fi

if [[ -z "${SERVICES_CSV}" ]]; then
  verify_api=true
  verify_frontend=true
else
  if [[ "${requested_edge}" == "true" || " ${app_services[*]} " == *" api "* ]]; then
    verify_api=true
  fi
  if [[ "${requested_edge}" == "true" || " ${app_services[*]} " == *" frontend "* ]]; then
    verify_frontend=true
  fi
fi

if [[ "${verify_api}" == "true" ]]; then
  echo "[INFO] Verifying API readiness: ${api_check_url}"
  curl --fail --silent --show-error --retry 10 --retry-all-errors "${api_check_url}" >/dev/null
fi

if [[ "${verify_frontend}" == "true" ]]; then
  echo "[INFO] Verifying frontend availability: ${frontend_check_url}"
  curl --fail --silent --show-error --retry 10 --retry-all-errors "${frontend_check_url}" >/dev/null
fi

echo "[OK] deployment completed successfully"
echo "[INFO] Stack status:"
"${compose_cmd[@]}" ps
