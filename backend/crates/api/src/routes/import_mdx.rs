//! MDX/Markdown 导入路由
//!
//! 将 MDX 文本解析并导入为数据库文章。

use axum::{
    extract::State,
    Extension, Json,
};
use blog_core::mdx_to_blocknote_json;
use blog_shared::middleware::auth::AuthUser;
use blog_shared::AppError;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::state::AppState;

// ============================================================================
// Request / Response types
// ============================================================================

#[derive(Debug, Deserialize, ToSchema)]
pub struct ImportMdxRequest {
    /// 原始 MDX 文本（含 YAML frontmatter + 正文）
    pub mdx_text: String,
    /// 目标 slug（如果为空则从 frontmatter 派生或从标题生成）
    #[serde(default)]
    pub slug: Option<String>,
    /// 行为模式
    #[serde(default)]
    pub mode: ImportMode,
}

#[derive(Debug, Deserialize, ToSchema, Default, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ImportMode {
    /// 预览模式：返回解析结果但不写入数据库
    #[default]
    Preview,
    /// 创建新文章（slug 已存在则报错）
    Create,
    /// 创建新文章，如果 slug 已存在则更新
    Upsert,
    /// 仅更新已存在的文章（不存在则报错）
    Update,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ImportMdxResponse {
    pub id: Option<Uuid>,
    pub slug: String,
    pub title: String,
    pub action: String,
    /// 预览模式下有效
    pub preview: Option<ImportPreview>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ImportPreview {
    pub frontmatter: serde_json::Value,
    pub word_count: usize,
    pub reading_time_minutes: u32,
    pub has_content: bool,
}

// ============================================================================
// Frontmatter 解析结构
// ============================================================================

#[derive(Debug, Clone, Default)]
struct ParsedFrontmatter {
    title: Option<String>,
    date: Option<String>,
    category: Option<String>,
    summary: Option<String>,
    tags: Vec<String>,
    draft: bool,
    show_toc: bool,
    layout: Option<String>,
    slug: Option<String>,
}

// ============================================================================
// Handlers
// ============================================================================

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
        (status = 200, description = "导入成功", body = ImportMdxResponse),
        (status = 400, description = "缺少 title 或格式错误"),
        (status = 409, description = "slug 已存在（Create 模式）"),
        (status = 404, description = "文章不存在（Update 模式）"),
    ),
)]
pub async fn import_mdx(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Json(req): Json<ImportMdxRequest>,
) -> Result<Json<ImportMdxResponse>, AppError> {
    // ── 1. 解析 frontmatter ──────────────────────────────────────────
    let (frontmatter, body) = parse_frontmatter(&req.mdx_text)?;
    let title = frontmatter
        .title
        .clone()
        .ok_or_else(|| AppError::BadRequest("缺少 title（请在 frontmatter 中指定）".into()))?;

    // 确定 slug
    let slug = req
        .slug
        .clone()
        .or(frontmatter.slug.clone())
        .unwrap_or_else(|| title_to_slug(&title));

    // ── 2. 转换 MDX body → BlockNote JSON ────────────────────────────
    let content_json = mdx_to_blocknote_json(&body);
    let word_count = count_words(&body);
    let reading_time = (word_count as f64 / 300.0).ceil() as u32; // ~300 wpm 中文

    // ── 3. Preview 模式 ──────────────────────────────────────────────
    if req.mode == ImportMode::Preview {
        return Ok(Json(ImportMdxResponse {
            id: None,
            slug,
            title,
            action: "preview".into(),
            preview: Some(ImportPreview {
                frontmatter: serde_json::json!({
                    "title": frontmatter.title,
                    "date": frontmatter.date,
                    "category": frontmatter.category,
                    "summary": frontmatter.summary,
                    "tags": frontmatter.tags,
                    "draft": frontmatter.draft,
                    "show_toc": frontmatter.show_toc,
                    "layout": frontmatter.layout,
                }),
                word_count,
                reading_time_minutes: reading_time.max(1),
                has_content: !body.trim().is_empty(),
            }),
        }));
    }

    // ── 4. Create 模式 ───────────────────────────────────────────────
    if req.mode == ImportMode::Create {
        let exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM posts WHERE slug = $1 AND deleted_at IS NULL)",
        )
        .bind(&slug)
        .fetch_one(&state.db)
        .await?;

        if exists {
            return Err(AppError::Conflict(format!("slug '{}' 已存在，请使用 Upsert 模式或更换 slug", slug)));
        }

        let post_id = insert_post(
            &state.db, &auth_user, &slug, &title, &frontmatter, &body, &content_json,
        )
        .await?;

        return Ok(Json(ImportMdxResponse {
            id: Some(post_id),
            slug,
            title,
            action: "created".into(),
            preview: None,
        }));
    }

    // ── 5. Upsert 模式 ───────────────────────────────────────────────
    if req.mode == ImportMode::Upsert {
        let existing = sqlx::query_scalar::<_, Uuid>(
            "SELECT id FROM posts WHERE slug = $1 AND deleted_at IS NULL",
        )
        .bind(&slug)
        .fetch_optional(&state.db)
        .await?;

        let response_slug = slug.clone();
        let response_title = title.clone();
        return match existing {
            Some(id) => {
                update_post(&state.db, id, &title, &frontmatter, &body, &content_json).await?;
                Ok(Json(ImportMdxResponse {
                    id: Some(id),
                    slug: response_slug,
                    title: response_title,
                    action: "updated".into(),
                    preview: None,
                }))
            }
            None => {
                let post_id = insert_post(
                    &state.db, &auth_user, &slug, &title, &frontmatter, &body, &content_json,
                )
                .await?;
                Ok(Json(ImportMdxResponse {
                    id: Some(post_id),
                    slug,
                    title,
                    action: "created".into(),
                    preview: None,
                }))
            }
        }
    }

    // ── 6. Update 模式 ───────────────────────────────────────────────
    if req.mode == ImportMode::Update {
        let existing = sqlx::query_scalar::<_, Uuid>(
            "SELECT id FROM posts WHERE slug = $1 AND deleted_at IS NULL",
        )
        .bind(&slug)
        .fetch_optional(&state.db)
        .await?;

        let response_slug = slug.clone();
        let response_title = title.clone();
        return match existing {
            Some(id) => {
                update_post(&state.db, id, &title, &frontmatter, &body, &content_json).await?;
                Ok(Json(ImportMdxResponse {
                    id: Some(id),
                    slug: response_slug,
                    title: response_title,
                    action: "updated".into(),
                    preview: None,
                }))
            }
            None => Err(AppError::NotFound(format!("slug '{}' 不存在，请使用 Create 或 Upsert 模式", slug))),
        }
    } else {
        // 兜底（不应到达）
        Err(AppError::InternalError)
    }
}

