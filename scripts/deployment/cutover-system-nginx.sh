#!/usr/bin/env bash

set -euo pipefail

TARGET=""
SSH_PORT="22"
IDENTITY_FILE=""
REMOTE_DIR="/opt/blog-platform"
MANAGED_SITE_NAME="blog-platform"
SITE_URL=""
UPSTREAM_URL=""
TLS_CERT_HOST=""
MODE="auto"
VERIFY_PATH="/readyz"
SKIP_HEALTHCHECK=false
EXTRA_SERVER_NAMES=()

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deployment/cutover-system-nginx.sh --target user@host [options]

Safely switch the host's system nginx to proxy public traffic to a Compose edge
running on the same machine. The script creates a timestamped backup before it
changes any nginx files.

Options:
  --target USER@HOST         Remote SSH target
  --remote-dir PATH          Remote release root (default: /opt/blog-platform)
  --ssh-port PORT            SSH port (default: 22)
  --identity-file PATH       SSH private key
  --managed-site-name NAME   Name of the generated nginx site (default: blog-platform)
  --site-url URL             Public site URL; if omitted, derive from existing nginx
  --upstream-url URL         Upstream proxy target (default: http://127.0.0.1:$EDGE_HTTP_PORT)
  --server-name HOST         Extra server_name entry (repeatable)
  --tls-cert-host HOST       Directory name under /etc/letsencrypt/live/
  --mode auto|http|https     Nginx frontend mode (default: auto)
  --verify-path PATH         Health path to check after cutover (default: /readyz)
  --skip-healthcheck         Reload nginx without post-cutover curl verification
  --help                     Show this help
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
    --ssh-port)
      SSH_PORT="$2"
      shift 2
      ;;
    --identity-file)
      IDENTITY_FILE="$2"
      shift 2
      ;;
    --managed-site-name)
      MANAGED_SITE_NAME="$2"
      shift 2
      ;;
    --site-url)
      SITE_URL="$2"
      shift 2
      ;;
    --upstream-url)
      UPSTREAM_URL="$2"
      shift 2
      ;;
    --server-name)
      EXTRA_SERVER_NAMES+=("$2")
      shift 2
      ;;
    --tls-cert-host)
      TLS_CERT_HOST="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    --verify-path)
      VERIFY_PATH="$2"
      shift 2
      ;;
    --skip-healthcheck)
      SKIP_HEALTHCHECK=true
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

case "${MODE}" in
  auto|http|https) ;;
  *) fail "--mode must be auto, http, or https" ;;
esac

