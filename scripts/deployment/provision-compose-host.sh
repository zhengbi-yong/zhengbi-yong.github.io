#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET=""
PUBLIC_HOST=""
SITE_URL=""
SCHEME="http"
RELEASE_VERSION=""
REGISTRY="ghcr.io"
REPOSITORY=""
REMOTE_DIR="/opt/blog-platform"
SSH_PORT="22"
IDENTITY_FILE=""
SMTP_MODE="mailpit"
ENABLE_BUNDLED_MEILISEARCH=false
ENABLE_BUNDLED_MINIO=false
ENABLE_BUNDLED_MAILPIT=true
DRY_RUN=false
IMAGE_SOURCE="registry"
SKIP_LOCAL_BUILD=false
CONFIGURE_FIREWALL=false
CUTOVER_SYSTEM_NGINX=false
COMPOSE_PROJECT_NAME_VALUE=""
LOCAL_FRONTEND_IGNORE_BUILD_ERRORS="${NEXT_IGNORE_BUILD_ERRORS:-1}"
LOCAL_FRONTEND_IGNORE_ESLINT="${NEXT_IGNORE_ESLINT:-1}"
EXTRA_ENV_OVERRIDES=()

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deployment/provision-compose-host.sh --target user@host [options]

This is the lowest-friction path for a single-host deployment. It:
1. generates a production env file with secure random secrets
2. bootstraps Docker + Compose on the remote host
3. optionally builds local images and streams them to the host
4. uploads the runtime package and deploys the Compose stack

Options:
  --target USER@HOST               Remote SSH target
  --public-host HOST               Public host/IP used for NEXT_PUBLIC_SITE_URL
  --site-url URL                   Full site URL; overrides --public-host/--scheme
  --scheme http|https              URL scheme when deriving the site URL (default: http)
  --release-version VERSION        Release version for derived image tags
  --repository OWNER/REPO          OCI repository path
  --registry HOST                  OCI registry host (default: ghcr.io)
  --remote-dir PATH                Remote install root (default: /opt/blog-platform)
  --ssh-port PORT                  SSH port (default: 22)
  --identity-file PATH             SSH private key
  --smtp-mode external|mailpit     SMTP profile (default: mailpit)
  --image-source registry|local    Pull from registry or stream local images (default: registry)
  --skip-local-build               Skip local docker builds in --image-source local mode
  --configure-firewall             Open ufw rules for the edge port on the remote host
  --cutover-system-nginx           After deploy, switch host nginx to the new Compose edge
  --compose-project-name NAME      Override COMPOSE_PROJECT_NAME in the generated env
  --set-env KEY=VALUE              Override any generated env key (repeatable)
  --frontend-ignore-build-errors 0|1
                                   Local mode only; defaults to 1 for the current repo
  --frontend-ignore-eslint 0|1     Local mode only; defaults to 1 for the current repo
  --enable-bundled-meilisearch     Start bundled Meilisearch on the target host
  --enable-bundled-minio           Start bundled MinIO on the target host
  --enable-bundled-mailpit         Start bundled Mailpit on the target host
  --dry-run                        Generate env/package locally, but do not SSH
  --help                           Show this help
EOF
}

fail() {
  echo "error: $*" >&2
  exit 1
}

derive_from_target() {
  local host
  host="${TARGET#*@}"
  host="${host%%:*}"
  if [[ -z "${PUBLIC_HOST}" && -z "${SITE_URL}" ]]; then
    PUBLIC_HOST="${host}"
  fi
}

get_env_override() {
  local key="$1"
  local override

  for override in "${EXTRA_ENV_OVERRIDES[@]}"; do
    if [[ "${override%%=*}" == "${key}" ]]; then
      printf '%s\n' "${override#*=}"
      return 0
    fi
  done

  return 1
}

