#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET=""
REMOTE_DIR="/opt/blog-platform"
SSH_PORT="22"
IDENTITY_FILE=""
BUILD_LOCAL_IMAGES=false
MIGRATE_MODE="auto"
LOCAL_FRONTEND_IGNORE_BUILD_ERRORS="${NEXT_IGNORE_BUILD_ERRORS:-1}"
LOCAL_FRONTEND_IGNORE_ESLINT="${NEXT_IGNORE_ESLINT:-1}"
IMAGES=()
MANUAL_SERVICES=()
REMOTE_RETRY_ATTEMPTS="${REMOTE_RETRY_ATTEMPTS:-3}"
REMOTE_RETRY_DELAY_SECS="${REMOTE_RETRY_DELAY_SECS:-10}"
CLEANUP_STALE_PROJECTS=false

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deployment/refresh-remote-compose.sh --target user@host [options]

This is the fast update path for an existing Compose deployment. It reuses the
remote shared env, streams only changed local images, uploads the latest runtime
package, and restarts only the affected services.

Options:
  --target USER@HOST               Remote SSH target
  --remote-dir PATH                Remote release root (default: /opt/blog-platform)
  --ssh-port PORT                  SSH port (default: 22)
  --identity-file PATH             SSH private key
  --build-local-images             Build local deploy images before refresh
  --image NAME                     Local image to consider (repeatable)
  --service NAME                   Extra service to restart (repeatable: api,worker,frontend,edge)
  --skip-migrate                   Never run remote migrations during refresh
  --run-migrate                    Always run remote migrations during refresh
  --frontend-ignore-build-errors 0|1
                                   Passed through when --build-local-images is used
  --frontend-ignore-eslint 0|1     Passed through when --build-local-images is used
  --cleanup-stale-projects         Stop stale non-live compose projects before refresh
  --help                           Show this help
EOF
}

fail() {
  echo "error: $*" >&2
  exit 1
}

run_with_retry() {
  local -a cmd=("$@")
  local attempt=1

  while true; do
    if "${cmd[@]}"; then
      return 0
    fi

    if [[ "${attempt}" -ge "${REMOTE_RETRY_ATTEMPTS}" ]]; then
      return 1
    fi

    echo "[WARN] Remote command failed (attempt ${attempt}/${REMOTE_RETRY_ATTEMPTS}), retrying in ${REMOTE_RETRY_DELAY_SECS}s"
    sleep "${REMOTE_RETRY_DELAY_SECS}"
    attempt=$((attempt + 1))
  done
}

add_unique() {
  local value="$1"
  local existing

  for existing in "${RESTART_SERVICES[@]}"; do
    if [[ "${existing}" == "${value}" ]]; then
      return 0
    fi
  done

  RESTART_SERVICES+=("${value}")
}

build_local_images() {
  echo "[INFO] Building local deploy images before refresh"
  env \
    NEXT_IGNORE_BUILD_ERRORS="${LOCAL_FRONTEND_IGNORE_BUILD_ERRORS}" \
    NEXT_IGNORE_ESLINT="${LOCAL_FRONTEND_IGNORE_ESLINT}" \
    bash "${ROOT_DIR}/scripts/deployment/build-all.sh"
}

cleanup_remote_stale_projects() {
  local -a ssh_opts
  ssh_opts=(-p "${SSH_PORT}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
  ssh_opts+=(
    -o ConnectTimeout=15
    -o ServerAliveInterval=15
    -o ServerAliveCountMax=3
  )
  if [[ -n "${IDENTITY_FILE}" ]]; then
    ssh_opts+=(-i "${IDENTITY_FILE}")
  fi

  echo "[INFO] Cleaning stale compose projects on remote host"
  ssh "${ssh_opts[@]}" "${TARGET}" "REMOTE_DIR='${REMOTE_DIR}' bash -s" <<'EOF'
set -euo pipefail

env_file="${REMOTE_DIR}/shared/.env.production"
keep_project=""
if [[ -f "${env_file}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${env_file}"
  set +a
  keep_project="${COMPOSE_PROJECT_NAME:-}"
fi

if [[ -z "${keep_project}" ]]; then
  echo "[WARN] Could not determine COMPOSE_PROJECT_NAME; skip stale project cleanup"
  exit 0
fi

mapfile -t projects < <(docker compose ls -q 2>/dev/null | awk 'NF')
if [[ ${#projects[@]} -eq 0 ]]; then
  echo "[INFO] No compose projects found on remote host"
  exit 0
fi

removed_any="false"
for project in "${projects[@]}"; do
  [[ "${project}" == "${keep_project}" ]] && continue
  case "${project}" in
    blog-platform|blog-platform-*)
      echo "[INFO] Removing stale compose project: ${project}"
      docker compose -p "${project}" down --remove-orphans >/dev/null 2>&1 || true
      removed_any="true"
      ;;
  esac
done

for legacy in blog-frontend blog-backend blog-postgres blog-redis; do
  if docker ps -a --format '{{.Names}}' | grep -qx "${legacy}"; then
    echo "[INFO] Removing stale container: ${legacy}"
    docker rm -f "${legacy}" >/dev/null 2>&1 || true
    removed_any="true"
  fi
done

if [[ "${removed_any}" != "true" ]]; then
  echo "[INFO] No stale compose projects to clean"
fi
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="$2"
      shift 2
      ;;
    --remote-dir)
      REMOTE_DIR="$2"
      shift 2
      ;;
    --ssh-port)
      SSH_PORT="$2"
      shift 2
      ;;
    --identity-file)
      IDENTITY_FILE="$2"
      shift 2
      ;;
    --build-local-images)
      BUILD_LOCAL_IMAGES=true
      shift
      ;;
    --image)
      IMAGES+=("$2")
      shift 2
      ;;
    --service)
      MANUAL_SERVICES+=("$2")
      shift 2
      ;;
    --skip-migrate)
      MIGRATE_MODE="skip"
      shift
      ;;
    --run-migrate)
      MIGRATE_MODE="force"
      shift
      ;;
    --frontend-ignore-build-errors)
      LOCAL_FRONTEND_IGNORE_BUILD_ERRORS="$2"
      shift 2
      ;;
    --frontend-ignore-eslint)
      LOCAL_FRONTEND_IGNORE_ESLINT="$2"
      shift 2
      ;;
    --cleanup-stale-projects)
      CLEANUP_STALE_PROJECTS=true
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

