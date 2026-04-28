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
// 存储后端定义为枚举，而非 trait
#[derive(Debug, Clone)]
pub enum StorageBackend {
    S3(S3Config),
    Local(LocalConfig),
}

impl StorageBackend {
    pub async fn store(&self, key: &str, data: &[u8], content_type: &str) -> Result<()>;
    pub async fn delete(&self, key: &str) -> Result<()>;
    pub async fn presigned_upload_url(&self, key: &str, expires_in: Duration) -> Result<String>;
    pub async fn presigned_download_url(&self, key: &str, expires_in: Duration) -> Result<String>;
}
```

支持实现:
- S3/MinIO (`StorageBackend::S3`)
- 本地文件系统 (`StorageBackend::Local`)

> 注意：实际方法名为 `presigned_upload_url` / `presigned_download_url`（带 "ed"），而非 `presign_upload`。

## 媒体表结构

> 表名为 `media`（非 `media_assets`）。共有 17 列。

```sql
CREATE TABLE media (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    filename          TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type         TEXT NOT NULL,
    size_bytes        BIGINT NOT NULL,
    width             INTEGER,
    height            INTEGER,
    storage_path      TEXT NOT NULL,
    cdn_url           TEXT,
    alt_text          TEXT,
    caption           TEXT,
    uploaded_by       UUID REFERENCES users(id),
    media_type        TEXT NOT NULL DEFAULT 'image',
    usage_count       INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);
```

> 注意：`size_bytes` 替代了旧文档中的 `size`，新增了 `original_filename`、`storage_path`、`cdn_url`、`caption`、`media_type`、`usage_count`、`updated_at` 等列。`uploaded_by` 替代了 `uploader_id`，去除了 `url` 和 `article_id` 列（关联关系通过 `media_assets` 表建立）。

### Phase B 迁移新增 media_assets 表

Phase B 迁移创建了 `media_assets` 表，用于建立多对多关联：

```sql
CREATE TABLE media_assets (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    article_id  UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    media_id    UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    field_name  TEXT NOT NULL DEFAULT 'content',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(article_id, media_id, field_name)
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