build_local_images() {
  echo "[INFO] Building local production images"
  echo "[WARN] Local frontend build workarounds: NEXT_IGNORE_BUILD_ERRORS=${LOCAL_FRONTEND_IGNORE_BUILD_ERRORS}, NEXT_IGNORE_ESLINT=${LOCAL_FRONTEND_IGNORE_ESLINT}"

  env \
    NEXT_IGNORE_BUILD_ERRORS="${LOCAL_FRONTEND_IGNORE_BUILD_ERRORS}" \
    NEXT_IGNORE_ESLINT="${LOCAL_FRONTEND_IGNORE_ESLINT}" \
    bash "${ROOT_DIR}/scripts/deployment/build-all.sh"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="$2"
      shift 2
      ;;
    --public-host)
      PUBLIC_HOST="$2"
      shift 2
      ;;
    --site-url)
      SITE_URL="$2"
      shift 2
      ;;
    --scheme)
      SCHEME="$2"
      shift 2
      ;;
    --release-version)
      RELEASE_VERSION="$2"
      shift 2
      ;;
    --repository)
      REPOSITORY="$2"
      shift 2
      ;;
    --registry)
      REGISTRY="$2"
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
    --smtp-mode)
      SMTP_MODE="$2"
      shift 2
      ;;
    --image-source)
      IMAGE_SOURCE="$2"
      shift 2
      ;;
    --skip-local-build)
      SKIP_LOCAL_BUILD=true
      shift
      ;;
    --configure-firewall)
      CONFIGURE_FIREWALL=true
      shift
      ;;
    --cutover-system-nginx)
      CUTOVER_SYSTEM_NGINX=true
      shift
      ;;
    --compose-project-name)
      COMPOSE_PROJECT_NAME_VALUE="$2"
      shift 2
      ;;
    --set-env)
      EXTRA_ENV_OVERRIDES+=("$2")
      shift 2
      ;;
    --frontend-ignore-build-errors)
      LOCAL_FRONTEND_IGNORE_BUILD_ERRORS="$2"
      shift 2
      ;;
    --frontend-ignore-eslint)
      LOCAL_FRONTEND_IGNORE_ESLINT="$2"
      shift 2
      ;;
    --enable-bundled-meilisearch)
      ENABLE_BUNDLED_MEILISEARCH=true
      shift
      ;;
    --enable-bundled-minio)
      ENABLE_BUNDLED_MINIO=true
      shift
      ;;
    --enable-bundled-mailpit)
      ENABLE_BUNDLED_MAILPIT=true
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

case "${IMAGE_SOURCE}" in
  registry|local) ;;
  *) fail "--image-source must be registry or local" ;;
esac

case "${LOCAL_FRONTEND_IGNORE_BUILD_ERRORS}" in
  0|1) ;;
  *) fail "--frontend-ignore-build-errors must be 0 or 1" ;;
esac

case "${LOCAL_FRONTEND_IGNORE_ESLINT}" in
  0|1) ;;
  *) fail "--frontend-ignore-eslint must be 0 or 1" ;;
esac

derive_from_target

if [[ "${CUTOVER_SYSTEM_NGINX}" == "true" ]]; then
  if ! get_env_override EDGE_HTTP_PORT >/dev/null 2>&1; then
    EXTRA_ENV_OVERRIDES+=("EDGE_HTTP_PORT=18080")
  fi

  if ! get_env_override EDGE_BIND_HOST >/dev/null 2>&1; then
    EXTRA_ENV_OVERRIDES+=("EDGE_BIND_HOST=127.0.0.1")
  fi
fi

generated_env="$(mktemp "${ROOT_DIR}/.env.remote.XXXXXX")"
cleanup() {
  rm -f "${generated_env}"
}
trap cleanup EXIT

generate_cmd=(
  bash "${ROOT_DIR}/scripts/deployment/generate-production-env.sh"
  --output "${generated_env}"
  --scheme "${SCHEME}"
  --smtp-mode "${SMTP_MODE}"
)

if [[ -n "${SITE_URL}" ]]; then
  generate_cmd+=(--site-url "${SITE_URL}")
else
  generate_cmd+=(--public-host "${PUBLIC_HOST}")
fi

if [[ -n "${RELEASE_VERSION}" ]]; then
  generate_cmd+=(--release-version "${RELEASE_VERSION}")
fi
if [[ -n "${REPOSITORY}" ]]; then
  generate_cmd+=(--repository "${REPOSITORY}")
fi
if [[ -n "${REGISTRY}" ]]; then
  generate_cmd+=(--registry "${REGISTRY}")
