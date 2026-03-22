#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.production"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "[ERROR] ${ENV_FILE} is required" >&2
  echo "[INFO] Copy .env.production.example to .env.production and fill in real secrets first." >&2
  exit 1
fi

echo "[WARN] scripts/deployment/deploy-docker.sh is deprecated."
echo "[INFO] Delegating to the canonical production Compose stack with local image builds."

exec bash "${ROOT_DIR}/scripts/deployment/deploy-compose-stack.sh" \
  --env-file "${ENV_FILE}" \
  --build \
  "$@"
