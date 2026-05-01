# 内容闭环：离线↔在线全链路打通 实施方案

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 实现「离线 MDX 文件 ↔ 在线数据库文章」的双向闭环，支持单篇/批量导入导出、媒体资产联动、多种格式互转、Git 同步，打造完整的多模态内容创作平台。

**Architecture:** 基于已有的 `tiptap_json_to_mdx()` 和 `mdx_to_tiptap_json()` 转换核心，新增 REST API 端点 + 管理后台 UI，打通「本地文件 → 数据库 → TipTap 编辑器 → MDX 渲染」全链路。

**Tech Stack:** Rust/Axum 后端、Next.js/React 前端、TipTap 编辑器、PostgreSQL、MinIO/S3 媒体存储、YAML frontmatter。

---

## 现有基础设施（无需从零开始）

| 能力 | 实现 | 状态 |
|------|------|------|
| MDX → TipTap JSON | `mdx_to_tiptap_json()` / `mdx_to_blocknote_json()` | ✅ 已有 |
| TipTap JSON → MDX | `tiptap_json_to_mdx()` | ✅ 已有 |
| 文件系统扫描同步 | `POST /admin/sync/mdx` — 扫描 `frontend/data/blog/` | ✅ 已有 |
| 单篇批量 MDX 转换 | `POST /admin/mdx/convert`, `/batch-convert`, `/migrate-all` | ✅ 已有 |
| 媒体上传/管理 | `POST /admin/media/upload`, MinIO/LocalStorage | ✅ 已有 |
| 文章 CRUD | `POST/PATCH/DELETE /admin/posts`, `GET /posts/{slug}` | ✅ 已有 |
| 搜索索引 | Meilisearch + PostgreSQL FTS | ✅ 已有 |
| 版本历史 | `post_versions` 表 + CRUD API | ✅ 已有 |

> **现状缺口：** 没有「从 API 导出完整 MDX」「从 UI 上传/粘贴 MDX 导入」「媒体与文章联动导出」「批量操作 UI」的能力。

---

## 头脑风暴：用户可能需要的完整能力链

在实现核心导入导出之前，先梳理完整的用户场景，确保不做盲区：

### 已有能力 ✅
1. **在线编辑器创作** → TipTap 编辑器 → 保存到数据库 ✅
2. **文件系统同步** → `frontend/data/blog/*.mdx` → 扫描入库 ✅
3. **版本历史** → 每次修改保存版本快照 ✅
4. **搜索/发现** → Meilisearch 全文搜索 ✅

### 本次需要实现的 🔨
5. **导出单篇文章为 MDX** — 管理员点击「导出」→ 下载完整 MDX 文件（含 frontmatter + 正文）
6. **导入 MDX/Markdown 文件** — 上传或粘贴 MDX → 自动解析 → 创建/更新文章
7. **批量导出** — 按筛选条件（分类/标签/状态）导出全部文章为 MDX 文件集合
8. **批量导入** — 拖拽上传多个 MDX 文件 → 批量入库
9. **媒体随文章导出** — 导出 MDX 的同时，打包文章中引用的图片（zip 下载）

### 建议补充的能力 💡
10. **Markdown 纯文本导入** — 除 MDX 外，也支持标准 `.md` 文件
11. **导出为纯 Markdown** — 去掉 MDX 组件语法，导出为通用 Markdown
12. **Notion 导出导入** — 解析 Notion 导出的 Markdown+CSV zip 文件
13. **粘贴 URL 导入** — 粘贴一篇已有文章的 URL，自动抓取正文和元数据
14. **两路自动同步** — `frontend/data/blog/` 文件变更 → 自动同步到数据库（watch 模式）
15. **Git 提交联动** — 导出文章后自动 git commit + push 到博客仓库
16. **导入预览 + 对比** — 导入前预览文章效果，与已有文章 diff 对比
17. **文章模板系统** — 预设模板（技术教程/项目复盘/论文笔记/读书笔记），一键创建
18. **内容定时发布** — 设置 `scheduled_at`，到时间自动从 Draft 改为 Published
19. **多语言文章关联** — 同一篇文章的中英文版本互相关联
20. **内容备份/快照** — 定时自动导出全站文章为 MDX 备份

---

## 分阶段实施计划

### Phase 1: 核心导入导出（最小闭环）— 4 个任务

这是用户的核心诉求，先打通最基本的链路。

