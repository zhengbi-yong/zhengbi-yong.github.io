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
- **`POST /admin/media/presign-upload`** — 预签名直传 URL（前端直接传 S3/MinIO）
- **`POST /admin/media/finalize`** — 预签名上传完成后登记到数据库

### 媒体库管理端点

- **`GET /admin/media`** — 媒体库列表（分页、按类型/文件名筛选）
- **`GET /admin/media/{id}`** — 获取媒体文件详情
- **`PATCH /admin/media/{id}`** — 更新媒体元数据（alt_text, caption）
- **`DELETE /admin/media/{id}`** — 软删除媒体文件
- **`GET /admin/media/{id}/download-url`** — 生成预签名下载 URL

> 实际 API 路径前缀为 `/api/v1/admin/media/...`（Axum 路由挂载在 `/v1` 命名空间下）。

### 存储后端抽象

```rust
// 枚举式存储后端 (backend/crates/api/src/storage.rs)
pub enum StorageBackend {
    Local(LocalStorage),
    Minio(MinioStorage),
}

// 方法（通过 match 分发）:
// - store(key, data, content_type) -> Result<String>
// - delete(key) -> Result<()>
// - object_url(key) -> String
// - head(key) -> Result<StoredObjectMetadata>
// - presigned_upload_url(key, content_type, expires_secs) -> Result<Option<String>>
// - presigned_download_url(key, expires_secs) -> Result<Option<String>>
```

支持实现:
- MinIO 兼容 S3 (`MinioStorage`)
- 本地文件系统 (`LocalStorage`)

## 媒体表结构

> 表名为 `media`。同时存在迁移中的 `media_assets` 表（见 `2026042701_create_articles.sql`）。

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

### 文件大小限制
- **后端**: 单文件上限 50MB（`media.rs` 硬编码校验）
- **前端（图片）**: `useImageUpload.ts` 限制 10MB，支持类型: JPEG, PNG, WebP, GIF, SVG

### 图片优化
- 缩略图生成（150px / 800px / original）
- WebP/AVIF 自动转换
- Next.js `<Image>` 响应式选择支持

### 病毒扫描
- ClamAV 集成（标注为可选）
