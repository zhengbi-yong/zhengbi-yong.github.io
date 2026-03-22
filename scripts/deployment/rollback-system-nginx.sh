#!/usr/bin/env bash

set -euo pipefail

TARGET=""
SSH_PORT="22"
IDENTITY_FILE=""
REMOTE_DIR="/opt/blog-platform"
BACKUP_PATH=""

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deployment/rollback-system-nginx.sh --target user@host [options]

Restore the system nginx configuration from a backup created by
cutover-system-nginx.sh.

Options:
  --target USER@HOST      Remote SSH target
  --remote-dir PATH       Remote release root (default: /opt/blog-platform)
  --backup-path PATH      Explicit remote backup path; defaults to the latest backup
  --ssh-port PORT         SSH port (default: 22)
  --identity-file PATH    SSH private key
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
    --remote-dir)
      REMOTE_DIR="$2"
      shift 2
      ;;
    --backup-path)
      BACKUP_PATH="$2"
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

ssh_opts=(-p "${SSH_PORT}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [[ -n "${IDENTITY_FILE}" ]]; then
  ssh_opts+=(-i "${IDENTITY_FILE}")
fi

ssh "${ssh_opts[@]}" "${TARGET}" \
  "REMOTE_DIR='${REMOTE_DIR}' REQUESTED_BACKUP_PATH='${BACKUP_PATH}' bash -s" <<'EOF'
set -euo pipefail

fail() {
  echo "error: $*" >&2
  exit 1
}

require_sudo() {
  if [[ "$(id -u)" -eq 0 ]]; then
    printf '%s\n' ""
    return
  fi

  if sudo -n true >/dev/null 2>&1; then
    printf '%s\n' "sudo"
    return
  fi

  fail "remote user needs root or passwordless sudo"
}

SUDO="$(require_sudo)"
backups_root="${REMOTE_DIR}/shared/system-nginx-backups"
backup_path="${REQUESTED_BACKUP_PATH:-}"

if [[ -z "${backup_path}" ]]; then
  [[ -d "${backups_root}" ]] || fail "no cutover backups found under ${backups_root}"
  backup_path="$(find "${backups_root}" -mindepth 1 -maxdepth 1 -type d | sort | tail -n1)"
fi

[[ -d "${backup_path}" ]] || fail "backup path not found: ${backup_path}"
[[ -f "${backup_path}/metadata/cutover.env" ]] || fail "missing backup metadata in ${backup_path}"
[[ -f "${backup_path}/metadata/enabled-sites.tsv" ]] || fail "missing enabled-sites manifest in ${backup_path}"

set -a
# shellcheck disable=SC1090
source "${backup_path}/metadata/cutover.env"
set +a

managed_site_name="${managed_site_name:-blog-platform}"
managed_site_path="/etc/nginx/sites-available/${managed_site_name}"
managed_site_enabled="/etc/nginx/sites-enabled/${managed_site_name}"

if [[ -L "${managed_site_enabled}" || -f "${managed_site_enabled}" ]]; then
  ${SUDO} rm -f "${managed_site_enabled}"
fi

if [[ -f "${backup_path}/metadata/preexisting-managed-site.conf" ]]; then
  ${SUDO} cp "${backup_path}/metadata/preexisting-managed-site.conf" "${managed_site_path}"
else
  ${SUDO} rm -f "${managed_site_path}"
fi

while IFS=$'\t' read -r site_name target_path; do
  [[ -n "${site_name}" ]] || continue
  backup_file="${backup_path}/enabled-sites/${site_name}.conf"

  if [[ -f "${backup_file}" ]]; then
    ${SUDO} mkdir -p "$(dirname "${target_path}")"
    ${SUDO} cp "${backup_file}" "${target_path}"
  fi

  ${SUDO} ln -sfn "${target_path}" "/etc/nginx/sites-enabled/${site_name}"
done < "${backup_path}/metadata/enabled-sites.tsv"

${SUDO} nginx -t
${SUDO} systemctl reload nginx

echo "[OK] system nginx restored from backup: ${backup_path}"
EOF

echo "[OK] system nginx rollback completed: ${TARGET}"
