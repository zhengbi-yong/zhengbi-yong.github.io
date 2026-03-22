#!/usr/bin/env bash

set -euo pipefail

TARGET=""
SSH_PORT="22"
IDENTITY_FILE=""
DOCKER_CMD="${DOCKER_CMD:-docker}"
IMAGES=()

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deployment/stream-local-images.sh --target user@host [options]

Options:
  --target USER@HOST      Remote SSH target
  --image NAME            Local image to stream (repeatable)
  --ssh-port PORT         SSH port (default: 22)
  --identity-file PATH    SSH private key
  --help                  Show this help

Default images:
  blog-backend:local
  blog-frontend:local
EOF
}

fail() {
  echo "error: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="$2"
      shift 2
      ;;
    --image)
      IMAGES+=("$2")
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

if [[ ${#IMAGES[@]} -eq 0 ]]; then
  IMAGES=("blog-backend:local" "blog-frontend:local")
fi

if ! command -v "${DOCKER_CMD}" >/dev/null 2>&1; then
  fail "missing docker command: ${DOCKER_CMD}"
fi
command -v ssh >/dev/null 2>&1 || fail "missing required command: ssh"
command -v gzip >/dev/null 2>&1 || fail "missing required command: gzip"
command -v gunzip >/dev/null 2>&1 || fail "missing required command: gunzip"

for image in "${IMAGES[@]}"; do
  if ! "${DOCKER_CMD}" image inspect "${image}" >/dev/null 2>&1; then
    fail "local image not found: ${image}"
  fi
done

ssh_opts=(-p "${SSH_PORT}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [[ -n "${IDENTITY_FILE}" ]]; then
  ssh_opts+=(-i "${IDENTITY_FILE}")
fi

echo "[INFO] Streaming images to ${TARGET}: ${IMAGES[*]}"
"${DOCKER_CMD}" save "${IMAGES[@]}" | gzip -1 | ssh "${ssh_opts[@]}" "${TARGET}" 'gunzip | docker load'
echo "[OK] remote image load completed"
