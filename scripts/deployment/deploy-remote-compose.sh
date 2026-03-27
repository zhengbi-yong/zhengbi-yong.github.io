#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET=""
ENV_FILE="${ROOT_DIR}/.env.production"
REMOTE_DIR="/opt/blog-platform"
SSH_PORT="22"
IDENTITY_FILE=""
BOOTSTRAP=false
SKIP_MIGRATE=false
SKIP_INFRA=false
DRY_RUN=false
PULL_IMAGES=true
USE_EXISTING_ENV=false
SERVICES_CSV=""
SSH_CONNECT_TIMEOUT="${SSH_CONNECT_TIMEOUT:-15}"
SSH_SERVER_ALIVE_INTERVAL="${SSH_SERVER_ALIVE_INTERVAL:-15}"
SSH_SERVER_ALIVE_COUNT_MAX="${SSH_SERVER_ALIVE_COUNT_MAX:-3}"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deployment/deploy-remote-compose.sh --target user@host [options]

Options:
  --target USER@HOST      Remote SSH target
  --env-file PATH         Production env file to upload (default: .env.production)
  --remote-dir PATH       Remote release root (default: /opt/blog-platform)
  --ssh-port PORT         SSH port (default: 22)
  --identity-file PATH    SSH private key
  --bootstrap             Bootstrap Docker/Compose on the remote host first
  --skip-migrate          Skip the remote migration job
  --skip-infra            Reuse the existing remote infrastructure containers
  --services CSV          Restart only specific app services: api,worker,frontend,edge
  --use-existing-env      Reuse ${REMOTE_DIR}/shared/.env.production on the host
  --no-pull               Do not pull images before deploy
  --dry-run               Validate/package locally and print remote actions without executing SSH
  --help                  Show this help
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

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="$2"
      shift 2
      ;;
    --env-file)
      ENV_FILE="$2"
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
    --bootstrap)
      BOOTSTRAP=true
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
    --use-existing-env)
      USE_EXISTING_ENV=true
      shift
      ;;
    --no-pull)
      PULL_IMAGES=false
      shift
      ;;
    --dry-run)
      DRY_RUN=true
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

require_command tar
require_command ssh
require_command scp

if [[ "${USE_EXISTING_ENV}" != "true" ]]; then
  [[ -f "${ENV_FILE}" ]] || fail "env file not found: ${ENV_FILE}"
  bash "${ROOT_DIR}/scripts/deployment/validate-production-env.sh" "${ENV_FILE}"

  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a

  if [[ "${BACKEND_IMAGE:-}" == "blog-backend:local" || "${FRONTEND_IMAGE:-}" == "blog-frontend:local" ]]; then
    PULL_IMAGES=false
  fi
fi

package_root="$(mktemp -d)"
cleanup() {
  rm -rf "${package_root}"
}
trap cleanup EXIT

release_id="$(date -u +%Y%m%dT%H%M%SZ)"
runtime_root="${package_root}/runtime"

mkdir -p "${runtime_root}/scripts/deployment" "${runtime_root}/deployments"
cp "${ROOT_DIR}/docker-compose.production.yml" "${runtime_root}/docker-compose.production.yml"
cp "${ROOT_DIR}/scripts/deployment/deploy-compose-stack.sh" "${runtime_root}/scripts/deployment/deploy-compose-stack.sh"
cp "${ROOT_DIR}/scripts/deployment/validate-production-env.sh" "${runtime_root}/scripts/deployment/validate-production-env.sh"
cp -R "${ROOT_DIR}/deployments/nginx" "${runtime_root}/deployments/nginx"

archive_path="${package_root}/blog-platform-compose-${release_id}.tar.gz"
tar -czf "${archive_path}" -C "${runtime_root}" .

if [[ "${DRY_RUN}" == "true" ]]; then
  echo "[INFO] dry run package created: ${archive_path}"
  echo "[INFO] remote target: ${TARGET}"
  echo "[INFO] remote dir: ${REMOTE_DIR}"
  echo "[INFO] using existing env: ${USE_EXISTING_ENV}"
  echo "[INFO] pull images: ${PULL_IMAGES}"
  if [[ "${BOOTSTRAP}" == "true" ]]; then
    echo "[INFO] bootstrap would run before deployment"
  fi
  exit 0
fi

