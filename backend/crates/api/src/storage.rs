use async_trait::async_trait;

/// Storage backend abstraction for file uploads
#[async_trait]
pub trait StorageBackend: Send + Sync {
    /// Store a file and return the accessible URL
    async fn store(
        &self,
        key: &str,
        data: &[u8],
        content_type: &str,
    ) -> Result<String, StorageError>;

    /// Delete a file by key
    async fn delete(&self, key: &str) -> Result<(), StorageError>;

    /// Return the durable object URL for the given key.
    fn object_url(&self, key: &str) -> String;

    /// Read object metadata without downloading the object body.
    async fn head(&self, key: &str) -> Result<StoredObjectMetadata, StorageError>;

    /// Get a presigned URL for direct upload (if supported)
    async fn presigned_upload_url(
        &self,
        key: &str,
        content_type: &str,
        expires_secs: u32,
    ) -> Result<Option<String>, StorageError>;

    /// Get a presigned URL for direct download (if supported)
    async fn presigned_download_url(
        &self,
        key: &str,
        expires_secs: u32,
    ) -> Result<Option<String>, StorageError>;
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StoredObjectMetadata {
    pub size_bytes: i64,
    pub content_type: Option<String>,
}

/// Storage errors
#[derive(Debug, thiserror::Error)]
pub enum StorageError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("S3/MinIO error: {0}")]
    S3(String),

    #[error("Invalid configuration: {0}")]
    Config(String),

    #[error("File not found: {0}")]
    NotFound(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),
}

/// Local filesystem storage backend
pub struct LocalStorage {
    base_path: std::path::PathBuf,
    base_url: String,
}

impl LocalStorage {
    pub fn new(base_path: &str, base_url: &str) -> Result<Self, StorageError> {
        let path = std::path::PathBuf::from(base_path);
        std::fs::create_dir_all(&path)?;

        Ok(Self {
            base_path: path,
            base_url: base_url.to_string(),
        })
    }

    fn full_path(&self, key: &str) -> std::path::PathBuf {
        self.base_path.join(normalize_key(key))
    }
}

#[async_trait]
impl StorageBackend for LocalStorage {
    async fn store(
        &self,
        key: &str,
        data: &[u8],
        _content_type: &str,
    ) -> Result<String, StorageError> {
        let key = normalize_key(key);
        let path = self.full_path(key);

        if let Some(parent) = path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        tokio::fs::write(&path, data).await?;

        Ok(self.object_url(key))
    }

    async fn delete(&self, key: &str) -> Result<(), StorageError> {
        let normalized_key = normalize_key(key);
        let path = self.full_path(normalized_key);

        match tokio::fs::remove_file(&path).await {
            Ok(()) => Ok(()),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                Err(StorageError::NotFound(normalized_key.to_string()))
            }
            Err(error) => Err(error.into()),
        }
    }

    fn object_url(&self, key: &str) -> String {
        format!(
            "{}/{}",
            self.base_url.trim_end_matches('/'),
            normalize_key(key)
        )
    }

    async fn head(&self, key: &str) -> Result<StoredObjectMetadata, StorageError> {
        let normalized_key = normalize_key(key);
        let path = self.full_path(normalized_key);
        let metadata = tokio::fs::metadata(&path)
            .await
            .map_err(|error| match error.kind() {
                std::io::ErrorKind::NotFound => StorageError::NotFound(normalized_key.to_string()),
                _ => StorageError::Io(error),
            })?;

        Ok(StoredObjectMetadata {
            size_bytes: metadata.len() as i64,
            content_type: Some(
                mime_guess::from_path(normalized_key)
                    .first_or_octet_stream()
                    .essence_str()
                    .to_string(),
            ),
        })
    }

    async fn presigned_upload_url(
        &self,
        _key: &str,
        _content_type: &str,
        _expires_secs: u32,
    ) -> Result<Option<String>, StorageError> {
        Ok(None)
    }

    async fn presigned_download_url(
        &self,
        key: &str,
        _expires_secs: u32,
    ) -> Result<Option<String>, StorageError> {
        Ok(Some(self.object_url(key)))
    }
}

/// MinIO/S3 storage backend
pub struct MinioStorage {
    client: aws_sdk_s3::Client,
    bucket: String,
    public_url: String,
}

