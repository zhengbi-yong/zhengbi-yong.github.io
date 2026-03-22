#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTPUT_ROOT="${ROOT_DIR}/dist/release-assets"
VERSION_OVERRIDE=""
REGISTRY="ghcr.io"
REPOSITORY="${GITHUB_REPOSITORY:-}"
metadata_cmd=()
BACKEND_DIGEST=""
FRONTEND_DIGEST=""
GITOPS_REPO_URL="${GITOPS_REPO_URL:-https://github.com/your-org/your-gitops-repo.git}"
GITOPS_TARGET_REVISION="${GITOPS_TARGET_REVISION:-main}"
GITOPS_BASE_PATH="${GITOPS_BASE_PATH:-releases}"
ARGOCD_NAMESPACE="${ARGOCD_NAMESPACE:-argocd}"
ARGOCD_PROJECT="${ARGOCD_PROJECT:-blog-platform}"

usage() {
  cat <<'EOF'
Usage: bash scripts/release/render-release-assets.sh [options]

Options:
  --version VERSION      Release version override
  --registry HOST        OCI registry host (default: ghcr.io)
  --repository OWNER/REPO
                         Repository path used to compose image names
  --backend-digest DIGEST
                         Optional published backend image digest
  --frontend-digest DIGEST
                         Optional published frontend image digest
  --gitops-repo-url URL
                         GitOps repository consumed by Argo CD applications
  --gitops-target-revision REV
                         Git revision used by Argo CD applications (default: main)
  --gitops-base-path PATH
                         Base path inside the GitOps repo for release bundles
  --argocd-namespace NAME
                         Namespace where Argo CD is installed (default: argocd)
  --argocd-project NAME
                         Argo CD project name (default: blog-platform)
  --output-root PATH     Directory where release assets are generated
EOF
}

update_env_file() {
  local file="$1"
  local key="$2"
  local value="$3"
  local escaped

  escaped="$(printf '%s' "${value}" | sed 's/[\/&]/\\&/g')"

  if grep -q "^${key}=" "${file}"; then
    sed -i "s/^${key}=.*/${key}=${escaped}/" "${file}"
  else
    printf '%s=%s\n' "${key}" "${value}" >> "${file}"
  fi
}

normalize_digest() {
  local value="$1"

  if [[ -z "${value}" ]]; then
    printf '%s\n' ""
    return
  fi

  if [[ "${value}" =~ ^sha256:[0-9a-f]{64}$ ]]; then
    printf '%s\n' "${value}"
    return
  fi

  if [[ "${value}" =~ ^[0-9a-f]{64}$ ]]; then
    printf 'sha256:%s\n' "${value}"
    return
  fi

  echo "[ERROR] invalid digest format: ${value}" >&2
  exit 1
}

compose_image_ref() {
  local image="$1"
  local tag="$2"
  local digest="$3"

  if [[ -n "${digest}" ]]; then
    printf '%s@%s\n' "${image}" "${digest}"
    return
  fi

  printf '%s:%s\n' "${image}" "${tag}"
}

relative_path() {
  python3 - "$1" "$2" <<'PY'
from pathlib import Path
import os
import sys
target = Path(sys.argv[1]).resolve()
origin = Path(sys.argv[2]).resolve()
print(os.path.relpath(target, origin))
PY
}

render_compose_env() {
  local template="$1"
  local output="$2"

  cp "${template}" "${output}"
  update_env_file "${output}" "APP_VERSION" "${app_version}"
  update_env_file "${output}" "VCS_REF" "${vcs_ref}"
  update_env_file "${output}" "BUILD_DATE" "${build_date}"
  update_env_file "${output}" "BACKEND_IMAGE" "${backend_image_ref}"
  update_env_file "${output}" "FRONTEND_IMAGE" "${frontend_image_ref}"
  update_env_file "${output}" "NEXT_PUBLIC_SENTRY_RELEASE" "${app_version}"
  update_env_file "${output}" "FRONTEND_OTEL_SERVICE_VERSION" "${app_version}"
  update_env_file "${output}" "OTEL_SERVICE_VERSION" "${app_version}"
}

