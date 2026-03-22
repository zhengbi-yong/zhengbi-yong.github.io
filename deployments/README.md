# Deployment Assets

This directory contains repository-owned deployment assets that are still part
of the maintained platform surface.

## Maintained subdirectories

- `kubernetes/`: canonical multi-node base manifests and release-ready overlays
- `nginx/`: reusable nginx configuration for edge and host-level integration
- `environments/`: environment-specific examples that feed the active deployment
  workflows

## What is intentionally not here anymore

- legacy Compose stacks duplicated under `deployments/docker/compose-files/`
- old one-off deployment wrappers under `deployments/scripts/`
- hand-curated server package directories with their own separate runtime model

The maintained automation now lives under
[scripts/deployment](/home/Sisyphus/zhengbi-yong.github.io/scripts/deployment), and the
maintained operational documentation lives under
[docs/deployment](/home/Sisyphus/zhengbi-yong.github.io/docs/deployment/README.md).