// ============================================================================
// 数据库操作
// ============================================================================

async fn insert_post(
    db: &sqlx::PgPool,
    auth_user: &AuthUser,
    slug: &str,
    title: &str,
    fm: &ParsedFrontmatter,
    body: &str,
    content_json: &serde_json::Value,
) -> Result<Uuid, AppError> {
    let post_id = Uuid::new_v4();
    let status: &str = if fm.draft { "draft" } else { "published" };
    let reading_time = (count_words(body) as f64 / 300.0).ceil() as i32;

    // 解析分类
    let category_id = if let Some(ref cat_name) = fm.category {
        upsert_category(db, cat_name).await?
    } else {
        None
    };

    // 解析日期
    let published_at = if !fm.draft {
        fm.date.as_deref().and_then(parse_date_loose)
    } else {
        None
    };

    sqlx::query(
        r#"INSERT INTO posts (
            id, slug, title, content, summary, cover_image_id,
            status, published_at, category_id, author_id,
            show_toc, layout, is_featured, content_format,
            reading_time, content_json, content_mdx
        ) VALUES (
            $1, $2, $3, $4, $5, NULL,
            $6::post_status, $7, $8, $9,
            $10, $11, false, 'mdx',
            $12, $13, $14
        )"#,
    )
    .bind(post_id)
    .bind(slug)
    .bind(title)
    .bind(body)
    .bind(&fm.summary)
    .bind(status)
    .bind(published_at)
    .bind(category_id)
    .bind(auth_user.id)
    .bind(fm.show_toc)
    .bind(fm.layout.as_deref().unwrap_or("PostLayout"))
    .bind(reading_time.max(1))
    .bind(content_json)
    .bind(body)
    .execute(db)
    .await?;

    // 处理标签
    for tag_name in &fm.tags {
        let tag_id = upsert_tag(db, tag_name).await?;
        let _ = sqlx::query(
            "INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(post_id)
        .bind(tag_id)
        .execute(db)
        .await;
    }

    // 创建初始版本
    let _ = sqlx::query(
        r#"INSERT INTO post_versions (post_id, version_number, title, content, summary, change_log, created_by)
           VALUES ($1, 1, $2, $3, $4, '初始导入', $5)"#,
    )
    .bind(post_id)
    .bind(title)
    .bind(body)
    .bind(&fm.summary)
    .bind(auth_user.id)
    .execute(db)
    .await;

    Ok(post_id)
}