render_release_kustomization() {
  local environment="$1"
  local output_dir="$2"
  local overlay_dir="${ROOT_DIR}/deployments/kubernetes/overlays/${environment}"
  local overlay_rel

  overlay_rel="$(relative_path "${overlay_dir}" "${output_dir}")"

  cat > "${output_dir}/kustomization.yaml" <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ${overlay_rel}
patches:
  - path: release-config-patch.yaml
    target:
      kind: ConfigMap
      name: blog-runtime-config
  - path: image-lock-patch.yaml
EOF

  cat > "${output_dir}/release-config-patch.yaml" <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: blog-runtime-config
data:
  APP_VERSION: "${app_version}"
  OTEL_SERVICE_VERSION: "${app_version}"
  FRONTEND_OTEL_SERVICE_VERSION: "${app_version}"
  NEXT_PUBLIC_SENTRY_RELEASE: "${app_version}"
EOF

  cat > "${output_dir}/image-lock-patch.yaml" <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blog-api
spec:
  template:
    spec:
      containers:
        - name: api
          image: ${backend_image_ref}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blog-worker
spec:
  template:
    spec:
      containers:
        - name: worker
          image: ${backend_image_ref}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blog-frontend
spec:
  template:
    spec:
      containers:
        - name: frontend
          image: ${frontend_image_ref}
---
apiVersion: batch/v1
kind: Job
metadata:
  name: blog-migrate
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: ${backend_image_ref}
EOF
}

render_argocd_overlay() {
  local environment="$1"
  local output_dir="$2"
  local k8s_dir="${OUTPUT_DIR}/kubernetes/${environment}"
  local k8s_rel

  k8s_rel="$(relative_path "${k8s_dir}" "${output_dir}")"

  cat > "${output_dir}/kustomization.yaml" <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ${k8s_rel}
patches:
  - path: migrate-hook-patch.yaml
    target:
      kind: Job
      name: blog-migrate
EOF

  cat > "${output_dir}/migrate-hook-patch.yaml" <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: blog-migrate
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation,HookSucceeded
    argocd.argoproj.io/sync-wave: "-1"
EOF
}

