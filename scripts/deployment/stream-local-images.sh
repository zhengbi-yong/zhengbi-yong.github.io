#!/usr/bin/env bash

set -euo pipefail

TARGET=""
SSH_PORT="22"
IDENTITY_FILE=""
DOCKER_CMD="${DOCKER_CMD:-docker}"
IMAGES=()
CHANGED_OUTPUT=""
SSH_CONNECT_TIMEOUT="${SSH_CONNECT_TIMEOUT:-15}"
SSH_SERVER_ALIVE_INTERVAL="${SSH_SERVER_ALIVE_INTERVAL:-15}"
SSH_SERVER_ALIVE_COUNT_MAX="${SSH_SERVER_ALIVE_COUNT_MAX:-3}"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deployment/stream-local-images.sh --target user@host [options]

Options:
  --target USER@HOST      Remote SSH target
  --image NAME            Local image to stream (repeatable)
  --ssh-port PORT         SSH port (default: 22)
  --identity-file PATH    SSH private key
  --changed-output PATH   Write changed image names here, one per line
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
    --changed-output)
      CHANGED_OUTPUT="$2"
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
ssh_opts+=(
  -o ConnectTimeout="${SSH_CONNECT_TIMEOUT}"
  -o ServerAliveInterval="${SSH_SERVER_ALIVE_INTERVAL}"
  -o ServerAliveCountMax="${SSH_SERVER_ALIVE_COUNT_MAX}"
)
if [[ -n "${IDENTITY_FILE}" ]]; then
  ssh_opts+=(-i "${IDENTITY_FILE}")
fi

if [[ -n "${CHANGED_OUTPUT}" ]]; then
  mkdir -p "$(dirname "${CHANGED_OUTPUT}")"
  : > "${CHANGED_OUTPUT}"
fi

local_pack_cmd=(gzip -1)
if command -v pigz >/dev/null 2>&1; then
  local_pack_cmd=(pigz -1)
fi

remote_unpack_cmd='gunzip | docker load'
if ssh "${ssh_opts[@]}" "${TARGET}" 'command -v pigz >/dev/null 2>&1'; then
  remote_unpack_cmd='pigz -d | docker load'
fi

changed_images=()

for image in "${IMAGES[@]}"; do
  local_id="$("${DOCKER_CMD}" image inspect "${image}" --format '{{.Id}}')"
  remote_id="$(ssh "${ssh_opts[@]}" "${TARGET}" "docker image inspect --format '{{.Id}}' '${image}' 2>/dev/null || true")"
  remote_id="${remote_id//$'\r'/}"

  if [[ -n "${remote_id}" && "${remote_id}" == "${local_id}" ]]; then
    echo "[INFO] Skipping unchanged image: ${image}"
    continue
  fi

  echo "[INFO] Streaming updated image to ${TARGET}: ${image}"
  "${DOCKER_CMD}" save "${image}" | "${local_pack_cmd[@]}" | ssh "${ssh_opts[@]}" "${TARGET}" "${remote_unpack_cmd}"
  changed_images+=("${image}")

  if [[ -n "${CHANGED_OUTPUT}" ]]; then
    printf '%s\n' "${image}" >> "${CHANGED_OUTPUT}"
  fi
done

if [[ ${#changed_images[@]} -eq 0 ]]; then
  echo "[OK] remote already has all requested images"
else
  echo "[OK] remote image load completed for: ${changed_images[*]}"
fi