---

### Task 1: 后端 — 文章导出为 MDX API

**Objective:** 新增 `GET /admin/posts/{id}/export/mdx` 端点，返回完整的 MDX 文本（含 YAML frontmatter + MDX body）。

**Files:**
- Create: `backend/crates/api/src/routes/export.rs`
- Modify: `backend/crates/api/src/main.rs`（注册路由）
- Modify: `backend/crates/api/src/routes/mod.rs`（添加模块）

**Step 1: 创建 export.rs**

```rust
// backend/crates/api/src/routes/export.rs
//! 文章导出路由

use axum::{
    extract::{Path, State},
    http::header,
    response::IntoResponse,
    Extension, Json,
};
use blog_shared::AppError;
use serde::Serialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;
use crate::middleware::auth::AuthUser;

#[derive(Debug, Serialize, ToSchema)]
pub struct ExportMdxResponse {
    pub slug: String,
    pub mdx: String,
    pub filename: String,
}

/// 导出单篇文章为 MDX 文本
///
/// 从数据库读取文章，组装 YAML frontmatter + MDX 正文，返回完整 MDX 文本。
/// 支持两种来源：
/// - 如果有 content_mdx → 直接使用（已是最佳 MDX 表示）
/// - 否则从 content_json 通过 tiptap_json_to_mdx() 转换
#[utoipa::path(
    get,
    path = "/admin/posts/{id}/export/mdx",
    tag = "admin/export",
    security(("BearerAuth" = [])),
    params(
        ("id" = Uuid, Path, description = "文章 ID"),
    ),
    responses(
        (status = 200, description = "导出成功", body = ExportMdxResponse),
        (status = 404, description = "文章不存在"),
    ),
)]
pub async fn export_post_mdx(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthUser>,
    Path(post_id): Path<Uuid>,
) -> Result<Json<ExportMdxResponse>, AppError> {
    use sqlx::Row;

    // 查询文章数据
    let row = sqlx::query(
        r#"SELECT slug, title, summary, status, published_at, 
                  category_id, show_toc, layout, is_featured,
                  content_mdx, content_json, created_at, updated_at,
                  COALESCE(meta_title, '') as meta_title,
                  COALESCE(meta_description, '') as meta_description,
                  COALESCE(canonical_url, '') as canonical_url
           FROM posts 
           WHERE id = $1 AND deleted_at IS NULL"#
    )
    .bind(post_id)
    .fetch_optional(&state.db)
    .await?;

    let row = match row {
        Some(r) => r,
        None => return Err(AppError::NotFound("Post not found".into())),
    };

    let slug: String = row.get("slug");
    let title: String = row.get("title");
    let summary: Option<String> = row.get("summary");
    let status: String = row.get("status");
    let published_at: Option<String> = row.get("published_at");
    let show_toc: bool = row.get("show_toc");
    let layout: String = row.get("layout");
    let is_featured: bool = row.get("is_featured");
    let meta_title: String = row.get("meta_title");
    let meta_description: String = row.get("meta_description");
    let canonical_url: String = row.get("canonical_url");
    let content_mdx: Option<String> = row.get("content_mdx");
    let content_json: Option<serde_json::Value> = row.get("content_json");
    let created_at: String = row.get("created_at");
    let updated_at: String = row.get("updated_at");

    // 获取分类名称
    let category_name: Option<String> = if let Some(cat_id) = row.get::<Option<Uuid>, _>("category_id") {
        sqlx::query_scalar("SELECT name FROM categories WHERE id = $1")
            .bind(cat_id)
            .fetch_optional(&state.db)
            .await?
    } else {
        None
    };

    // 获取标签
    let tags: Vec<String> = sqlx::query_scalar(
        r#"SELECT t.name FROM tags t
           JOIN post_tags pt ON t.id = pt.tag_id
           WHERE pt.post_id = $1
           ORDER BY t.name"#
    )
    .bind(post_id)
    .fetch_all(&state.db)
    .await?;

    // 获取 MDX 正文
    let body_mdx = match &content_mdx {
        Some(mdx) if !mdx.trim().is_empty() => mdx.clone(),
        _ => {
            match &content_json {
                Some(json) => blog_core::tiptap_json_to_mdx(json),
                None => String::new(),
            }
        }
    };

    // 生成日期字符串
    let date_str = published_at
        .as_ref()
        .or(Some(&created_at))
        .map(|d| d.chars().take(10).collect::<String>())
        .unwrap_or_else(|| chrono::Utc::now().format("%Y-%m-%d").to_string());

    // 组装 YAML frontmatter
    let mut frontmatter = String::new();
    frontmatter.push_str("---\n");
    frontmatter.push_str(&format!("title: '{}'\n", yaml_escape(&title)));
    frontmatter.push_str(&format!("date: '{}'\n", date_str));

    if let Some(ref cat) = category_name {
        frontmatter.push_str(&format!("category: '{}'\n", yaml_escape(cat)));
    }

    if !tags.is_empty() {
        frontmatter.push_str("tags:\n");
        for t in &tags {
            frontmatter.push_str(&format!("  - '{}'\n", yaml_escape(t)));
        }
    }

    if let Some(ref s) = summary {
        frontmatter.push_str(&format!("summary: '{}'\n", yaml_escape(s)));
    }

    if status.to_lowercase() == "draft" {
        frontmatter.push_str("draft: true\n");
    } else {
        frontmatter.push_str("draft: false\n");
    }

    if !meta_title.is_empty() {
        frontmatter.push_str(&format!("meta_title: '{}'\n", yaml_escape(&meta_title)));
    }
    if !meta_description.is_empty() {
        frontmatter.push_str(&format!("description: '{}'\n", yaml_escape(&meta_description)));
    }
    if !canonical_url.is_empty() {
        frontmatter.push_str(&format!("canonicalUrl: '{}'\n", yaml_escape(&canonical_url)));
    }

    frontmatter.push_str(&format!("showTOC: {}\n", show_toc));
    frontmatter.push_str(&format!("layout: '{}'\n", layout));
    frontmatter.push_str(&format!("is_featured: {}\n", is_featured));
    frontmatter.push_str("---\n\n");

    let full_mdx = format!("{}{}", frontmatter, body_mdx);
    let safe_filename = slug_to_filename(&slug);

    Ok(Json(ExportMdxResponse {
        slug: slug.clone(),
        mdx: full_mdx,
        filename: format!("{}.mdx", safe_filename),
    }))
}

/// 导出为纯 Markdown（去除 frontmatter 和 MDX 组件语法）
#[utoipa::path(
    get,
    path = "/admin/posts/{id}/export/md",
    tag = "admin/export",
    security(("BearerAuth" = [])),
    params(
        ("id" = Uuid, Path, description = "文章 ID"),
    ),
    responses(
        (status = 200, description = "导出成功"),
    ),
)]
pub async fn export_post_md(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthUser>,
    Path(post_id): Path<Uuid>,
) -> Result<Json<ExportMdxResponse>, AppError> {
    // 与 export_post_mdx 类似，但只返回 body（不含 frontmatter），
    // 且通过 tiptap_json_to_mdx() 获取纯 Markdown 表示
    let ExportMdxResponse { slug, mdx, .. } = 
        export_post_mdx(State(state), Extension(_auth_user), Path(post_id)).await?.0;
    
    // 提取 body（去掉 frontmatter）
    let body = if let Some(idx) = mdx.find("\n---\n") {
        mdx[idx + 5..].trim().to_string()
    } else {
        mdx.clone()
    };

    Ok(Json(ExportMdxResponse {
        slug,
        mdx: body,
        filename: format!("{}.md", slug_to_filename(&slug)),
    }))
}

/// 批量导出：按筛选条件导出多篇文章为 MDX 文本列表
#[utoipa::path(
    post,
    path = "/admin/posts/export/batch",
    tag = "admin/export",
    security(("BearerAuth" = [])),
    responses(
        (status = 200, description = "批量导出成功"),
    ),
)]
pub async fn batch_export_posts(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Json(query): Json<BatchExportQuery>,
) -> Result<Json<Vec<ExportMdxResponse>>, AppError> {
    // 根据筛选条件查询文章，逐个组装 MDX 返回
    // 筛选条件: status, category_id, tag_id, ids (指定 ID 列表)
    // ...
}

// 辅助函数

fn yaml_escape(s: &str) -> String {
    // 处理 YAML 中的特殊字符：单引号需要转义为 ''
    s.replace('\'', "''")
}

fn slug_to_filename(slug: &str) -> String {
    slug.replace('/', "-").replace('\\', "-")
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct BatchExportQuery {
    pub ids: Option<Vec<Uuid>>,
    pub status: Option<String>,
    pub category_id: Option<Uuid>,
    pub tag_id: Option<Uuid>,
}
```

