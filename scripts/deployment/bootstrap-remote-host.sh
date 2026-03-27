#!/usr/bin/env bash

set -euo pipefail

TARGET=""
SSH_PORT="22"
IDENTITY_FILE=""
CONFIGURE_FIREWALL=false
ALLOW_PORTS=()
SSH_CONNECT_TIMEOUT="${SSH_CONNECT_TIMEOUT:-15}"
SSH_SERVER_ALIVE_INTERVAL="${SSH_SERVER_ALIVE_INTERVAL:-15}"
SSH_SERVER_ALIVE_COUNT_MAX="${SSH_SERVER_ALIVE_COUNT_MAX:-3}"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deployment/bootstrap-remote-host.sh --target user@host [options]

Options:
  --target USER@HOST      Remote SSH target
  --ssh-port PORT         SSH port (default: 22)
  --identity-file PATH    SSH private key
  --configure-firewall    Open ports 22, 80, 443 with ufw if available
  --allow-port SPEC       Additional firewall rule, e.g. 8080/tcp (repeatable)
  --help                  Show this help
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
    --ssh-port)
      SSH_PORT="$2"
      shift 2
      ;;
    --identity-file)
      IDENTITY_FILE="$2"
      shift 2
      ;;
    --configure-firewall)
      CONFIGURE_FIREWALL=true
      shift
      ;;
    --allow-port)
      ALLOW_PORTS+=("$2")
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

ssh_opts=(-p "${SSH_PORT}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
ssh_opts+=(
  -o ConnectTimeout="${SSH_CONNECT_TIMEOUT}"
  -o ServerAliveInterval="${SSH_SERVER_ALIVE_INTERVAL}"
  -o ServerAliveCountMax="${SSH_SERVER_ALIVE_COUNT_MAX}"
)
if [[ -n "${IDENTITY_FILE}" ]]; then
  ssh_opts+=(-i "${IDENTITY_FILE}")
fi

remote_firewall_flag="false"
if [[ "${CONFIGURE_FIREWALL}" == "true" ]]; then
  remote_firewall_flag="true"
fi

allowed_ports_csv=""
if [[ ${#ALLOW_PORTS[@]} -gt 0 ]]; then
  allowed_ports_csv="$(IFS=,; printf '%s' "${ALLOW_PORTS[*]}")"
fi

ssh "${ssh_opts[@]}" "${TARGET}" "CONFIGURE_FIREWALL='${remote_firewall_flag}' ALLOWED_PORTS_CSV='${allowed_ports_csv}' bash -s" <<'EOF'
set -euo pipefail

if [[ "$(id -u)" -eq 0 ]]; then
  SUDO=""
elif sudo -n true >/dev/null 2>&1; then
  SUDO="sudo"
else
  echo "error: remote user needs root or passwordless sudo" >&2
  exit 1
fi

if [[ -r /etc/os-release ]]; then
  . /etc/os-release
else
  echo "error: unsupported remote OS" >&2
  exit 1
fi

case "${ID:-}" in
  ubuntu|debian) ;;
  *)
    echo "error: bootstrap currently supports Ubuntu/Debian only" >&2
    exit 1
    ;;
esac

export DEBIAN_FRONTEND=noninteractive

run_apt_update() {
  local output status

  set +e
  output="$(${SUDO} apt-get update -y 2>&1)"
  status=$?
  set -e

  printf '%s\n' "${output}"

  if grep -Eq 'NO_PUBKEY|The repository .* is not signed|Failed to fetch' <<< "${output}"; then
    echo "[WARN] apt-get update reported repository issues under /etc/apt/sources.list.d/." >&2
  fi

  return "${status}"
}

run_apt_update
${SUDO} apt-get install -y ca-certificates curl gnupg lsb-release pigz rsync

if ! command -v docker >/dev/null 2>&1; then
  ${SUDO} install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/${ID}/gpg | ${SUDO} gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  ${SUDO} chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" \
    | ${SUDO} tee /etc/apt/sources.list.d/docker.list >/dev/null
  run_apt_update
  ${SUDO} apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

${SUDO} systemctl enable --now docker

remote_user="$(id -un)"
if ! id -nG "${remote_user}" | tr ' ' '\n' | grep -qx docker; then
  ${SUDO} usermod -aG docker "${remote_user}"
fi

if [[ "${CONFIGURE_FIREWALL}" == "true" ]]; then
  if ! command -v ufw >/dev/null 2>&1; then
    ${SUDO} apt-get install -y ufw
  fi

  allowed_ports=("80/tcp" "443/tcp")
  if [[ -n "${ALLOWED_PORTS_CSV:-}" ]]; then
    IFS=',' read -r -a extra_ports <<< "${ALLOWED_PORTS_CSV}"
    allowed_ports+=("${extra_ports[@]}")
  fi

  ${SUDO} ufw allow 22/tcp
  for port_rule in "${allowed_ports[@]}"; do
    [[ -n "${port_rule}" ]] || continue
    ${SUDO} ufw allow "${port_rule}"
  done
  ${SUDO} ufw --force enable
fi

docker --version
docker compose version
EOF

echo "[OK] remote bootstrap completed: ${TARGET}"
