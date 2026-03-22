# Argo CD GitOps

Use this when you want cluster upgrades to follow committed release bundles instead of manual `kubectl apply`.

## Flow

1. Generate a release bundle:

```bash
make render-release-assets VERSION=1.8.2
```

2. Copy `dist/release-assets/1.8.2/` into your GitOps repo, for example:

```text
releases/1.8.2/
```

3. Apply the generated Argo CD application set:

```bash
kubectl apply -k releases/1.8.2/gitops/argocd/applications
```

## What gets generated

- `gitops/argocd/applications/kustomization.yaml`
- `gitops/argocd/applications/project.yaml`
- `gitops/argocd/applications/production-application.yaml`
- `gitops/argocd/applications/staging-application.yaml`
- `gitops/argocd/production/`
- `gitops/argocd/staging/`

The Argo-specific overlays add a `PreSync` hook annotation to the migration Job, so schema migration runs before the application rollout.

## Recommended inputs

Pass real GitOps coordinates when generating the bundle:

```bash
make render-release-assets \
  VERSION=1.8.2 \
  GITOPS_REPO_URL=https://github.com/acme/platform-gitops.git \
  GITOPS_TARGET_REVISION=main \
  GITOPS_BASE_PATH=releases
```

If you already published digest-pinned images:

```bash
make render-release-assets \
  VERSION=1.8.2 \
  BACKEND_DIGEST=sha256:... \
  FRONTEND_DIGEST=sha256:...
```
