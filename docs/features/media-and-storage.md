# Media and Storage

## Purpose

Media storage abstracts uploads away from local disk so the same application can run on one server or many replicas.

## Storage backends

- local filesystem for simple single-host deployments
- MinIO / S3-compatible object storage for durable multi-node deployments

Core code:

- [storage.rs](/home/Sisyphus/zhengbi-yong.github.io/backend/crates/api/src/storage.rs#L1)
- [routes/media.rs](/home/Sisyphus/zhengbi-yong.github.io/backend/crates/api/src/routes/media.rs)

## Implementation model

- `StorageBackend` defines the contract for store, delete, metadata lookup, and presigned URLs
- `LocalStorage` writes to a mounted directory and returns relative URLs
- `MinioStorage` provisions buckets if needed and generates durable object URLs
- the API initializes storage from environment-driven config at startup in [main.rs](/home/Sisyphus/zhengbi-yong.github.io/backend/crates/api/src/main.rs#L121)

## Deployment impact

- local storage is acceptable only when one API replica owns the writable volume
- MinIO or S3 is the recommended default for Kubernetes and horizontally scaled Compose fleets
- the production Compose stack can run bundled MinIO with `ENABLE_BUNDLED_MINIO=true`

## Scaling properties

- moving uploads to object storage removes the shared-filesystem requirement between replicas
- presigned URL support allows future direct-to-object-storage uploads without routing large bodies through the API
- the storage trait keeps backend business logic isolated from storage vendor choice

## Known boundaries

- multipart upload support in the media routes is still incomplete
- storage lifecycle policies and CDN integration are not yet documented in depth
- local filesystem mode remains available and is still the default in the example env, which is safe for single-host use but not ideal for clustered environments