[[ -n "${TARGET}" ]] || fail "--target is required"

case "${LOCAL_FRONTEND_IGNORE_BUILD_ERRORS}" in
  0|1) ;;
  *) fail "--frontend-ignore-build-errors must be 0 or 1" ;;
esac

case "${LOCAL_FRONTEND_IGNORE_ESLINT}" in
  0|1) ;;
  *) fail "--frontend-ignore-eslint must be 0 or 1" ;;
esac

case "${REMOTE_RETRY_ATTEMPTS}" in
  ''|*[!0-9]*)
    fail "REMOTE_RETRY_ATTEMPTS must be a positive integer"
    ;;
  *)
    if [[ "${REMOTE_RETRY_ATTEMPTS}" -lt 1 ]]; then
      fail "REMOTE_RETRY_ATTEMPTS must be >= 1"
    fi
    ;;
esac

case "${REMOTE_RETRY_DELAY_SECS}" in
  ''|*[!0-9]*)
    fail "REMOTE_RETRY_DELAY_SECS must be a non-negative integer"
    ;;
esac

if [[ ${#IMAGES[@]} -eq 0 ]]; then
  IMAGES=("blog-backend:local" "blog-frontend:local")
fi

if [[ "${BUILD_LOCAL_IMAGES}" == "true" ]]; then
  build_local_images
fi

if [[ "${CLEANUP_STALE_PROJECTS}" == "true" ]]; then
  cleanup_remote_stale_projects
fi

changed_output="$(mktemp)"
cleanup() {
  rm -f "${changed_output}"
}
trap cleanup EXIT

stream_cmd=(
  bash "${ROOT_DIR}/scripts/deployment/stream-local-images.sh"
  --target "${TARGET}"
  --ssh-port "${SSH_PORT}"
  --changed-output "${changed_output}"
)
if [[ -n "${IDENTITY_FILE}" ]]; then
  stream_cmd+=(--identity-file "${IDENTITY_FILE}")
fi
for image in "${IMAGES[@]}"; do
  stream_cmd+=(--image "${image}")
done

run_with_retry "${stream_cmd[@]}"

mapfile -t changed_images < "${changed_output}"

backend_changed=false
frontend_changed=false
RESTART_SERVICES=()

for image in "${changed_images[@]}"; do
  case "${image}" in
    *blog-backend:local)
      backend_changed=true
      add_unique api
      add_unique worker
      ;;
    *blog-frontend:local)
      frontend_changed=true
      add_unique frontend
      ;;
  esac
done

for service in "${MANUAL_SERVICES[@]}"; do
  case "${service}" in
    api|worker|frontend|edge)
      add_unique "${service}"
      ;;
    *)
      fail "unsupported --service value: ${service}"
      ;;
  esac
done

run_migrate=false
case "${MIGRATE_MODE}" in
  auto)
    if [[ "${backend_changed}" == "true" ]]; then
      run_migrate=true
    fi
    ;;
  force)
    run_migrate=true
    ;;
  skip)
    run_migrate=false
    ;;
  *)
    fail "unexpected migrate mode: ${MIGRATE_MODE}"
    ;;
esac

deploy_cmd=(
  bash "${ROOT_DIR}/scripts/deployment/deploy-remote-compose.sh"
  --target "${TARGET}"
  --remote-dir "${REMOTE_DIR}"
  --ssh-port "${SSH_PORT}"
  --use-existing-env
  --skip-infra
  --no-pull
)
if [[ -n "${IDENTITY_FILE}" ]]; then
  deploy_cmd+=(--identity-file "${IDENTITY_FILE}")
fi
if [[ "${run_migrate}" != "true" ]]; then
  deploy_cmd+=(--skip-migrate)
fi
if [[ ${#RESTART_SERVICES[@]} -gt 0 ]]; then
  services_csv="$(IFS=,; printf '%s' "${RESTART_SERVICES[*]}")"
  deploy_cmd+=(--services "${services_csv}")
  echo "[INFO] Refresh will restart services: ${services_csv}"
else
  echo "[INFO] No image deltas detected; refreshing the full app set to pick up runtime package changes"
fi

echo "[INFO] Remote migrations enabled: ${run_migrate}"
run_with_retry "${deploy_cmd[@]}"
