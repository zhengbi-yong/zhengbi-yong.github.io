#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

TOOLS_DIR="${ROOT_DIR}/.tools/bin"
CLUSTER_NAME="blog-platform-validation"
ARGOCD_NAMESPACE="argocd"
KUBECONFIG_PATH=""
RELEASE_DIR=""
RELEASE_VERSION=""

usage() {
  cat <<'EOF'
Usage:
  bash scripts/deployment/validate-kubernetes-apply.sh [options]

Options:
  --release-version <version>   Release version under dist/release-assets/<version>
  --release-dir <path>          Explicit release bundle directory
  --cluster-name <name>         kind cluster name (default: blog-platform-validation)
  --kubeconfig <path>           kubeconfig path (default: .tools/kube/kind-<cluster>.config)
  --tools-dir <path>            Directory containing kubectl and kind (default: .tools/bin)
  --argocd-namespace <name>     Namespace for Argo CD install (default: argocd)
  --help                        Show this help

Examples:
  bash scripts/deployment/validate-kubernetes-apply.sh --release-version 1.8.2
  bash scripts/deployment/validate-kubernetes-apply.sh --release-dir dist/release-assets/9.9.9
EOF
}

fail() {
  echo "error: $*" >&2
  exit 1
}

require_command() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    fail "missing required command: ${name}"
  fi
}

resolve_release_dir() {
  if [[ -n "${RELEASE_DIR}" ]]; then
    return
  fi

  if [[ -n "${RELEASE_VERSION}" ]]; then
    RELEASE_DIR="${ROOT_DIR}/dist/release-assets/${RELEASE_VERSION}"
    return
  fi

  fail "set --release-version or --release-dir"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --release-version)
      RELEASE_VERSION="${2:-}"
      shift 2
      ;;
    --release-dir)
      RELEASE_DIR="${2:-}"
      shift 2
      ;;
    --cluster-name)
      CLUSTER_NAME="${2:-}"
      shift 2
      ;;
    --kubeconfig)
      KUBECONFIG_PATH="${2:-}"
      shift 2
      ;;
    --tools-dir)
      TOOLS_DIR="${2:-}"
      shift 2
      ;;
    --argocd-namespace)
      ARGOCD_NAMESPACE="${2:-}"
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

resolve_release_dir

if [[ "${RELEASE_DIR}" != /* ]]; then
  RELEASE_DIR="${ROOT_DIR}/${RELEASE_DIR}"
fi

[[ -d "${RELEASE_DIR}" ]] || fail "release directory not found: ${RELEASE_DIR}"
[[ -f "${RELEASE_DIR}/kubernetes/production/kustomization.yaml" ]] || fail "missing production overlay in ${RELEASE_DIR}"
[[ -f "${RELEASE_DIR}/kubernetes/staging/kustomization.yaml" ]] || fail "missing staging overlay in ${RELEASE_DIR}"
[[ -f "${RELEASE_DIR}/gitops/argocd/applications/kustomization.yaml" ]] || fail "missing Argo CD applications overlay in ${RELEASE_DIR}"

if [[ -z "${KUBECONFIG_PATH}" ]]; then
  KUBECONFIG_PATH="${ROOT_DIR}/.tools/kube/kind-${CLUSTER_NAME}.config"
fi

mkdir -p "$(dirname "${KUBECONFIG_PATH}")"

export PATH="${TOOLS_DIR}:${PATH}"
export KUBECONFIG="${KUBECONFIG_PATH}"

require_command docker
require_command kubectl
require_command kind

if ! docker info >/dev/null 2>&1; then
  fail "docker daemon is not reachable"
fi

if ! kind get clusters 2>/dev/null | grep -Fxq "${CLUSTER_NAME}"; then
  echo "Creating kind cluster ${CLUSTER_NAME}"
  kind create cluster --name "${CLUSTER_NAME}" --kubeconfig "${KUBECONFIG_PATH}"
else
  echo "Reusing existing kind cluster ${CLUSTER_NAME}"
  kind export kubeconfig --name "${CLUSTER_NAME}" --kubeconfig "${KUBECONFIG_PATH}" >/dev/null
fi

echo "Waiting for control-plane node readiness"
kubectl wait --for=condition=Ready "node/${CLUSTER_NAME}-control-plane" --timeout=120s

echo "Installing or reconciling Argo CD CRDs in namespace ${ARGOCD_NAMESPACE}"
kubectl create namespace "${ARGOCD_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
kubectl apply --server-side --force-conflicts -n "${ARGOCD_NAMESPACE}" \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Applying production release overlay"
kubectl apply -k "${RELEASE_DIR}/kubernetes/production"

echo "Applying staging release overlay"
kubectl apply -k "${RELEASE_DIR}/kubernetes/staging"

echo "Applying Argo CD application set"
kubectl apply -k "${RELEASE_DIR}/gitops/argocd/applications"

echo
echo "Validation succeeded"
echo "  cluster: ${CLUSTER_NAME}"
echo "  kubeconfig: ${KUBECONFIG_PATH}"
echo "  release_dir: ${RELEASE_DIR}"
