# Deployment Guides

Only the maintained guide families are listed here.

## Active guide families

### Compose

- [Production Stack](../../../../../../docs/deployment/guides/compose/production-stack.md)

### Server

- [Automated Compose Deploy](../../../../../../docs/deployment/guides/server/automated-compose-deploy.md)
- [Quick Deployment](../../../../../../docs/deployment/guides/server/quick-deployment.md)
- [System Nginx Cutover](../../../../../../docs/deployment/guides/server/system-nginx-cutover.md)

### Kubernetes

- [Kubernetes Base](../../../../../../docs/deployment/guides/kubernetes/base.md)

### GitOps

- [Argo CD](../../../../../../docs/deployment/guides/gitops/argocd.md)

## Guide selection

- Fresh server, lowest ops burden: [Automated Compose Deploy](../../../../../../docs/deployment/guides/server/automated-compose-deploy.md)
- Existing host nginx on `80/443`: [System Nginx Cutover](../../../../../../docs/deployment/guides/server/system-nginx-cutover.md)
- One host or a small fleet with direct Compose operations: [Production Stack](../../../../../../docs/deployment/guides/compose/production-stack.md)
- Multi-node cluster: [Kubernetes Base](../../../../../../docs/deployment/guides/kubernetes/base.md)