**Step 2: 注册路由** — 在 `main.rs` 中添加：

```rust
.route("/admin/posts/{id}/export/mdx", get(blog_api::routes::export::export_post_mdx))
.route("/admin/posts/{id}/export/md", get(blog_api::routes::export::export_post_md))
.route("/admin/posts/export/batch", post(blog_api::routes::export::batch_export_posts))
```

**Step 3: 构建并测试**

```bash
docker compose -f docker-compose.local.yml build api
docker compose -f docker-compose.local.yml up -d api
# 登录后测试
curl -b /tmp/cookies.txt http://localhost:3000/api/v1/admin/posts/{id}/export/mdx
```

**Verification:**
- 返回 HTTP 200 + JSON `{slug, mdx, filename}`
- `mdx` 字段包含完整的 YAML frontmatter + Markdown body
- 中文标题正确处理（不出现编码问题）
- 不存在文章返回 404

---

### Task 2: 前端 — 文章列表页「导出」按钮

**Objective:** 在文章管理列表页每行添加「导出 MDX」按钮，点击后下载 .mdx 文件。

**Files:**
- Modify: `frontend/src/app/(admin)/admin/posts-manage/page.tsx`
- (可选) Create: `frontend/src/lib/utils/download-file.ts`

**Step 1: 添加下载工具函数**

