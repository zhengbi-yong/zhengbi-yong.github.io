#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VERSION_FILE="${ROOT_DIR}/VERSION"
GITHUB_OUTPUT_FILE=""
REGISTRY="ghcr.io"
REPOSITORY="${GITHUB_REPOSITORY:-}"
REF_NAME="${GITHUB_REF_NAME:-}"
REF_TYPE="${GITHUB_REF_TYPE:-}"
DEFAULT_BRANCH="main"
SHA="${GITHUB_SHA:-}"
OVERRIDE_VERSION=""

usage() {
  cat <<'EOF'
Usage: bash scripts/release/oci-metadata.sh [options]

Options:
  --github-output PATH   Write key=value pairs to the GitHub Actions output file
  --registry HOST        OCI registry hostname (default: ghcr.io)
  --repository OWNER/REPO
                         Repository path used to compose image names
  --ref-name NAME        Git ref name override
  --ref-type TYPE        Git ref type override (branch|tag)
  --sha SHA              Git SHA override
  --default-branch NAME  Default branch name (default: main)
  --version VERSION      Explicit application version override
EOF
}

infer_repository() {
  local remote
  remote="$(git -C "${ROOT_DIR}" config --get remote.origin.url 2>/dev/null || true)"

  case "${remote}" in
    git@github.com:*.git)
      printf '%s\n' "${remote#git@github.com:}" | sed 's/\.git$//'
      return 0
      ;;
    https://github.com/*.git)
      printf '%s\n' "${remote#https://github.com/}" | sed 's/\.git$//'
      return 0
      ;;
    https://github.com/*)
      printf '%s\n' "${remote#https://github.com/}"
      return 0
      ;;
  esac

  printf 'local/%s\n' "$(basename "${ROOT_DIR}")"
}

emit() {
  local key="$1"
  local value="$2"

  if [[ -n "${GITHUB_OUTPUT_FILE}" ]]; then
    printf '%s=%s\n' "${key}" "${value}" >> "${GITHUB_OUTPUT_FILE}"
    return
  fi

  printf '%s=%s\n' "${key}" "${value}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --github-output)
      GITHUB_OUTPUT_FILE="$2"
      shift 2
      ;;
    --registry)
      REGISTRY="$2"
      shift 2
      ;;
    --repository)
      REPOSITORY="$2"
      shift 2
      ;;
    --ref-name)
      REF_NAME="$2"
      shift 2
      ;;
    --ref-type)
      REF_TYPE="$2"
      shift 2
      ;;
    --sha)
      SHA="$2"
      shift 2
      ;;
    --default-branch)
      DEFAULT_BRANCH="$2"
      shift 2
      ;;
    --version)
      OVERRIDE_VERSION="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[ERROR] unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "${REPOSITORY}" ]]; then
  REPOSITORY="$(infer_repository)"
fi

REPOSITORY="$(printf '%s' "${REPOSITORY}" | tr '[:upper:]' '[:lower:]')"

if [[ -z "${SHA}" ]]; then
  SHA="$(git -C "${ROOT_DIR}" rev-parse HEAD 2>/dev/null || printf 'local')"
fi

if [[ -z "${REF_NAME}" ]]; then
  REF_NAME="$(git -C "${ROOT_DIR}" rev-parse --abbrev-ref HEAD 2>/dev/null || printf 'detached')"
fi

if [[ -z "${REF_TYPE}" ]]; then
  if [[ "${REF_NAME}" == "detached" || "${REF_NAME}" == "HEAD" ]]; then
    REF_TYPE="branch"
  else
    REF_TYPE="branch"
  fi
fi

version_from_file="0.0.0-dev"
if [[ -f "${VERSION_FILE}" ]]; then
  version_from_file="$(tr -d '[:space:]' < "${VERSION_FILE}")"
fi

tag_version=""
if [[ "${REF_TYPE}" == "tag" ]]; then
  tag_version="${REF_NAME#v}"
fi

if [[ -n "${OVERRIDE_VERSION}" ]]; then
  app_version="${OVERRIDE_VERSION}"
elif [[ -n "${tag_version}" ]]; then
  app_version="${tag_version}"
else
  app_version="${version_from_file}"
fi

is_semver="false"
publish_release="false"
publish_major_minor="false"
major_minor_version=""
if [[ "${app_version}" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)([-+].*)?$ ]]; then
  is_semver="true"
  major_minor_version="${BASH_REMATCH[1]}.${BASH_REMATCH[2]}"
fi

if [[ -n "${tag_version}" && "${is_semver}" == "true" ]]; then
  publish_release="true"
  publish_major_minor="true"
fi

publish_latest="false"
if [[ "${REF_TYPE}" == "branch" && "${REF_NAME}" == "${DEFAULT_BRANCH}" ]]; then
  publish_latest="true"
fi

backend_image="${REGISTRY}/${REPOSITORY}/blog-backend"
frontend_image="${REGISTRY}/${REPOSITORY}/blog-frontend"
sha_short="${SHA:0:12}"
build_date="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
source_url="https://github.com/${REPOSITORY}"

emit app_version "${app_version}"
emit version_from_file "${version_from_file}"
emit release_version "${tag_version}"
emit major_minor_version "${major_minor_version}"
emit is_semver "${is_semver}"
emit publish_release "${publish_release}"
emit publish_major_minor "${publish_major_minor}"
emit publish_latest "${publish_latest}"
emit ref_name "${REF_NAME}"
emit ref_type "${REF_TYPE}"
emit vcs_ref "${SHA}"
emit sha_short "${sha_short}"
emit build_date "${build_date}"
emit registry "${REGISTRY}"
emit repository "${REPOSITORY}"
emit source_url "${source_url}"
emit backend_image "${backend_image}"
emit frontend_image "${frontend_image}"
