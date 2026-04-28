# 多媒体处理与存储

> 当前实现状态。部分功能（分片上传、缩略图生成、WebP/AVIF 转换）尚未实施。

## 文件上传流程

```text
编辑器/管理界面中选择文件
       │
       ▼
POST /api/v1/admin/media/upload (Multipart POST)
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

- **`POST /api/v1/admin/media/upload`** — 直接 Multipart POST 上传
- **`POST /api/v1/admin/media/presign-upload`** — 预签名直传 URL（前端直接传 S3）
- **`POST /api/v1/admin/media/finalize`** — 预签名上传完成后登记到数据库

> 上传由 Rust Axum 直接处理，不经过 Next.js BFF 代理。

### 存储后端抽象（枚举分发）

```rust
// storage.rs — 枚举而非 trait，避免动态分发 (dyn dispatch)
pub enum StorageBackend {
    Local(LocalStorage),
    Minio(MinioStorage),
}
```

每个变体（`LocalStorage` / `MinioStorage`）各自实现 `store`、`delete`、`head`、`object_url`、`presigned_upload_url` 等方法，
通过 `StorageBackend` 的 `match self { ... }` 模式派发。

## 媒体表结构

> 表名为 `media`（非 `media_assets`）。

```sql
CREATE TABLE media (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    filename        TEXT NOT NULL,              -- 原始文件名（显示用）
    original_filename TEXT NOT NULL,             -- 上传时的原始文件名
    mime_type       TEXT NOT NULL,
    size_bytes      BIGINT NOT NULL,
    width           INTEGER,
    height          INTEGER,
    storage_path    TEXT NOT NULL,               -- 存储路径（object key）
    cdn_url         TEXT,                        -- CDN 加速 URL
    alt_text        TEXT,
    caption         TEXT,
    uploaded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    media_type      TEXT NOT NULL DEFAULT 'image',  -- image / video / document / other
    usage_count     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- 索引
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_media_media_type ON media(media_type);
CREATE INDEX idx_media_created_at ON media(created_at DESC);
CREATE INDEX idx_media_deleted_at ON media(deleted_at) WHERE deleted_at IS NOT NULL;
```

> 注意：没有 `article_id` 列。文章-媒体关联通过 `post_media` 关联表实现。

支持字段：
- `original_filename` — 原始的、未经重命名的文件名
- `storage_path` — 经过 UUID 重命名的存储路径（object key）
- `cdn_url` — 如果配置了 CDN，这里存储可公开访问的加速 URL
- `caption` — 图片说明文字
- `uploaded_by` — 上传者
- `media_type` — 媒体类型分类（image/video/document/other）
- `usage_count` — 引用计数

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