fi
if [[ -n "${COMPOSE_PROJECT_NAME_VALUE}" ]]; then
  generate_cmd+=(--compose-project-name "${COMPOSE_PROJECT_NAME_VALUE}")
fi
if [[ "${IMAGE_SOURCE}" == "local" ]]; then
  generate_cmd+=(--backend-image "blog-backend:local" --frontend-image "blog-frontend:local")
fi
if [[ "${ENABLE_BUNDLED_MEILISEARCH}" == "true" ]]; then
  generate_cmd+=(--enable-bundled-meilisearch)
fi
if [[ "${ENABLE_BUNDLED_MINIO}" == "true" ]]; then
  generate_cmd+=(--enable-bundled-minio)
fi
if [[ "${ENABLE_BUNDLED_MAILPIT}" == "true" ]]; then
  generate_cmd+=(--enable-bundled-mailpit)
fi
for override in "${EXTRA_ENV_OVERRIDES[@]}"; do
  generate_cmd+=(--set-env "${override}")
done

"${generate_cmd[@]}"

if [[ "${IMAGE_SOURCE}" == "local" && "${SKIP_LOCAL_BUILD}" != "true" && "${DRY_RUN}" != "true" ]]; then
  build_local_images
fi

if [[ "${DRY_RUN}" != "true" ]]; then
  bootstrap_cmd=(
    bash "${ROOT_DIR}/scripts/deployment/bootstrap-remote-host.sh"
    --target "${TARGET}"
    --ssh-port "${SSH_PORT}"
  )

  if [[ -n "${IDENTITY_FILE}" ]]; then
    bootstrap_cmd+=(--identity-file "${IDENTITY_FILE}")
  fi

  if [[ "${CONFIGURE_FIREWALL}" == "true" ]]; then
    edge_bind_host="0.0.0.0"
    if override_bind_host="$(get_env_override EDGE_BIND_HOST 2>/dev/null)"; then
      edge_bind_host="${override_bind_host}"
    fi

    edge_http_port="80"
    if override_edge_port="$(get_env_override EDGE_HTTP_PORT 2>/dev/null)"; then
      edge_http_port="${override_edge_port}"
    fi

    bootstrap_cmd+=(--configure-firewall)
    if [[ "${edge_bind_host}" != "127.0.0.1" && "${edge_bind_host}" != "localhost" ]]; then
      bootstrap_cmd+=(--allow-port "${edge_http_port}/tcp")
    fi
  fi

  "${bootstrap_cmd[@]}"

  if [[ "${IMAGE_SOURCE}" == "local" ]]; then
    stream_cmd=(
      bash "${ROOT_DIR}/scripts/deployment/stream-local-images.sh"
      --target "${TARGET}"
      --ssh-port "${SSH_PORT}"
    )
    if [[ -n "${IDENTITY_FILE}" ]]; then
      stream_cmd+=(--identity-file "${IDENTITY_FILE}")
    fi
    "${stream_cmd[@]}"
  fi
fi

deploy_cmd=(
  bash "${ROOT_DIR}/scripts/deployment/deploy-remote-compose.sh"
  --target "${TARGET}"
  --env-file "${generated_env}"
  --remote-dir "${REMOTE_DIR}"
  --ssh-port "${SSH_PORT}"
)

if [[ -n "${IDENTITY_FILE}" ]]; then
  deploy_cmd+=(--identity-file "${IDENTITY_FILE}")
fi
if [[ "${DRY_RUN}" == "true" ]]; then
  deploy_cmd+=(--dry-run)
fi

"${deploy_cmd[@]}"

if [[ "${DRY_RUN}" == "true" ]]; then
  echo "[INFO] dry run env retained at: ${generated_env}"
  trap - EXIT
elif [[ "${CUTOVER_SYSTEM_NGINX}" == "true" ]]; then
  cutover_cmd=(
    bash "${ROOT_DIR}/scripts/deployment/cutover-system-nginx.sh"
    --target "${TARGET}"
    --remote-dir "${REMOTE_DIR}"
    --ssh-port "${SSH_PORT}"
  )

  if [[ -n "${IDENTITY_FILE}" ]]; then
    cutover_cmd+=(--identity-file "${IDENTITY_FILE}")
  fi

  "${cutover_cmd[@]}"
fi