async fn update_post(
    db: &sqlx::PgPool,
    post_id: Uuid,
    title: &str,
    fm: &ParsedFrontmatter,
    body: &str,
    content_json: &serde_json::Value,
) -> Result<(), AppError> {
    let status: &str = if fm.draft { "draft" } else { "published" };
    let reading_time = (count_words(body) as f64 / 300.0).ceil() as i32;

    let category_id = if let Some(ref cat_name) = fm.category {
        upsert_category(db, cat_name).await?
    } else {
        None
    };

    let published_at = if !fm.draft {
        fm.date.as_deref().and_then(parse_date_loose)
    } else {
        None
    };

    sqlx::query(
        r#"UPDATE posts SET
            title = $1, content = $2, summary = $3,
            status = $4::post_status, published_at = $5,
            category_id = $6, show_toc = $7, layout = $8,
            reading_time = $9, content_json = $10, content_mdx = $11,
            updated_at = NOW()
           WHERE id = $12"#,
    )
    .bind(title)
    .bind(body)
    .bind(&fm.summary)
    .bind(status)
    .bind(published_at)
    .bind(category_id)
    .bind(fm.show_toc)
    .bind(fm.layout.as_deref().unwrap_or("PostLayout"))
    .bind(reading_time.max(1))
    .bind(content_json)
    .bind(body)
    .bind(post_id)
    .execute(db)
    .await?;

    // 更新标签（先删后插）
    let _ = sqlx::query("DELETE FROM post_tags WHERE post_id = $1")
        .bind(post_id)
        .execute(db)
        .await;

    for tag_name in &fm.tags {
        let tag_id = upsert_tag(db, tag_name).await?;
        let _ = sqlx::query(
            "INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(post_id)
        .bind(tag_id)
        .execute(db)
        .await;
    }

    Ok(())
}

async fn upsert_category(db: &sqlx::PgPool, name: &str) -> Result<Option<Uuid>, AppError> {
    let existing = sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM categories WHERE name = $1",
    )
    .bind(name)
    .fetch_optional(db)
    .await?;

    match existing {
        Some(id) => Ok(Some(id)),
        None => {
            let id = Uuid::new_v4();
            let slug = name.to_lowercase().replace(' ', "-");
            sqlx::query(
                "INSERT INTO categories (id, slug, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
            )
            .bind(id)
            .bind(&slug)
            .bind(name)
            .execute(db)
            .await?;
            Ok(Some(id))
        }
    }
}

async fn upsert_tag(db: &sqlx::PgPool, name: &str) -> Result<Uuid, AppError> {
    let existing = sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM tags WHERE name = $1",
    )
    .bind(name)
    .fetch_optional(db)
    .await?;

    match existing {
        Some(id) => Ok(id),
        None => {
            let id = Uuid::new_v4();
            let slug = name.to_lowercase().replace(' ', "-");
            sqlx::query(
                "INSERT INTO tags (id, slug, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
            )
            .bind(id)
            .bind(&slug)
            .bind(name)
            .execute(db)
            .await?;
            Ok(id)
        }
    }
}

// ============================================================================
// Frontmatter 解析（轻量版，适合 API 输入）
// ============================================================================

