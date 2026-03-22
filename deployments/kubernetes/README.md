# Kubernetes Deployment

This directory is the canonical multi-node deployment path for the project.

## What it includes

- `base/`: shared Deployments, Services, Ingress, HPA, PDB, and migration Job
- `overlays/production`: production scaling and routing defaults
- `overlays/staging`: staging namespace, ingress, and lower replica defaults
- `secret.example.yaml`: template for cluster-specific secrets

## Recommended workflow

1. Copy [secret.example.yaml](/home/Sisyphus/zhengbi-yong.github.io/deployments/kubernetes/base/secret.example.yaml) to `secret.yaml` outside git, fill in real values, and change the namespace when targeting staging.
2. Choose `overlays/staging` or `overlays/production` as your environment baseline.
3. Generate version-pinned release assets:

```bash
bash scripts/release/render-release-assets.sh --version 1.8.2
```

If you have published digests, pass them as `--backend-digest` and `--frontend-digest` to get fully immutable image refs.

4. Apply the secret first, then the generated release overlay:

```bash
kubectl apply -f secret.yaml
kubectl apply -k dist/release-assets/1.8.2/kubernetes/production
```

If you use Argo CD, the same bundle also includes:

- `gitops/argocd/applications/`
- `gitops/argocd/production/`
- `gitops/argocd/staging/`

## Local `kubectl apply` validation

For repo-local validation on a disposable cluster, use:

```bash
make validate-k8s-apply RELEASE_VERSION=1.8.2
```

This workflow creates or reuses a local `kind` cluster, installs Argo CD CRDs with
server-side apply, and then applies:

- `dist/release-assets/<version>/kubernetes/production`
- `dist/release-assets/<version>/kubernetes/staging`
- `dist/release-assets/<version>/gitops/argocd/applications`

Conditions for local validation:

- Docker daemon must be running
- `kubectl` and `kind` must be installed, either on `PATH` or in `.tools/bin`
- the release bundle must already exist under `dist/release-assets/<version>`
- internet access is required the first time Argo CD is installed from the upstream manifest

The script stores kubeconfig under `.tools/kube/` so it does not depend on `~/.kube/config`.

## Upgrade flow

1. Generate a new release bundle for the target version.
2. Apply the migration Job from the generated overlay.
3. Apply the version-pinned overlay.
4. Verify `readyz`, ingress traffic, and HPA behavior.

## Notes

- This base expects PostgreSQL, Redis, Meilisearch, MinIO/S3, and OTel collector to be managed separately.
- For Kubernetes, `STORAGE_BACKEND=minio` is the recommended default; local filesystem mode is not durable across replicas.