impl MinioStorage {
    pub async fn new(
        endpoint: &str,
        access_key: &str,
        secret_key: &str,
        bucket: &str,
        public_url: &str,
        region: &str,
    ) -> Result<Self, StorageError> {
        use aws_sdk_s3::config::Credentials;

        let credentials = Credentials::new(access_key, secret_key, None, None, "static");

        let config = aws_sdk_s3::Config::builder()
            .endpoint_url(endpoint)
            .credentials_provider(credentials)
            .region(aws_sdk_s3::config::Region::new(region.to_string()))
            .force_path_style(true)
            .build();

        let client = aws_sdk_s3::Client::from_conf(config);
        let bucket_exists = client.head_bucket().bucket(bucket).send().await.is_ok();

        if !bucket_exists {
            let create_result = client.create_bucket().bucket(bucket).send().await;

            if let Err(error) = create_result {
                if client.head_bucket().bucket(bucket).send().await.is_err() {
                    return Err(StorageError::S3(format!(
                        "Failed to create bucket: {}",
                        error
                    )));
                }
            }
        }

        Ok(Self {
            client,
            bucket: bucket.to_string(),
            public_url: public_url.to_string(),
        })
    }
}

#[async_trait]
impl StorageBackend for MinioStorage {
    async fn store(
        &self,
        key: &str,
        data: &[u8],
        content_type: &str,
    ) -> Result<String, StorageError> {
        let key = normalize_key(key);
        use aws_sdk_s3::primitives::ByteStream;

        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .body(ByteStream::from(data.to_vec()))
            .content_type(content_type)
            .send()
            .await
            .map_err(|error| StorageError::S3(format!("Failed to upload: {}", error)))?;

        Ok(self.object_url(key))
    }

    async fn delete(&self, key: &str) -> Result<(), StorageError> {
        let key = normalize_key(key);
        self.client
            .delete_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await
            .map_err(|error| StorageError::S3(format!("Failed to delete: {}", error)))?;

        Ok(())
    }

    fn object_url(&self, key: &str) -> String {
        format!(
            "{}/{}/{}",
            self.public_url.trim_end_matches('/'),
            self.bucket,
            normalize_key(key)
        )
    }

    async fn head(&self, key: &str) -> Result<StoredObjectMetadata, StorageError> {
        let key = normalize_key(key);
        let response = self
            .client
            .head_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await
            .map_err(|error| {
                StorageError::S3(format!("Failed to read object metadata: {}", error))
            })?;

        Ok(StoredObjectMetadata {
            size_bytes: response.content_length.unwrap_or_default(),
            content_type: response.content_type,
        })
    }

    async fn presigned_upload_url(
        &self,
        key: &str,
        content_type: &str,
        expires_secs: u32,
    ) -> Result<Option<String>, StorageError> {
        let key = normalize_key(key);
        use aws_sdk_s3::presigning::PresigningConfig;
        use std::time::Duration;

        let presigning_config = PresigningConfig::builder()
            .expires_in(Duration::from_secs(expires_secs as u64))
            .build()
            .map_err(|error| StorageError::S3(format!("Invalid presigning config: {}", error)))?;

        let url = self
            .client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .content_type(content_type)
            .presigned(presigning_config)
            .await
            .map_err(|error| {
                StorageError::S3(format!("Failed to generate presigned URL: {}", error))
            })?;

        Ok(Some(url.uri().to_string()))
    }

    async fn presigned_download_url(
        &self,
        key: &str,
        expires_secs: u32,
    ) -> Result<Option<String>, StorageError> {
        let key = normalize_key(key);
        use aws_sdk_s3::presigning::PresigningConfig;
        use std::time::Duration;

        let presigning_config = PresigningConfig::builder()
            .expires_in(Duration::from_secs(expires_secs as u64))
            .build()
            .map_err(|error| StorageError::S3(format!("Invalid presigning config: {}", error)))?;

        let url = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .presigned(presigning_config)
            .await
            .map_err(|error| {
                StorageError::S3(format!("Failed to generate presigned URL: {}", error))
            })?;

        Ok(Some(url.uri().to_string()))
    }
}

fn normalize_key(key: &str) -> &str {
    key.trim_start_matches('/')
}

