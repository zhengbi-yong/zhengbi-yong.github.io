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
/// Storage backend enumeration (concrete types, no dyn dispatch needed)
pub enum StorageBackend {
    Local(LocalStorage),
    Minio(MinioStorage),
}

/// Store a file and return the accessible URL
impl StorageBackend {
    pub async fn store(&self, key: &str, data: &[u8], content_type: &str) -> Result<String, StorageError> { ... }
    pub async fn delete(&self, key: &str) -> Result<(), StorageError> { ... }
    pub fn object_url(&self, key: &str) -> String { ... }
    pub async fn head(&self, key: &str) -> Result<StoredObjectMetadata, StorageError> { ... }
    pub async fn presigned_upload_url(&self, key: &str, expires_secs: u32) -> Result<String, StorageError> { ... }
    pub async fn presigned_download_url(&self, key: &str, expires_secs: u32) -> Result<String, StorageError> { ... }
}
```

支持实现:
- MinIO/S3 (`StorageBackend::Minio(MinioStorage)`)
- 本地文件系统 (`StorageBackend::Local(LocalStorage)`)


## 媒体表结构

> 表名为 `media`（非 `media_assets`）。

```sql
CREATE TABLE media (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    filename        TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    size_bytes      BIGINT NOT NULL,
    width           INTEGER,
    height          INTEGER,
    storage_path    TEXT NOT NULL,
    cdn_url         TEXT,
    alt_text        TEXT,
    caption         TEXT,
    uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    media_type      TEXT NOT NULL DEFAULT 'image',
    usage_count     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