render_argocd_applications() {
  local output_dir="$1"
  local production_path="${GITOPS_BASE_PATH}/${app_version}/gitops/argocd/production"
  local staging_path="${GITOPS_BASE_PATH}/${app_version}/gitops/argocd/staging"

  cat > "${output_dir}/kustomization.yaml" <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - project.yaml
  - production-application.yaml
  - staging-application.yaml
EOF

  cat > "${output_dir}/project.yaml" <<EOF
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: ${ARGOCD_PROJECT}
  namespace: ${ARGOCD_NAMESPACE}
spec:
  description: Blog platform GitOps project for release ${app_version}
  sourceRepos:
    - ${GITOPS_REPO_URL}
  destinations:
    - namespace: blog-platform
      server: https://kubernetes.default.svc
    - namespace: blog-platform-staging
      server: https://kubernetes.default.svc
  clusterResourceWhitelist:
    - group: '*'
      kind: '*'
EOF

  cat > "${output_dir}/production-application.yaml" <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: blog-platform-production
  namespace: ${ARGOCD_NAMESPACE}
spec:
  project: ${ARGOCD_PROJECT}
  source:
    repoURL: ${GITOPS_REPO_URL}
    targetRevision: ${GITOPS_TARGET_REVISION}
    path: ${production_path}
  destination:
    server: https://kubernetes.default.svc
    namespace: blog-platform
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ApplyOutOfSyncOnly=true
EOF

  cat > "${output_dir}/staging-application.yaml" <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: blog-platform-staging
  namespace: ${ARGOCD_NAMESPACE}
spec:
  project: ${ARGOCD_PROJECT}
  source:
    repoURL: ${GITOPS_REPO_URL}
    targetRevision: ${GITOPS_TARGET_REVISION}
    path: ${staging_path}
  destination:
    server: https://kubernetes.default.svc
    namespace: blog-platform-staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ApplyOutOfSyncOnly=true
EOF

  cat > "${output_dir}/README.md" <<EOF
# Argo CD GitOps Entry Point

This directory contains Argo CD resources for release ${app_version}.

- \`project.yaml\`: shared AppProject
- \`production-application.yaml\`: production Application
- \`staging-application.yaml\`: staging Application

The applications assume the release bundle is committed to:

\`${GITOPS_BASE_PATH}/${app_version}/\`

inside:

\`${GITOPS_REPO_URL}\`
EOF
}

write_checksums() {
  local target_dir="$1"
  local output_file="$2"

  python3 - "$target_dir" "$output_file" <<'PY'
from pathlib import Path
import hashlib
import os
import sys

target = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2]).resolve()
lines = []

for path in sorted(p for p in target.rglob('*') if p.is_file()):
    rel = path.relative_to(target)
    if rel.as_posix() == 'SHA256SUMS':
        continue
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    lines.append(f"{digest}  {rel.as_posix()}")

output.write_text("\n".join(lines) + "\n", encoding="utf-8")
PY
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      VERSION_OVERRIDE="$2"
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
    --backend-digest)
      BACKEND_DIGEST="$2"
      shift 2
      ;;
    --frontend-digest)
      FRONTEND_DIGEST="$2"
      shift 2
      ;;
    --gitops-repo-url)
      GITOPS_REPO_URL="$2"
      shift 2
      ;;
    --gitops-target-revision)
      GITOPS_TARGET_REVISION="$2"
      shift 2
      ;;
    --gitops-base-path)
      GITOPS_BASE_PATH="$2"
      shift 2
      ;;
    --argocd-namespace)
      ARGOCD_NAMESPACE="$2"
      shift 2
      ;;
    --argocd-project)
      ARGOCD_PROJECT="$2"
      shift 2
      ;;
    --output-root)
      OUTPUT_ROOT="$2"
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

metadata_cmd=(bash "${ROOT_DIR}/scripts/release/oci-metadata.sh" --registry "${REGISTRY}")

if [[ -n "${VERSION_OVERRIDE}" ]]; then
  metadata_cmd+=(--version "${VERSION_OVERRIDE}")
fi

if [[ -n "${REPOSITORY}" ]]; then
  metadata_cmd+=(--repository "${REPOSITORY}")
fi

eval "$("${metadata_cmd[@]}")"

BACKEND_DIGEST="$(normalize_digest "${BACKEND_DIGEST}")"
FRONTEND_DIGEST="$(normalize_digest "${FRONTEND_DIGEST}")"
backend_tag_ref="${backend_image}:${app_version}"
frontend_tag_ref="${frontend_image}:${app_version}"
backend_image_ref="$(compose_image_ref "${backend_image}" "${app_version}" "${BACKEND_DIGEST}")"
frontend_image_ref="$(compose_image_ref "${frontend_image}" "${app_version}" "${FRONTEND_DIGEST}")"

OUTPUT_DIR="${OUTPUT_ROOT}/${app_version}"
COMPOSE_OUTPUT_DIR="${OUTPUT_DIR}/compose"
K8S_OUTPUT_DIR="${OUTPUT_DIR}/kubernetes"
GITOPS_OUTPUT_DIR="${OUTPUT_DIR}/gitops/argocd"
ARCHIVE_PATH="${OUTPUT_ROOT}/blog-platform-release-${app_version}.tar.gz"
ARCHIVE_SHA_PATH="${OUTPUT_ROOT}/blog-platform-release-${app_version}.sha256"

mkdir -p \
  "${COMPOSE_OUTPUT_DIR}" \
  "${K8S_OUTPUT_DIR}/production" \
  "${K8S_OUTPUT_DIR}/staging" \
  "${GITOPS_OUTPUT_DIR}/production" \
  "${GITOPS_OUTPUT_DIR}/staging" \
  "${GITOPS_OUTPUT_DIR}/applications"

render_compose_env "${ROOT_DIR}/.env.production.example" "${COMPOSE_OUTPUT_DIR}/production.env"
render_compose_env "${ROOT_DIR}/deployments/environments/compose/staging.env.example" "${COMPOSE_OUTPUT_DIR}/staging.env"
render_release_kustomization production "${K8S_OUTPUT_DIR}/production"
render_release_kustomization staging "${K8S_OUTPUT_DIR}/staging"
render_argocd_overlay production "${GITOPS_OUTPUT_DIR}/production"
render_argocd_overlay staging "${GITOPS_OUTPUT_DIR}/staging"
render_argocd_applications "${GITOPS_OUTPUT_DIR}/applications"

cat > "${OUTPUT_DIR}/manifest.json" <<EOF
{
  "appVersion": "${app_version}",
  "vcsRef": "${vcs_ref}",
  "shaShort": "${sha_short}",
  "buildDate": "${build_date}",
  "images": {
    "backend": {
      "tag": "${backend_tag_ref}",
      "digest": "${BACKEND_DIGEST}",
      "pinned": "${backend_image_ref}"
    },
    "frontend": {
      "tag": "${frontend_tag_ref}",
      "digest": "${FRONTEND_DIGEST}",
      "pinned": "${frontend_image_ref}"
    }
  },
  "compose": {
    "productionEnv": "compose/production.env",
    "stagingEnv": "compose/staging.env"
  },
  "kubernetes": {
    "production": "kubernetes/production",
    "staging": "kubernetes/staging"
  },
  "gitops": {
    "argocd": {
      "project": "gitops/argocd/applications/project.yaml",
      "productionApplication": "gitops/argocd/applications/production-application.yaml",
      "stagingApplication": "gitops/argocd/applications/staging-application.yaml",
      "productionOverlay": "gitops/argocd/production",
      "stagingOverlay": "gitops/argocd/staging",
      "repoURL": "${GITOPS_REPO_URL}",
      "targetRevision": "${GITOPS_TARGET_REVISION}",
      "basePath": "${GITOPS_BASE_PATH}"
    }
  }
}
EOF

cat > "${OUTPUT_DIR}/README.md" <<EOF
# Release ${app_version}

Generated release assets for Compose and Kubernetes.

## Compose

- Production: \`compose/production.env\`
- Staging: \`compose/staging.env\`

Deploy with:

\`\`\`bash
docker compose --env-file compose/production.env -f ${ROOT_DIR}/docker-compose.production.yml config
\`\`\`

## Kubernetes

- Production overlay bundle: \`kubernetes/production\`
- Staging overlay bundle: \`kubernetes/staging\`

Deploy with:

\`\`\`bash
kubectl apply -k kubernetes/production
\`\`\`

## Argo CD

- Project + Applications: \`gitops/argocd/applications/\`
- Production Argo overlay: \`gitops/argocd/production\`
- Staging Argo overlay: \`gitops/argocd/staging\`

Commit the release bundle into:

\`${GITOPS_BASE_PATH}/${app_version}/\`

inside:

\`${GITOPS_REPO_URL}\`

## Image locking

- Backend pinned ref: \`${backend_image_ref}\`
- Frontend pinned ref: \`${frontend_image_ref}\`

## Integrity

- Tree checksums: \`SHA256SUMS\`
- Archive: \`${ARCHIVE_PATH##*/}\`
- Archive checksum: \`${ARCHIVE_SHA_PATH##*/}\`
EOF

write_checksums "${OUTPUT_DIR}" "${OUTPUT_DIR}/SHA256SUMS"

tar -C "${OUTPUT_ROOT}" -czf "${ARCHIVE_PATH}" "${app_version}"

python3 - "${ARCHIVE_PATH}" "${ARCHIVE_SHA_PATH}" <<'PY'
from pathlib import Path
import hashlib
import sys

archive = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2]).resolve()
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
output.write_text(f"{digest}  {archive.name}\n", encoding="utf-8")
PY

echo "[OK] release assets generated in ${OUTPUT_DIR}"