fn parse_frontmatter(text: &str) -> Result<(ParsedFrontmatter, String), AppError> {
    let trimmed = text.trim();
    let mut fm = ParsedFrontmatter::default();

    // 检查 frontmatter 分隔符
    if !trimmed.starts_with("---") {
        // 没有 frontmatter：整个文本当作正文，标题从第一行提取
        let body = trimmed.to_string();
        let title = trimmed.lines().next().unwrap_or("").trim().to_string();
        let title = if title.starts_with('#') {
            title.trim_start_matches('#').trim().to_string()
        } else {
            title
        };
        fm.title = if title.is_empty() { None } else { Some(title) };
        return Ok((fm, body));
    }

    // 跳过第一个 ---
    let after_first = &trimmed[3..];
    let end_idx = after_first
        .find("\n---")
        .or_else(|| after_first.find("\n---\r"))
        .unwrap_or(after_first.len());

    let frontmatter_str = &after_first[..end_idx];
    let body = if end_idx < after_first.len() {
        let body_start = after_first[end_idx..]
            .find('\n')
            .map(|n| end_idx + n + 1)
            .unwrap_or(after_first.len());
        after_first[body_start..].trim().to_string()
    } else {
        after_first.trim().to_string()
    };

    // 简单行解析 frontmatter
    let mut pending_list_key: Option<String> = None;
    for line in frontmatter_str.lines() {
        let line = line.trim();
        if line.is_empty() {
            pending_list_key = None;
            continue;
        }

        // 处理列表项（如 tags）
        if let Some(ref key) = pending_list_key {
            if let Some(value) = line.strip_prefix("- ") {
                if key == "tags" {
                    let v = strip_quotes(value.trim());
                    if !v.is_empty() {
                        fm.tags.push(v.to_string());
                    }
                }
                continue;
            }
            pending_list_key = None;
        }

        if let Some((key, value)) = line.split_once(':') {
            let key = key.trim();
            let value = value.trim();

            match key {
                "title" => fm.title = Some(strip_quotes(value).to_string()),
                "date" => fm.date = Some(strip_quotes(value).to_string()),
                "category" => {
                    let v = strip_quotes(value);
                    if !v.is_empty() {
                        fm.category = Some(v.to_string());
                    }
                }
                "summary" | "description" => {
                    let v = strip_quotes(value);
                    if fm.summary.is_none() && !v.is_empty() {
                        fm.summary = Some(v.to_string());
                    }
                }
                "tags" => {
                    if value.is_empty() {
                        pending_list_key = Some("tags".to_string());
                    } else {
                        fm.tags = parse_list_value(value);
                    }
                }
                "draft" => {
                    fm.draft = matches!(value.to_ascii_lowercase().as_str(), "true" | "yes");
                }
                "showTOC" | "show_toc" => {
                    fm.show_toc = !matches!(value.to_ascii_lowercase().as_str(), "false" | "no");
                }
                "layout" => {
                    let v = strip_quotes(value);
                    if !v.is_empty() {
                        fm.layout = Some(v.to_string());
                    }
                }
                "slug" => {
                    let v = strip_quotes(value);
                    if !v.is_empty() {
                        fm.slug = Some(v.to_string());
                    }
                }
                _ => {}
            }
        }
    }

    if fm.title.is_none() {
        return Err(AppError::BadRequest(
            "缺少 title 字段（请在 frontmatter 的第一行添加 title: '文章标题'）".into(),
        ));
    }

    Ok((fm, body))
}

// ============================================================================
// 辅助函数
// ============================================================================

fn strip_quotes(s: &str) -> &str {
    let s = s.trim();
    if (s.starts_with('\'') && s.ends_with('\'')) || (s.starts_with('"') && s.ends_with('"')) {
        &s[1..s.len() - 1]
    } else {
        s
    }
}

fn parse_list_value(s: &str) -> Vec<String> {
    let s = s.trim();
    // 内联数组: [a, b, c]
    if s.starts_with('[') && s.ends_with(']') {
        return s[1..s.len() - 1]
            .split(',')
            .map(|item| strip_quotes(item.trim()).to_string())
            .filter(|item| !item.is_empty())
            .collect();
    }
    // 逗号分隔
    s.split(',')
        .map(|item| strip_quotes(item.trim()).to_string())
        .filter(|item| !item.is_empty())
        .collect()
}

fn title_to_slug(title: &str) -> String {
    title
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' { c } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

fn count_words(text: &str) -> usize {
    let chinese_chars = text.chars().filter(|c| *c >= '\u{4e00}' && *c <= '\u{9fff}').count();
    let english_words = text
        .split_whitespace()
        .filter(|w| !w.chars().all(|c| c >= '\u{4e00}' && c <= '\u{9fff}'))
        .count();
    chinese_chars + english_words
}

fn parse_date_loose(s: &str) -> Option<chrono::DateTime<chrono::Utc>> {
    // 尝试多种日期格式
    let s = s.trim();
    // ISO 8601
    if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(s) {
        return Some(dt.with_timezone(&chrono::Utc));
    }
    // 只有日期
    for fmt in &["%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y"] {
        if let Ok(naive) = chrono::NaiveDate::parse_from_str(s, fmt) {
            let dt = naive
                .and_hms_opt(0, 0, 0)
                .unwrap()
                .and_utc();
            return Some(dt);
        }
    }
    None
}
