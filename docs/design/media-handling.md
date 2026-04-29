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
       └─ 返回 MediaListItem { id, filename, original_filename, mime_type, size_bytes, width, height, url, media_type, usage_count, created_at }
              │
              ▼
       编辑器插入 <img src={url} />
```

### 上传端点

- **`POST /admin/media/upload`** — 直接 Multipart POST 上传
- **`POST /admin/media/presign-upload`** — 预签名直传 URL（前端直接传 S3/MinIO）
- **`POST /admin/media/finalize`** — 预签名上传完成后登记到数据库

> 上传由 Rust Axum 直接处理，不经过 Next.js BFF 代理。

### 存储后端抽象

存储后端使用 Rust **enum**（无动态分发），定义在 `backend/crates/api/src/storage.rs`：

```rust
pub enum StorageBackend {
    Local(LocalStorage),
    Minio(MinioStorage),
}
```

方法通过 `match` 分发到具体实现：

| 方法 | 签名 | 说明 |
|------|------|------|
| `store` | `async fn store(&self, key: &str, data: &[u8], content_type: &str) -> Result<String, StorageError>` | 存储文件，返回可访问 URL |
| `delete` | `async fn delete(&self, key: &str) -> Result<(), StorageError>` | 删除文件 |
| `object_url` | `fn object_url(&self, key: &str) -> String` | 返回文件的持久对象 URL |
| `head` | `async fn head(&self, key: &str) -> Result<StoredObjectMetadata, StorageError>` | 读取对象元数据 |
| `presigned_upload_url` | `async fn presigned_upload_url(&self, key: &str, content_type: &str, expires_secs: u32) -> Result<Option<String>, StorageError>` | 预签名上传 URL（MinIO 支持，Local 返回 None） |
| `presigned_download_url` | `async fn presigned_download_url(&self, key: &str, expires_secs: u32) -> Result<Option<String>, StorageError>` | 预签名下载 URL |

`StorageService`（封装 `Arc<StorageBackend>`）作为应用状态注入。

通过 `STORAGE_BACKEND` 环境变量选择后端（`local` 或 `minio`，默认 `local`）。

## 媒体表结构

> 主媒体表 `media`。定义在 `backend/migrations/0004_create_cms_tables.sql`。

```sql
CREATE TABLE media (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    filename          TEXT NOT NULL,               -- 存储键名（UUID 文件名）
    original_filename TEXT NOT NULL,               -- 用户上传时的原始文件名
    mime_type         TEXT NOT NULL,
    size_bytes        BIGINT NOT NULL,             -- 文件大小（字节）
    width             INTEGER,                     -- 图片宽度（如有）
    height            INTEGER,                     -- 图片高度（如有）
    storage_path      TEXT NOT NULL,               -- 存储路径（后端对象键）
    cdn_url           TEXT,                        -- CDN 加速 URL（可选；查询使用 COALESCE(cdn_url, storage_path) AS url，尚无实际 CDN 集成代码）
    alt_text          TEXT,                        -- 替代文本
    caption           TEXT,                        -- 标题/说明文字
    uploaded_by       UUID REFERENCES users(id) ON DELETE SET NULL,  -- 上传者
    media_type        TEXT NOT NULL DEFAULT 'image',  -- 类型：image, video, document, other
    usage_count       INTEGER NOT NULL DEFAULT 0,     -- 被引用次数
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ                   -- 软删除标记
);
```

### `media_assets` 表（文章系统关联表，⚠️ 已废弃）

除了 `media` 表外，文章系统中还使用 `media_assets` 表来建立文章与媒体的多对多关联。定义在迁移 `2026042701_create_articles.sql` 中：

> **⚠️ 废弃警告**：`media_assets` 表引用 `articles(id)`，但 `articles`/`article_versions` 表属于旧版双轨存储尝试的遗留代码。当前系统使用 `posts` 表（通过 `post_media` 关联表）和 `post_versions` 表。`media_assets` 在当前基于 `posts` 的架构中无活跃使用，计划在后续清理迁移中移除。

```sql
CREATE TABLE media_assets (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    media_id   UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(article_id, media_id)
);
```

## 允许的 MIME 类型

后端上传时会校验 MIME 类型，目前允许以下类型：

| 类别 | MIME 类型 |
|------|----------|
| 图片 | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml` |
| 视频 | `video/mp4`, `video/webm`, `video/quicktime` |
| 文档 | `application/pdf` |
| 文本 | `text/plain` |

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

## 已知限制

### `get_image_dimensions` 存根
`get_image_dimensions()` 当前返回 `(None, None)`（未实现图片尺寸提取）。TODO：集成 `image` crate 解析图片头以获取实际尺寸。

### Redis 缓存
媒体列表路由（`GET /admin/media`）在写入操作（上传、更新、删除）后调用 `clear_media_cache()` 清除 `media:list` 缓存键。列表读取当前未主动缓存；缓存层为未来优化预留。