ssh_opts=(-p "${SSH_PORT}" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [[ -n "${IDENTITY_FILE}" ]]; then
  ssh_opts+=(-i "${IDENTITY_FILE}")
fi

target_host="${TARGET#*@}"
target_host="${target_host%%:*}"

extra_server_names_csv=""
if [[ ${#EXTRA_SERVER_NAMES[@]} -gt 0 ]]; then
  extra_server_names_csv="$(IFS=,; printf '%s' "${EXTRA_SERVER_NAMES[*]}")"
fi

remote_skip_healthcheck="false"
if [[ "${SKIP_HEALTHCHECK}" == "true" ]]; then
  remote_skip_healthcheck="true"
fi

ssh "${ssh_opts[@]}" "${TARGET}" \
  "REMOTE_DIR='${REMOTE_DIR}' MANAGED_SITE_NAME='${MANAGED_SITE_NAME}' REQUESTED_SITE_URL='${SITE_URL}' REQUESTED_UPSTREAM_URL='${UPSTREAM_URL}' REQUESTED_TLS_CERT_HOST='${TLS_CERT_HOST}' REQUESTED_MODE='${MODE}' REQUESTED_VERIFY_PATH='${VERIFY_PATH}' REQUESTED_EXTRA_SERVER_NAMES='${extra_server_names_csv}' TARGET_HOST_FALLBACK='${target_host}' SKIP_HEALTHCHECK='${remote_skip_healthcheck}' bash -s" <<'EOF'
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

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s\n' "${value}"
}

normalize_server_name_line() {
  local line="$1"
  local names

  line="${line%%#*}"
  line="$(trim "${line}")"
  names="${line#server_name}"
  names="${names%%;*}"
  trim "${names}"
}

unique_push() {
  local candidate="$1"
  local existing

  [[ -n "${candidate}" ]] || return 0

  for existing in "${SERVER_NAMES[@]}"; do
    if [[ "${existing}" == "${candidate}" ]]; then
      return 0
    fi
  done

  SERVER_NAMES+=("${candidate}")
}

is_ipv4() {
  local value="$1"

  [[ "${value}" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]
}

extract_server_names() {
  local file="$1"
  local line token names

  while IFS= read -r line; do
    line="$(trim "${line}")"
    [[ "${line}" == server_name* ]] || continue

    names="$(normalize_server_name_line "${line}")"

    for token in ${names}; do
      unique_push "${token}"
    done
  done < "${file}"
}

site_matches_server_name() {
  local file="$1"
  local line token names wanted

  while IFS= read -r line; do
    line="$(trim "${line}")"
    [[ "${line}" == server_name* ]] || continue

    names="$(normalize_server_name_line "${line}")"

    for token in ${names}; do
      for wanted in "${SERVER_NAMES[@]}"; do
        if [[ "${token}" == "${wanted}" ]]; then
          return 0
        fi
      done
    done
  done < "${file}"

  return 1
}

render_http_proxy_block() {
  cat <<CONFIG
    location / {
        proxy_pass ${UPSTREAM_URL};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Request-Id \$request_id;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        client_max_body_size 32m;
    }
CONFIG
}

render_managed_site() {
  local server_name_line="$1"
  local acme_root="$2"

  if [[ "${NGINX_MODE}" == "https" ]]; then
    cat <<CONFIG
server {
    listen 80;
    server_name ${server_name_line};

    location /.well-known/acme-challenge/ {
        root ${acme_root};
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${server_name_line};

    ssl_certificate /etc/letsencrypt/live/${TLS_CERT_HOST}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${TLS_CERT_HOST}/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/${TLS_CERT_HOST}/chain.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozSSL:10m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

$(render_http_proxy_block)
}
CONFIG
    return
  fi

  cat <<CONFIG
server {
    listen 80;
    server_name ${server_name_line};

    location /.well-known/acme-challenge/ {
        root ${acme_root};
    }

$(render_http_proxy_block)
}
CONFIG
}

SUDO="$(require_sudo)"

if ! command -v nginx >/dev/null 2>&1; then
  fail "system nginx is not installed on the remote host"
fi

env_file="${REMOTE_DIR}/shared/.env.production"
if [[ -f "${env_file}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${env_file}"
  set +a
fi

UPSTREAM_URL="${REQUESTED_UPSTREAM_URL:-http://127.0.0.1:${EDGE_HTTP_PORT:-80}}"
VERIFY_PATH="${REQUESTED_VERIFY_PATH:-/readyz}"
REQUESTED_SITE_URL="${REQUESTED_SITE_URL:-}"
REQUESTED_MODE="${REQUESTED_MODE:-auto}"
REQUESTED_TLS_CERT_HOST="${REQUESTED_TLS_CERT_HOST:-}"
TARGET_HOST_FALLBACK="${TARGET_HOST_FALLBACK:-}"

SERVER_NAMES=()

if [[ -n "${REQUESTED_SITE_URL}" ]]; then
  site_host="${REQUESTED_SITE_URL#http://}"
  site_host="${site_host#https://}"
  site_host="${site_host%%/*}"
  site_host="${site_host%%:*}"
  unique_push "${site_host}"
fi

if [[ -n "${REQUESTED_EXTRA_SERVER_NAMES:-}" ]]; then
  IFS=',' read -r -a extra_names <<< "${REQUESTED_EXTRA_SERVER_NAMES}"
  for extra_name in "${extra_names[@]}"; do
    unique_push "${extra_name}"
  done
fi

existing_tls_site=""
existing_any_site=""
for enabled_path in /etc/nginx/sites-enabled/*; do
  [[ -e "${enabled_path}" ]] || continue
  resolved_path="$(readlink -f "${enabled_path}")"
  [[ -f "${resolved_path}" ]] || continue
  if [[ -z "${existing_any_site}" ]]; then
    existing_any_site="${resolved_path}"
  fi
  if grep -q 'ssl_certificate /etc/letsencrypt/live/' "${resolved_path}"; then
    existing_tls_site="${resolved_path}"
    break
  fi
done

if [[ ${#SERVER_NAMES[@]} -eq 0 && -n "${existing_tls_site}" ]]; then
  extract_server_names "${existing_tls_site}"
elif [[ ${#SERVER_NAMES[@]} -eq 0 && -n "${existing_any_site}" ]]; then
  extract_server_names "${existing_any_site}"
fi

if [[ -z "${REQUESTED_TLS_CERT_HOST}" && -n "${existing_tls_site}" ]]; then
  REQUESTED_TLS_CERT_HOST="$(sed -n 's#.*ssl_certificate /etc/letsencrypt/live/\([^/]*\)/fullchain.pem;#\1#p' "${existing_tls_site}" | head -n1)"
fi

if [[ -z "${REQUESTED_TLS_CERT_HOST}" ]]; then
  for candidate_name in "${SERVER_NAMES[@]}"; do
    if [[ "${candidate_name}" != *:* ]] && ! is_ipv4 "${candidate_name}"; then
      REQUESTED_TLS_CERT_HOST="${candidate_name}"
      break
    fi
  done
fi

if [[ -n "${TARGET_HOST_FALLBACK}" ]]; then
  unique_push "${TARGET_HOST_FALLBACK}"
fi

if [[ ${#SERVER_NAMES[@]} -eq 0 ]]; then
  fail "could not derive any nginx server_name values; pass --site-url or --server-name"
fi

NGINX_MODE="http"
if [[ "${REQUESTED_MODE}" == "https" ]]; then
  NGINX_MODE="https"
elif [[ "${REQUESTED_MODE}" == "auto" ]]; then
  if [[ -n "${REQUESTED_TLS_CERT_HOST}" ]]; then
    NGINX_MODE="https"
  elif [[ -n "${REQUESTED_SITE_URL}" && "${REQUESTED_SITE_URL}" == https://* ]]; then
    NGINX_MODE="https"
  fi
fi

TLS_CERT_HOST="${REQUESTED_TLS_CERT_HOST}"
if [[ "${NGINX_MODE}" == "https" ]]; then
  [[ -n "${TLS_CERT_HOST}" ]] || fail "TLS mode requires --tls-cert-host or an existing letsencrypt config"
  for cert_file in fullchain.pem privkey.pem chain.pem; do
    if ! ${SUDO} test -f "/etc/letsencrypt/live/${TLS_CERT_HOST}/${cert_file}"; then
      fail "missing /etc/letsencrypt/live/${TLS_CERT_HOST}/${cert_file}"
    fi
  done
fi

health_url="${UPSTREAM_URL%/}${VERIFY_PATH}"
health_code="$(curl -sS -o /tmp/blog-platform-cutover-upstream.out -w '%{http_code}' "${health_url}" || true)"
if [[ "${health_code}" != "200" ]]; then
  fail "upstream health check failed (${health_code}) at ${health_url}"
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_root="${REMOTE_DIR}/shared/system-nginx-backups/${timestamp}"
managed_site_path="/etc/nginx/sites-available/${MANAGED_SITE_NAME}"

mkdir -p "${backup_root}/enabled-sites" "${backup_root}/metadata"

{
  printf 'managed_site_name=%s\n' "${MANAGED_SITE_NAME}"
  printf 'upstream_url=%s\n' "${UPSTREAM_URL}"
  printf 'mode=%s\n' "${NGINX_MODE}"
  printf 'verify_path=%s\n' "${VERIFY_PATH}"
  printf 'server_names=%s\n' "${SERVER_NAMES[*]}"
} > "${backup_root}/metadata/cutover.env"

if [[ -f "${managed_site_path}" ]]; then
  ${SUDO} cp "${managed_site_path}" "${backup_root}/metadata/preexisting-managed-site.conf"
fi

enabled_manifest="${backup_root}/metadata/enabled-sites.tsv"
: > "${enabled_manifest}"

for enabled_path in /etc/nginx/sites-enabled/*; do
  [[ -e "${enabled_path}" ]] || continue
  site_name="$(basename "${enabled_path}")"
  resolved_path="$(readlink -f "${enabled_path}")"
  printf '%s\t%s\n' "${site_name}" "${resolved_path}" >> "${enabled_manifest}"
  if [[ -f "${resolved_path}" ]]; then
    ${SUDO} cp "${resolved_path}" "${backup_root}/enabled-sites/${site_name}.conf"
  fi
done

server_name_line="$(printf '%s ' "${SERVER_NAMES[@]}")"
server_name_line="$(trim "${server_name_line}")"
managed_config="$(render_managed_site "${server_name_line}" "/var/www/html")"
printf '%s\n' "${managed_config}" | ${SUDO} tee "${managed_site_path}" >/dev/null

disabled_sites=()
for enabled_path in /etc/nginx/sites-enabled/*; do
  [[ -e "${enabled_path}" ]] || continue
  site_name="$(basename "${enabled_path}")"
  resolved_path="$(readlink -f "${enabled_path}")"
  [[ -f "${resolved_path}" ]] || continue

  if [[ "${site_name}" == "${MANAGED_SITE_NAME}" ]]; then
    continue
  fi

  if site_matches_server_name "${resolved_path}"; then
    disabled_sites+=("${site_name}")
    ${SUDO} rm -f "${enabled_path}"
  fi
done

printf '%s\n' "${disabled_sites[@]:-}" > "${backup_root}/metadata/disabled-sites.txt"
${SUDO} ln -sfn "${managed_site_path}" "/etc/nginx/sites-enabled/${MANAGED_SITE_NAME}"

${SUDO} nginx -t
${SUDO} systemctl reload nginx

if [[ "${SKIP_HEALTHCHECK:-false}" != "true" ]]; then
  public_scheme="http"
  curl_args=(-sS -o /tmp/blog-platform-cutover-public.out -w '%{http_code}' -H "Host: ${SERVER_NAMES[0]}")
  if [[ "${NGINX_MODE}" == "https" ]]; then
    public_scheme="https"
    curl_args=(-k "${curl_args[@]}")
  fi

  public_code="$(curl "${curl_args[@]}" "${public_scheme}://127.0.0.1${VERIFY_PATH}" || true)"
  if [[ "${public_code}" != "200" ]]; then
    fail "public cutover health check failed (${public_code}) at ${public_scheme}://127.0.0.1${VERIFY_PATH}"
  fi
fi

echo "[OK] system nginx now proxies to ${UPSTREAM_URL}"
echo "[INFO] backup: ${backup_root}"
echo "[INFO] mode: ${NGINX_MODE}"
echo "[INFO] server_names: ${SERVER_NAMES[*]}"
EOF

echo "[OK] system nginx cutover completed: ${TARGET}"
