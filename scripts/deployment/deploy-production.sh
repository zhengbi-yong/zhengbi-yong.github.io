#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET="${1:-}"
REMOTE_DIR="${2:-~/zhengbi-yong.github.io}"

usage() {
  cat <<'EOF'
Usage: bash scripts/deployment/deploy-production.sh <user@host> [remote-repo-dir]

This compatibility wrapper assumes the repository already exists on the target host.
EOF
}

if [[ -z "${TARGET}" ]]; then
  usage
  exit 1
fi

if [[ ! -f "${ROOT_DIR}/.env.production" ]]; then
  echo "[ERROR] ${ROOT_DIR}/.env.production is required" >&2
  exit 1
fi

echo "[WARN] scripts/deployment/deploy-production.sh is deprecated."
echo "[INFO] Copying .env.production to ${TARGET}:${REMOTE_DIR} and delegating to deploy-compose-stack.sh"

ssh "${TARGET}" "mkdir -p ${REMOTE_DIR}"
scp "${ROOT_DIR}/.env.production" "${TARGET}:${REMOTE_DIR}/.env.production"
ssh "${TARGET}" "cd ${REMOTE_DIR} && bash scripts/deployment/deploy-compose-stack.sh --env-file .env.production --pull"
