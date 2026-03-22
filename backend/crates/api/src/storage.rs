use async_trait::async_trait;
use std::path::Path;

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
        self.base_path.join(key)
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
        let path = self.full_path(key);

        // Create parent directories if needed
        if let Some(parent) = path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        tokio::fs::write(&path, data).await?;

        Ok(format!("{}/{}", self.base_url, key))
    }

    async fn delete(&self, key: &str) -> Result<(), StorageError> {
        let path = self.full_path(key);

        match tokio::fs::remove_file(&path).await {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                Err(StorageError::NotFound(key.to_string()))
            }
            Err(e) => Err(e.into()),
        }
    }

    async fn presigned_upload_url(
        &self,
        _key: &str,
        _content_type: &str,
        _expires_secs: u32,
    ) -> Result<Option<String>, StorageError> {
        // Local storage doesn't support presigned URLs
        Ok(None)
    }

    async fn presigned_download_url(
        &self,
        key: &str,
        _expires_secs: u32,
    ) -> Result<Option<String>, StorageError> {
        // Return direct URL for local storage
        Ok(Some(format!("{}/{}", self.base_url, key)))
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
            .force_path_style(true) // Required for MinIO
            .build();

        let client = aws_sdk_s3::Client::from_conf(config);

        // Ensure bucket exists
        let bucket_exists = client.head_bucket().bucket(bucket).send().await.is_ok();

        if !bucket_exists {
            client
                .create_bucket()
                .bucket(bucket)
                .send()
                .await
                .map_err(|e| StorageError::S3(format!("Failed to create bucket: {}", e)))?;
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
        use aws_sdk_s3::primitives::ByteStream;

        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .body(ByteStream::from(data.to_vec()))
            .content_type(content_type)
            .send()
            .await
            .map_err(|e| StorageError::S3(format!("Failed to upload: {}", e)))?;

        Ok(format!("{}/{}/{}", self.public_url, self.bucket, key))
    }

    async fn delete(&self, key: &str) -> Result<(), StorageError> {
        self.client
            .delete_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| StorageError::S3(format!("Failed to delete: {}", e)))?;

        Ok(())
    }

    async fn presigned_upload_url(
        &self,
        key: &str,
        content_type: &str,
        expires_secs: u32,
    ) -> Result<Option<String>, StorageError> {
        use aws_sdk_s3::presigning::PresigningConfig;
        use std::time::Duration;

        let presigning_config = PresigningConfig::builder()
            .expires_in(Duration::from_secs(expires_secs as u64))
            .build()
            .map_err(|e| StorageError::S3(format!("Invalid presigning config: {}", e)))?;

        let url = self
            .client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .content_type(content_type)
            .presigned(presigning_config)
            .await
            .map_err(|e| StorageError::S3(format!("Failed to generate presigned URL: {}", e)))?;

        Ok(Some(url.uri().to_string()))
    }

    async fn presigned_download_url(
        &self,
        key: &str,
        expires_secs: u32,
    ) -> Result<Option<String>, StorageError> {
        use aws_sdk_s3::presigning::PresigningConfig;
        use std::time::Duration;

        let presigning_config = PresigningConfig::builder()
            .expires_in(Duration::from_secs(expires_secs as u64))
            .build()
            .map_err(|e| StorageError::S3(format!("Invalid presigning config: {}", e)))?;

        let url = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .presigned(presigning_config)
            .await
            .map_err(|e| StorageError::S3(format!("Failed to generate presigned URL: {}", e)))?;

        Ok(Some(url.uri().to_string()))
    }
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
