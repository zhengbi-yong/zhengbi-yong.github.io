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
       ├─ 存储到后端存储层 (MinIO/本地)
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

> 上传由 Rust Axum 直接处理，不经过 Next.js BFF 代理。

### 存储后端抽象

实际代码使用 **枚举分发模式**（非 trait 模式）：

```rust
// 位于 backend/crates/api/src/storage.rs
pub enum StorageBackend {
    Local(LocalStorage),
    Minio(MinioStorage),
}
```

每个 variant 实现各自的方法：

| 方法 | 说明 |
|------|------|
| `store(key, data, content_type)` | 上传文件 |
| `delete(key)` | 删除文件 |
| `object_url(key)` | 获取对象 URL |
| `head(key)` | 获取文件元信息 |
| `presigned_download_url(key, expires_secs)` | 预签名下载地址 |

**MinioStorage** — 生产环境存储，兼容 AWS S3 API，支持预签名上传/下载。
**LocalStorage** — 开发/测试环境存储，文件保存至本地文件系统。

## 媒体表结构

> 表名为 `media`（位于 `backend/migrations/0004_create_cms_tables.sql`）。

```sql
CREATE TABLE IF NOT EXISTS media (
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
    uploaded_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    media_type        TEXT NOT NULL DEFAULT 'image',
    usage_count       INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_media_type ON media(media_type);
CREATE INDEX idx_media_created_at ON media(created_at DESC);
CREATE INDEX idx_media_deleted_at ON media(deleted_at) WHERE deleted_at IS NOT NULL;
```

### 关键列说明

| 列 | 说明 |
|----|------|
| `filename` | 存储时的 UUID 文件名（防冲突） |
| `original_filename` | 用户上传时的原始文件名 |
| `size_bytes` | 文件大小（字节） |
| `storage_path` | 存储路径（MinIO bucket key 或本地路径） |
| `cdn_url` | CDN 加速 URL（可选，配置后可用） |
| `uploaded_by` | 上传用户（外键 → users.id） |
| `media_type` | 媒体类型分类（`image`, `video`, `document` 等），默认 `image` |
| `usage_count` | 引用计数（被多少文章引用） |
| `deleted_at` | 软删除时间戳 |

> 注：`article_id` 列已在迁移 0004 中移除。文章与媒体的关联通过 junction 表 `post_media` 实现。

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