ssh_opts=(-p "${SSH_PORT}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
ssh_opts+=(
  -o ConnectTimeout="${SSH_CONNECT_TIMEOUT}"
  -o ServerAliveInterval="${SSH_SERVER_ALIVE_INTERVAL}"
  -o ServerAliveCountMax="${SSH_SERVER_ALIVE_COUNT_MAX}"
)
if [[ -n "${IDENTITY_FILE}" ]]; then
  ssh_opts+=(-i "${IDENTITY_FILE}")
fi

scp_opts=(-P "${SSH_PORT}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
scp_opts+=(-o ConnectTimeout="${SSH_CONNECT_TIMEOUT}")
if [[ -n "${IDENTITY_FILE}" ]]; then
  scp_opts+=(-i "${IDENTITY_FILE}")
fi

if [[ "${BOOTSTRAP}" == "true" ]]; then
  bootstrap_cmd=(
    bash "${ROOT_DIR}/scripts/deployment/bootstrap-remote-host.sh"
    --target "${TARGET}"
    --ssh-port "${SSH_PORT}"
  )
  if [[ -n "${IDENTITY_FILE}" ]]; then
    bootstrap_cmd+=(--identity-file "${IDENTITY_FILE}")
  fi
  "${bootstrap_cmd[@]}"
fi

remote_archive="/tmp/blog-platform-compose-${release_id}.tar.gz"

scp "${scp_opts[@]}" "${archive_path}" "${TARGET}:${remote_archive}"
remote_env=""
if [[ "${USE_EXISTING_ENV}" != "true" ]]; then
  remote_env="/tmp/blog-platform-compose-${release_id}.env"
  scp "${scp_opts[@]}" "${ENV_FILE}" "${TARGET}:${remote_env}"
fi

remote_skip_migrate="false"
if [[ "${SKIP_MIGRATE}" == "true" ]]; then
  remote_skip_migrate="true"
fi

remote_skip_infra="false"
if [[ "${SKIP_INFRA}" == "true" ]]; then
  remote_skip_infra="true"
fi

remote_pull_images="false"
if [[ "${PULL_IMAGES}" == "true" ]]; then
  remote_pull_images="true"
fi

ssh "${ssh_opts[@]}" "${TARGET}" \
  "REMOTE_DIR='${REMOTE_DIR}' RELEASE_ID='${release_id}' REMOTE_ARCHIVE='${remote_archive}' REMOTE_ENV='${remote_env}' SKIP_MIGRATE='${remote_skip_migrate}' SKIP_INFRA='${remote_skip_infra}' PULL_IMAGES='${remote_pull_images}' SERVICES_CSV='${SERVICES_CSV}' USE_EXISTING_ENV='${USE_EXISTING_ENV}' bash -s" <<'EOF'
set -euo pipefail

mkdir -p "${REMOTE_DIR}/releases/${RELEASE_ID}" "${REMOTE_DIR}/shared"
tar -xzf "${REMOTE_ARCHIVE}" -C "${REMOTE_DIR}/releases/${RELEASE_ID}"
if [[ "${USE_EXISTING_ENV}" == "true" ]]; then
  if [[ ! -f "${REMOTE_DIR}/shared/.env.production" ]]; then
    echo "error: existing remote env not found: ${REMOTE_DIR}/shared/.env.production" >&2
    exit 1
  fi
else
  mv "${REMOTE_ENV}" "${REMOTE_DIR}/shared/.env.production"
fi
ln -sfn "${REMOTE_DIR}/releases/${RELEASE_ID}" "${REMOTE_DIR}/current"
rm -f "${REMOTE_ARCHIVE}"

cd "${REMOTE_DIR}/current"
deploy_cmd=(bash scripts/deployment/deploy-compose-stack.sh --env-file "${REMOTE_DIR}/shared/.env.production")
if [[ "${PULL_IMAGES}" == "true" ]]; then
  deploy_cmd+=(--pull)
fi
if [[ "${SKIP_MIGRATE}" == "true" ]]; then
  deploy_cmd+=(--skip-migrate)
fi
if [[ "${SKIP_INFRA}" == "true" ]]; then
  deploy_cmd+=(--skip-infra)
fi
if [[ -n "${SERVICES_CSV}" ]]; then
  deploy_cmd+=(--services "${SERVICES_CSV}")
fi
"${deploy_cmd[@]}"
EOF

echo "[OK] remote compose deployment completed: ${TARGET}"
echo "[INFO] release id: ${release_id}"
