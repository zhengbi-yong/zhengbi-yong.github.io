#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.production.yml"
ENV_FILE=""
GENERATED_ENV=false
KEEP_RUNNING=false
BUILD_IMAGES=true
temp_files=()

usage() {
  cat <<'EOF'
Usage:
  bash scripts/testing/smoke-production-compose.sh [options]

Options:
  --env-file <path>    Use an existing production env file
  --keep-running       Leave the Compose stack up for manual inspection
  --skip-build         Skip local image builds before deploy
  --help               Show this help
EOF
}

fail() {
  echo "[ERROR] $*" >&2
  exit 1
}

register_temp_file() {
  temp_files+=("$1")
}

cleanup() {
  if [[ "${KEEP_RUNNING}" != "true" && -n "${ENV_FILE}" ]]; then
    docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" down -v --remove-orphans >/dev/null 2>&1 || true
  fi

  if [[ "${GENERATED_ENV}" == "true" && "${KEEP_RUNNING}" != "true" && -n "${ENV_FILE}" ]]; then
    rm -f "${ENV_FILE}" || true
  fi

  if [[ ${#temp_files[@]} -gt 0 ]]; then
    rm -f "${temp_files[@]}" || true
  fi
}

probe() {
  local url="$1"
  local output="$2"
  curl --fail --silent --show-error --location --retry 10 --retry-all-errors "${url}" -o "${output}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --keep-running)
      KEEP_RUNNING=true
      shift
      ;;
    --skip-build)
      BUILD_IMAGES=false
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

trap cleanup EXIT

if [[ -z "${ENV_FILE}" ]]; then
  ENV_FILE="$(mktemp "${TMPDIR:-/tmp}/blog-platform-production-env.XXXXXX")"
  bash "${ROOT_DIR}/scripts/deployment/generate-ci-production-env.sh" --output "${ENV_FILE}"
  GENERATED_ENV=true
elif [[ "${ENV_FILE}" != /* ]]; then
  ENV_FILE="${ROOT_DIR}/${ENV_FILE}"
fi

[[ -f "${ENV_FILE}" ]] || fail "env file not found: ${ENV_FILE}"
[[ -f "${COMPOSE_FILE}" ]] || fail "compose file not found: ${COMPOSE_FILE}"

bash "${ROOT_DIR}/scripts/deployment/validate-production-env.sh" "${ENV_FILE}"

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

deploy_args=(--env-file "${ENV_FILE}")
if [[ "${BUILD_IMAGES}" == "true" ]]; then
  deploy_args+=(--build)
fi

echo "[INFO] Deploying production Compose stack for smoke validation"
bash "${ROOT_DIR}/scripts/deployment/deploy-compose-stack.sh" "${deploy_args[@]}"

public_base_url="http://127.0.0.1:${FRONTEND_PORT:-3001}"
api_base_url="http://127.0.0.1:${BACKEND_PORT:-3000}/api/v1"

if [[ "${ENABLE_EDGE_PROXY:-true}" == "true" ]]; then
  public_base_url="http://127.0.0.1:${EDGE_HTTP_PORT:-80}"
  api_base_url="${public_base_url}/api/v1"
fi

echo "[INFO] Probing rendered frontend pages via ${public_base_url}"
home_file="$(mktemp "${TMPDIR:-/tmp}/blog-platform-home.XXXXXX.html")"
register_temp_file "${home_file}"
probe "${public_base_url}/" "${home_file}"
grep -Eq '<!DOCTYPE html|<html' "${home_file}" || fail "frontend home page did not render HTML"

search_file="$(mktemp "${TMPDIR:-/tmp}/blog-platform-search.XXXXXX.html")"
register_temp_file "${search_file}"
probe "${public_base_url}/search" "${search_file}"
grep -q 'Search published posts' "${search_file}" || fail "frontend /search page did not render expected heading"

echo "[INFO] Probing search API via ${api_base_url}"
search_json="$(mktemp "${TMPDIR:-/tmp}/blog-platform-search.XXXXXX.json")"
register_temp_file "${search_json}"
probe "${api_base_url}/search?q=rust&limit=3" "${search_json}"
python3 - "${search_json}" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as fh:
    payload = json.load(fh)

assert isinstance(payload, dict), "search response must be an object"
for key in ("results", "total", "query"):
    assert key in payload, f"missing key: {key}"
assert isinstance(payload["results"], list), "results must be a list"
assert isinstance(payload["total"], int), "total must be an integer"
assert isinstance(payload["query"], str), "query must be a string"
PY

trending_json="$(mktemp "${TMPDIR:-/tmp}/blog-platform-trending.XXXXXX.json")"
register_temp_file "${trending_json}"
probe "${api_base_url}/search/trending?limit=5" "${trending_json}"
python3 - "${trending_json}" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as fh:
    payload = json.load(fh)

assert isinstance(payload, list), "trending response must be a list"
PY

echo "[OK] production Compose smoke validation passed"
if [[ "${KEEP_RUNNING}" == "true" ]]; then
  echo "[INFO] stack left running for inspection"
  echo "[INFO] env_file=${ENV_FILE}"
fi
