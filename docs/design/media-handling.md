# 多媒体处理与存储

> 当前实现状态。部分功能（分片上传、缩略图生成、WebP/AVIF 转换）尚未实施。

## 文件上传流程

```text
编辑器/管理界面中选择文件
       │
       ▼
POST /admin/media/upload (Multipart POST)
       │
       ├─ 文件类型检测 (MIME)
       ├─ 生成 UUID 文件名 (object_key，防冲突)
       ├─ 存储到后端存储层 (S3/MinIO/本地)
       ├─ 记录到 media 表 (persist_media_record)
       └─ 返回 MediaListItem { id, url, filename, mime_type, size, alt_text, ... }
              │
              ▼
       编辑器插入 <img src={url} />
```

### 上传端点

- **`POST /admin/media/upload`** — 直接 Multipart POST 上传
- **`POST /admin/media/presign-upload`** — 预签名直传 URL（前端直接传 S3）
- **`POST /admin/media/finalize`** — 预签名上传完成后登记到数据库

> 上传由 Rust Axum 直接处理，不经过 Next.js BFF 代理。

### 存储后端抽象

```rust
/// 存储后端枚举（具体类型，无需 dyn 分发）
pub enum StorageBackend {
    Local(LocalStorage),
    Minio(MinioStorage),
}

impl StorageBackend {
    /// 存储文件并返回可访问的 URL
    pub async fn store(
        &self,
        key: &str,
        data: &[u8],
        content_type: &str,
    ) -> Result<String, StorageError> {
        match self {
            StorageBackend::Local(s) => s.store(key, data, content_type).await,
            StorageBackend::Minio(s) => s.store(key, data, content_type).await,
        }
    }

    /// 删除文件
    pub async fn delete(&self, key: &str) -> Result<(), StorageError> {
        match self {
            StorageBackend::Local(s) => s.delete(key).await,
            StorageBackend::Minio(s) => s.delete(key).await,
        }
    }

    /// 获取预签名上传 URL（如果支持）
    pub async fn presigned_upload_url(
        &self,
        key: &str,
        content_type: &str,
        expires_secs: u32,
    ) -> Result<Option<String>, StorageError> {
        match self {
            StorageBackend::Local(s) => {
                s.presigned_upload_url(key, content_type, expires_secs).await
            }
            StorageBackend::Minio(s) => {
                s.presigned_upload_url(key, content_type, expires_secs).await
            }
        }
    }

    /// 获取预签名下载 URL（如果支持）
    pub async fn presigned_download_url(
        &self,
        key: &str,
        expires_secs: u32,
    ) -> Result<Option<String>, StorageError> {
        match self {
            StorageBackend::Local(s) => s.presigned_download_url(key, expires_secs).await,
            StorageBackend::Minio(s) => s.presigned_download_url(key, expires_secs).await,
        }
    }
}
```

支持实现:
- MinIO (`MinioStorage`)
- 本地文件系统 (`LocalStorage`)

## 媒体表结构

> 表名为 `media`（非 `media_assets`）。

```sql
CREATE TABLE media (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    filename        TEXT NOT NULL,
    url             TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    size            BIGINT NOT NULL,
    width           INTEGER,
    height          INTEGER,
    alt_text        TEXT,
    uploader_id     UUID REFERENCES users(id),
    article_id      UUID REFERENCES posts(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);
```

## 尚未实施的功能

以下功能在规划中，当前未实现：

### 分片上传
- `POST /upload/init` → `{ upload_id, chunk_size }`
- `PUT /upload/{upload_id}/chunk/{index}`
- `POST /upload/{upload_id}/complete`
- 当前文件大小上限 50MB，超过会报错

### 图片优化
- 缩略图生成（150px / 800px / original）
- WebP/AVIF 自动转换
- Next.js `<Image>` 响应式选择支持

### 病毒扫描
- ClamAV 集成（标注为可选）
