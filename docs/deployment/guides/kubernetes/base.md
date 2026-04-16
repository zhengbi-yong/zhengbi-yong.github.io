# Kubernetes Base

The canonical multi-node deployment base and overlays live in [deployments/kubernetes/README.md](../../../../../../../deployments/kubernetes/README.md).

Use it when:

- API and worker need independent horizontal scaling
- ingress and autoscaling should be cluster-managed
- PostgreSQL, Redis, search, and object storage are externalized

The base includes Deployments, Services, an Ingress, HPAs, PDBs, and a migration Job.
Use `overlays/staging` or `overlays/production` for real clusters, and `scripts/release/render-release-assets.sh` to generate version-pinned release overlays.

For a real API-server validation on a disposable local cluster, run:

```bash
make validate-k8s-apply RELEASE_VERSION=1.8.2
```

That command uses `scripts/deployment/validate-kubernetes-apply.sh` to create or reuse a local
`kind` cluster, install Argo CD CRDs, and execute `kubectl apply` against the rendered release
overlays instead of relying on static YAML parsing alone.