/// Storage configuration
#[derive(Debug, Clone)]
pub struct StorageConfig {
    pub backend: StorageBackendType,
    pub local_base_path: String,
    pub local_base_url: String,
    pub minio_endpoint: Option<String>,
    pub minio_access_key: Option<String>,
    pub minio_secret_key: Option<String>,
    pub minio_bucket: Option<String>,
    pub minio_public_url: Option<String>,
    pub minio_region: String,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum StorageBackendType {
    Local,
    Minio,
}

impl StorageConfig {
    pub fn from_env() -> Result<Self, StorageError> {
        use std::env;

        let backend = match env::var("STORAGE_BACKEND")
            .unwrap_or_else(|_| "local".to_string())
            .as_str()
        {
            "minio" => StorageBackendType::Minio,
            _ => StorageBackendType::Local,
        };

        let local_base_path =
            env::var("STORAGE_LOCAL_PATH").unwrap_or_else(|_| "/app/uploads".to_string());
        let local_base_url =
            env::var("STORAGE_LOCAL_URL").unwrap_or_else(|_| "/uploads".to_string());

        Ok(Self {
            backend,
            local_base_path,
            local_base_url,
            minio_endpoint: env::var("MINIO_ENDPOINT").ok(),
            minio_access_key: env::var("MINIO_ACCESS_KEY").ok(),
            minio_secret_key: env::var("MINIO_SECRET_KEY").ok(),
            minio_bucket: env::var("MINIO_BUCKET").ok(),
            minio_public_url: env::var("MINIO_PUBLIC_URL").ok(),
            minio_region: env::var("MINIO_REGION").unwrap_or_else(|_| "us-east-1".to_string()),
        })
    }
}

/// Storage service that wraps the backend
pub struct StorageService {
    backend: Box<dyn StorageBackend>,
}

impl StorageService {
    pub async fn new(config: &StorageConfig) -> Result<Self, StorageError> {
        let backend: Box<dyn StorageBackend> =
            match config.backend {
                StorageBackendType::Local => Box::new(LocalStorage::new(
                    &config.local_base_path,
                    &config.local_base_url,
                )?),
                StorageBackendType::Minio => {
                    let endpoint = config.minio_endpoint.as_ref().ok_or_else(|| {
                        StorageError::Config("MINIO_ENDPOINT not set".to_string())
                    })?;
                    let access_key = config.minio_access_key.as_ref().ok_or_else(|| {
                        StorageError::Config("MINIO_ACCESS_KEY not set".to_string())
                    })?;
                    let secret_key = config.minio_secret_key.as_ref().ok_or_else(|| {
                        StorageError::Config("MINIO_SECRET_KEY not set".to_string())
                    })?;
                    let bucket = config
                        .minio_bucket
                        .as_ref()
                        .ok_or_else(|| StorageError::Config("MINIO_BUCKET not set".to_string()))?;
                    let public_url = config.minio_public_url.as_ref().ok_or_else(|| {
                        StorageError::Config("MINIO_PUBLIC_URL not set".to_string())
                    })?;

                    Box::new(
                        MinioStorage::new(
                            endpoint,
                            access_key,
                            secret_key,
                            bucket,
                            public_url,
                            &config.minio_region,
                        )
                        .await?,
                    )
                }
            };

        Ok(Self { backend })
    }

    pub async fn store(
        &self,
        key: &str,
        data: &[u8],
        content_type: &str,
    ) -> Result<String, StorageError> {
        self.backend.store(key, data, content_type).await
    }

    pub async fn delete(&self, key: &str) -> Result<(), StorageError> {
        self.backend.delete(key).await
    }

    pub fn object_url(&self, key: &str) -> String {
        self.backend.object_url(key)
    }

    pub async fn head(&self, key: &str) -> Result<StoredObjectMetadata, StorageError> {
        self.backend.head(key).await
    }

    pub async fn presigned_upload_url(
        &self,
        key: &str,
        content_type: &str,
        expires_secs: u32,
    ) -> Result<Option<String>, StorageError> {
        self.backend
            .presigned_upload_url(key, content_type, expires_secs)
            .await
    }

    pub async fn presigned_download_url(
        &self,
        key: &str,
        expires_secs: u32,
    ) -> Result<Option<String>, StorageError> {
        self.backend.presigned_download_url(key, expires_secs).await
    }
}

#[cfg(test)]
mod tests {
    use super::{LocalStorage, StorageBackend};

    #[tokio::test]
    async fn local_storage_normalizes_leading_slash_keys() {
        let base_path =
            std::env::temp_dir().join(format!("blog-api-storage-{}", uuid::Uuid::new_v4()));
        let storage = LocalStorage::new(base_path.to_str().unwrap(), "/uploads").unwrap();

        let url = storage
            .store("/media/example.txt", b"hello", "text/plain")
            .await
            .unwrap();

        assert_eq!(url, "/uploads/media/example.txt");
        assert!(base_path.join("media/example.txt").exists());

        storage.delete("/media/example.txt").await.unwrap();
        assert!(!base_path.join("media/example.txt").exists());

        let _ = tokio::fs::remove_dir_all(base_path).await;
    }

    #[tokio::test]
    async fn local_storage_reports_object_metadata_and_urls() {
        let base_path =
            std::env::temp_dir().join(format!("blog-api-storage-{}", uuid::Uuid::new_v4()));
        let storage =
            LocalStorage::new(base_path.to_str().unwrap(), "https://cdn.example.com").unwrap();

        storage
            .store("media/image.png", b"hello", "image/png")
            .await
            .unwrap();

        let metadata = storage.head("media/image.png").await.unwrap();
        assert_eq!(metadata.size_bytes, 5);
        assert_eq!(metadata.content_type.as_deref(), Some("image/png"));
        assert_eq!(
            storage.object_url("/media/image.png"),
            "https://cdn.example.com/media/image.png"
        );

        let _ = tokio::fs::remove_dir_all(base_path).await;
    }
}
