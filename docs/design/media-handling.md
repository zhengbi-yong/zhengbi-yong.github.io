# 多媒体处理与存储

> 来源：EDITOR_SYSTEM_DESIGN.md P5

## 设计原则

**多媒体外置**：二进制资产存 S3/MinIO，JSON 中仅保留元数据和 URL 指针。

## 文件上传流程

```
编辑器中选择文件
       │
       ▼
Next.js BFF /api/upload
       │  Multipart POST
       ▼
Rust Axum /api/v1/upload
       │
       ├─ 文件类型检测 (MIME)
       ├─ 病毒扫描 (ClamAV 可选)
       ├─ 生成 UUID 文件名 (防冲突)
       ├─ 存储到 S3/MinIO
       └─ 记录到 media_assets 表
              │
              ▼
       返回 { url, filename, mime_type, size }
              │
              ▼
       编辑器插入 <img src={url} />
```

## 媒体表结构

```sql
CREATE TABLE media_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename        VARCHAR(255) NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    file_size       BIGINT NOT NULL,
    storage_path    TEXT NOT NULL,     -- S3 路径
    url             TEXT NOT NULL,     -- CDN/访问 URL
    width           INTEGER,           -- 图片/视频宽度
    height          INTEGER,           -- 图片/视频高度
    duration        FLOAT,             -- 音视频时长(秒)
    uploader_id     UUID NOT NULL REFERENCES users(id),
    article_id      UUID REFERENCES articles(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

## API 分片上传

对于大文件（>100MB），支持分片上传：

```
1. POST /api/v1/upload/init     → { upload_id, chunk_size }
2. PUT /api/v1/upload/{upload_id}/chunk/{index}  → 逐片上传
3. POST /api/v1/upload/{upload_id}/complete      → 合并
```

## 图片优化

| 格式 | 场景 | 说明 |
|------|------|------|
| WebP | 照片/截图 | 有损压缩，Chrome 原生支持 |
| AVIF | 高质量图片 | 压缩率比 WebP 高 30% |
| SVG | 图标/图表 | 矢量无损，可缩放 |
| 原始格式 | 编辑器原图 | 保留原始文件，作为备份 |

- 上传时生成 3 种尺寸缩略图（thumbnail 150px, medium 800px, full original）
- Next.js `<Image>` 组件自动响应式选择