```typescript
// frontend/src/lib/utils/download-file.ts
export function downloadFile(content: string, filename: string, mimeType = 'text/markdown') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

**Step 2: 在 posts-manage/page.tsx 中添加导出逻辑**

在操作列中增加一个「导出」按钮：

```tsx
// 在 handleDelete 附近添加
const handleExportMdx = async (postId: string, slug: string) => {
  try {
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/admin/posts/${postId}/export/mdx`,
      { credentials: 'include' }
    )
    if (!resp.ok) throw new Error('Export failed')
    const data = await resp.json()
    downloadFile(data.mdx, data.filename, 'text/markdown')
  } catch (e) {
    console.error('Export failed:', e)
    alert('导出失败')
  }
}

// 表格操作列中添加按钮
<Button variant="ghost" size="sm" onClick={() => handleExportMdx(post.id, post.slug)}>
  导出
</Button>
```

**Step 3: 重建前端并测试**

```bash
docker compose -f docker-compose.local.yml build frontend
docker compose -f docker-compose.local.yml up -d frontend
# 浏览器访问 /admin/posts-manage，点击「导出」按钮
```

**Verification:**
- 点击「导出」触发浏览器下载 .mdx 文件
- 下载的文件可被 VS Code 等编辑器正常打开
- YAML frontmatter 正确显示标题、日期、分类、标签等信息

---

### Task 3: 后端 — MDX 单篇导入 API

**Objective:** 新增 `POST /admin/posts/import/mdx` 端点，接收 MDX 文本并创建/更新文章。

**Files:**
- Create: `backend/crates/api/src/routes/import_mdx.rs`
- Modify: `backend/crates/api/src/main.rs`
- Modify: `backend/crates/api/src/routes/mod.rs`

**Step 1: 创建 import_mdx.rs**

```rust
// backend/crates/api/src/routes/import_mdx.rs
//! MDX 导入路由

use axum::{extract::State, Extension, Json};
use blog_shared::AppError;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;
use crate::middleware::auth::AuthUser;

#[derive(Debug, Deserialize, ToSchema)]
pub struct ImportMdxRequest {
    /// 原始 MDX 文本（含 YAML frontmatter + 正文）
    pub mdx_text: String,
    /// 目标 slug（如果为空则自动生成或从 frontmatter 推断）
    pub slug: Option<String>,
    /// 行为模式
    #[serde(default)]
    pub mode: ImportMode,
}

#[derive(Debug, Deserialize, ToSchema, Default, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ImportMode {
    /// 创建新文章（slug 已存在则报错）
    #[default]
    Create,
    /// 创建新文章，如果 slug 已存在则更新
    Upsert,
    /// 仅更新已存在的文章（不存在则报错）
    Update,
    /// 预览模式：返回解析结果但不写入数据库
    Preview,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ImportMdxResponse {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub status: String,
    /// Mode=Preview 时以下字段有效
    pub preview: Option<ImportPreview>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ImportPreview {
    pub frontmatter: serde_json::Value,
    pub content_json: serde_json::Value,
    pub word_count: usize,
    pub reading_time_minutes: u32,
}

/// 导入 MDX 文本为文章
///
/// 解析 YAML frontmatter + MDX body，转换并写入数据库。
/// 支持 Preview/Create/Upsert/Update 四种模式。
#[utoipa::path(
    post,
    path = "/admin/posts/import/mdx",
    tag = "admin/import",
    security(("BearerAuth" = [])),
    request_body = ImportMdxRequest,
    responses(
        (status = 200, description = "导入成功"),
        (status = 409, description = "slug 已存在（Create 模式）"),
    ),
)]
pub async fn import_mdx(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Json(req): Json<ImportMdxRequest>,
) -> Result<Json<ImportMdxResponse>, AppError> {
    // 1. 解析 YAML frontmatter
    let (frontmatter, body) = parse_mdx_frontmatter(&req.mdx_text)?;
    
    let title = frontmatter.title.clone().ok_or(AppError::BadRequest("缺少 title".into()))?;
    let slug = req.slug
        .or(frontmatter.slug)
        .unwrap_or_else(|| title_to_slug(&title));
    
    // 2. 转换 MDX body → TipTap JSON
    let content_json = blog_core::mdx_to_tiptap_json(&body);
    
    // 3. 根据模式处理
    match req.mode {
        ImportMode::Preview => {
            let word_count = body.split_whitespace().count();
            let reading_time = (word_count as f64 / 300.0).ceil() as u32; // 300 wpm 中文
            
            Ok(Json(ImportMdxResponse {
                id: Uuid::nil(),
                slug: slug.clone(),
                title,
                status: "preview".into(),
                preview: Some(ImportPreview {
                    frontmatter: serde_json::to_value(&frontmatter).unwrap_or_default(),
                    content_json,
                    word_count,
                    reading_time_minutes: reading_time.max(1),
                }),
            }))
        }
        ImportMode::Create => {
            // 检查 slug 是否已存在
            let exists: bool = sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM posts WHERE slug = $1 AND deleted_at IS NULL)"
            )
            .bind(&slug)
            .fetch_one(&state.db)
            .await?;
            
            if exists {
                return Err(AppError::Conflict(format!("slug '{}' 已存在", slug)));
            }
            
            let post_id = create_post_from_mdx(&state, &auth_user, &slug, &frontmatter, &body, &content_json).await?;
            
            Ok(Json(ImportMdxResponse {
                id: post_id,
                slug,
                title,
                status: "created".into(),
                preview: None,
            }))
        }
        ImportMode::Upsert => {
            let existing = sqlx::query_scalar::<_, Option<Uuid>>(
                "SELECT id FROM posts WHERE slug = $1 AND deleted_at IS NULL"
            )
            .bind(&slug)
            .fetch_optional(&state.db)
            .await?;
            
            let post_id = match existing {
                Some(id) => {
                    update_post_from_mdx(&state, id, &frontmatter, &body, &content_json).await?;
                    id
                }
                None => {
                    create_post_from_mdx(&state, &auth_user, &slug, &frontmatter, &body, &content_json).await?
                }
            };
            
            Ok(Json(ImportMdxResponse {
                id: post_id,
                slug,
                title,
                status: "upserted".into(),
                preview: None,
            }))
        }
        ImportMode::Update => {
            let existing = sqlx::query_scalar::<_, Option<Uuid>>(
                "SELECT id FROM posts WHERE slug = $1 AND deleted_at IS NULL"
            )
            .bind(&slug)
            .fetch_optional(&state.db)
            .await?;
            
            match existing {
                Some(id) => {
                    update_post_from_mdx(&state, id, &frontmatter, &body, &content_json).await?;
                    Ok(Json(ImportMdxResponse {
                        id,
                        slug,
                        title,
                        status: "updated".into(),
                        preview: None,
                    }))
                }
                None => Err(AppError::NotFound(format!("slug '{}' 不存在", slug))),
            }
        }
    }
}

/// 从 MDX 创建文章到数据库
async fn create_post_from_mdx(
    state: &AppState,
    auth_user: &AuthUser,
    slug: &str,
    fm: &ParsedFrontmatter,
    body: &str,
    content_json: &serde_json::Value,
) -> Result<Uuid, AppError> {
    let id = Uuid::new_v4();
    let content_mdx = Some(body.to_string()); // 保留原始 MDX 作为缓存
    
    // 计算阅读时间
    // ... 插入 posts 表，处理标签、分类等
    Ok(id)
}

async fn update_post_from_mdx(
    state: &AppState,
    post_id: Uuid,
    fm: &ParsedFrontmatter,
    body: &str,
    content_json: &serde_json::Value,
) -> Result<(), AppError> {
    // 更新 posts 表
    Ok(())
}

/// 解析 YAML frontmatter（复用 mdx_sync.rs 的逻辑）
fn parse_mdx_frontmatter(text: &str) -> Result<(ParsedFrontmatter, String), AppError> {
    // 检测 --- 分隔符
    // 使用 serde_yaml 解析，提取 title, date, tags, category, summary, draft 等字段
    // 返回 ParsedFrontmatter 和 body 部分
    // ...
}
```

**Step 4: 注册路由**

```rust
// main.rs
.route("/admin/posts/import/mdx", post(blog_api::routes::import_mdx::import_mdx))
```

**Step 5: 构建测试**

```bash
curl -X POST http://localhost:3000/api/v1/admin/posts/import/mdx \
  -H 'Content-Type: application/json' \
  -b /tmp/cookies.txt \
  -d '{"mdx_text": "---\ntitle: 测试导入\n---\n\n# Hello\n\n这是一篇测试文章。", "mode": "preview"}'
```

**Verification:**
- Preview 模式返回解析结果（不写入 DB）
- Create 模式创建新文章，返回新 UUID
- Upsert 模式创建或更新
- 中文 frontmatter 正确处理

---

### Task 4: 前端 — 导入 MDX UI

**Objective:** 在管理后台添加「导入 MDX」页面，支持粘贴文本或上传文件。

**Files:**
- Create: `frontend/src/app/(admin)/admin/posts/import/page.tsx`
- Modify: `frontend/src/app/(admin)/admin/posts-manage/page.tsx`（添加跳转链接）

**Step 1: 创建导入页面**

```tsx
'use client'

// 支持三种导入方式：
// 1. 粘贴 MDX 文本到 textarea
// 2. 拖拽/选择 .mdx/.md 文件
// 3. 粘贴外部文章 URL（Phase 2 实现）

// 导入流程：
// 1. 选模式：preview / create / upsert
// 2. 输入 MDX → 点击「预览」
// 3. 显示预览结果（标题、元数据、渲染效果）
// 4. 确认无误 → 点击「导入」
// 5. 显示成功提示 + 链接到编辑页面
```

**Step 2: 添加入口**

在 `posts-manage/page.tsx` 的 PageHeader 中添加：

```tsx
<Button variant="outline" asChild>
  <Link href="/admin/posts/import">
    <Upload className="mr-1.5 h-4 w-4" />
    导入 MDX
  </Link>
</Button>
```

**Verification:**
- 能通过粘贴或文件上传导入 MDX
- 预览功能显示解析后的元数据和内容
- 导入后文章出现在列表中

---

### Phase 2: 批量操作 + 媒体联动 — 2 个任务

---

### Task 5: 批量导出 API + UI

**Objective:** 支持按条件（筛选/多选）批量导出文章为 ZIP 包。

**Files:**
- Modify: `backend/crates/api/src/routes/export.rs`（完善 batch_export）
- Modify: `frontend/src/app/(admin)/admin/posts-manage/page.tsx`（批量导出按钮）

**Key decisions:**
- 使用 `zip` crate 在服务端打包
- 支持「仅导出选中文章」「导出当前筛选结果」
- 可选包含媒体文件（Phase 3）

**Verification:**
- 选择多篇文章 → 批量导出 → 下载 zip
- zip 包内每篇文章一个 .mdx 文件

---

### Task 6: 批量导入 API + UI

**Objective:** 支持批量上传多个 MDX/MD 文件。

**Files:**
- Modify: `backend/crates/api/src/routes/import_mdx.rs`（batch_import）
- Modify: `frontend/src/app/(admin)/admin/posts/import/page.tsx`（批量模式）

**Key decisions:**
- 使用 multipart/form-data 上传（axum 已支持）
- 每个文件独立处理，返回每个文件的结果
- 支持「全部 Upsert」模式

**Verification:**
- 拖拽 5 个 MDX 文件 → 批量导入 → 5 篇新文章

---

### Phase 3: 媒体联动 — 1 个任务

---

### Task 7: 导出时打包媒体 + 导入时自动上传媒体

**Objective:** 导出 MDX 时可选打包图片，导入 MDX 时自动上传引用的本地图片。

**Files:**
- Modify: `backend/crates/api/src/routes/export.rs`
- Modify: `backend/crates/api/src/routes/import_mdx.rs`
- Modify: `backend/crates/api/src/storage.rs`

**Implementation:**
- 导出：扫描 MDX 中的图片引用 → 从 MinIO/LocalStorage 读取 → 打包进 zip
- 导入：扫描 MDX 中的相对路径图片 → 上传到 MinIO → 替换为 CDN URL

**Verification:**
- 导出一篇带图片的文章 → 解压 zip → 图片可用
- 导入含本地图片引用的 MDX → 图片自动上传 → 文章内引用更新

---

### Phase 4: Git 同步 + Watch 模式 — 1 个任务

---

### Task 8: 自动同步到 Git 仓库

**Objective:** 导出文章后自动 git commit + push 到博客仓库。

**Files:**
- Modify: `backend/crates/api/src/routes/export.rs`

**Implementation:**
- 导出时将 MDX 写入 `frontend/data/blog/` 对应路径
- 自动 `git add` + `git commit` + `git push`
- 通过 API 参数控制是否自动 push

**Verification:**
- 导出文章 → GitHub 仓库出现新 commit

---

### Phase 5: 高级功能 — 3 个任务

---

### Task 9: 两路自动同步（Watch 模式）

**Objective:** 监控 `frontend/data/blog/` 目录，文件变更自动同步到数据库。

```
frontend/data/blog/*.mdx  ──watch──> 自动同步到 PostgreSQL
                                    ↓
                               搜索索引更新
                                    ↓
                               前端实时可见
```

**Implementation:**
- 使用 `notify` crate 监听文件系统变更
- 已有 `/admin/sync/mdx` 端点，在其基础上改为增量同步
- 提供开关（环境变量 `MDX_WATCH_ENABLED`）

---

### Task 10: 文章模板系统

**Objective:** 预置模板 + 自定义模板，一键创建文章骨架。

**模板类型:**
- 技术教程（含代码块示例）
- 项目复盘（含时间线、成果展示）
- 论文笔记（含摘要、方法、结论结构）
- 读书笔记（含金句摘录、个人思考）
- 周报/月报

**Implementation:**
- 模板以 MDX 文件存储在 `frontend/data/templates/`
- API: `GET /admin/templates` 列出可用模板
- 创建文章时选择模板 → 预填 TipTap 编辑器

---

### Task 11: Notion / Jupyter 导入

**Objective:** 支持导入 Notion 导出的 Markdown+CSV zip，以及 Jupyter .ipynb 文件。

**Implementation:**
- Notion: 解析 zip 中的 .md 文件 + 数据库 CSV → 批量导入
- Jupyter: 解析 .ipynb → 提取 markdown cells + code cells → MDX

---

## 优先级建议

```
🔥 立即实施（核心闭环）:
  Task 1 → Task 2 → Task 3 → Task 4
  完成后即可实现「导出 MDX → 本地编辑 → 导入 MDX」的基本闭环

⭐ 尽快实施（生产效率）:
  Task 5 + Task 6（批量操作）
  Task 7（媒体联动）

📋 后续迭代（体验优化）:
  Task 8（Git 同步）
  Task 9（Watch 模式）
  Task 10（模板系统）

🔮 长期规划:
  Task 11（多格式导入）
  多语言文章关联
  内容定时发布
```

---

## 总估计工作量

| Phase | 任务数 | 估计工时 | 核心价值 |
|-------|--------|---------|---------|
| Phase 1 (核心闭环) | 4 | 6-8h | 打通导入导出基本链路 |
| Phase 2 (批量操作) | 2 | 3-4h | 批量处理效率提升 |
| Phase 3 (媒体联动) | 1 | 3-4h | 图片资产随文章流转 |
| Phase 4 (Git 同步) | 1 | 2-3h | 对接 CI/CD 发布流程 |
| Phase 5 (高级功能) | 3 | 6-10h | 模板/自动同步/多格式 |
| **合计** | **11** | **20-29h** | — |
