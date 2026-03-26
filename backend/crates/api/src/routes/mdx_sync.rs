use crate::state::AppState;
use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Json},
};
use blog_shared::AppError;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use std::collections::HashSet;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Deserialize, ToSchema)]
pub struct MdxSyncRequest {
    #[serde(default)]
    pub force: Option<bool>,
}

#[derive(Debug, Serialize, ToSchema, Default)]
pub struct SyncStats {
    pub total: usize,
    pub updated: usize,
    pub created: usize,
    pub unchanged: usize,
    pub failed: usize,
    pub errors: Vec<String>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct MessageResponse {
    pub message: String,
}

#[utoipa::path(
    post,
    path = "/v1/admin/sync/mdx",
    tag = "admin",
    request_body = MdxSyncRequest,
    responses(
        (status = 200, description = "同步成功", body = SyncStats),
        (status = 401, description = "未认证"),
        (status = 500, description = "服务器错误")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn sync_mdx_to_db(
    State(state): State<AppState>,
    Json(req): Json<MdxSyncRequest>,
) -> Result<impl IntoResponse, AppError> {
    let force = req.force.unwrap_or(false);
    let blog_dir =
        env::var("FRONTEND_BLOG_DIR").unwrap_or_else(|_| "../frontend/data/blog".to_string());
    let blog_root = PathBuf::from(&blog_dir);
    let mdx_files = scan_mdx_files(&blog_dir)
        .map_err(|error| AppError::BadRequest(format!("扫描 MDX 文件失败: {error}")))?;

    let mut stats = SyncStats::default();
    stats.total = mdx_files.len();

    for file_path in mdx_files {
        match process_mdx_file(&state.db, &blog_root, &file_path, force).await {
            Ok(ProcessResult::Created) => stats.created += 1,
            Ok(ProcessResult::Updated) => stats.updated += 1,
            Ok(ProcessResult::Unchanged) => stats.unchanged += 1,
            Err(error) => {
                stats.failed += 1;
                stats
                    .errors
                    .push(format!("{}: {}", file_path.display(), error));
            }
        }
    }

    refresh_taxonomy_counts(&state.db)
        .await
        .map_err(|error| AppError::BadRequest(format!("刷新分类或标签统计失败: {error}")))?;

    clear_cache(&state).await?;

    if stats.created + stats.updated > 0 {
        crate::outbox::add_search_index_rebuild(&state.db)
            .await
            .map_err(|_| AppError::InternalError)?;
    }

    Ok((StatusCode::OK, Json(stats)))
}

enum ProcessResult {
    Created,
    Updated,
    Unchanged,
}

#[derive(Debug)]
struct MdxFrontmatter {
    title: String,
    slug: String,
    date: chrono::DateTime<chrono::Utc>,
    category: Option<String>,
    summary: Option<String>,
    tags: Vec<String>,
    draft: bool,
    show_toc: bool,
    layout: Option<String>,
}

#[derive(Debug, sqlx::FromRow)]
struct ExistingPost {
    id: Uuid,
    title: String,
    summary: Option<String>,
    content_hash: Option<String>,
    status: String,
    published_at: Option<chrono::DateTime<chrono::Utc>>,
    category_id: Option<Uuid>,
    show_toc: bool,
    layout: String,
}

fn scan_mdx_files(dir: &str) -> Result<Vec<PathBuf>, String> {
    let mut files = Vec::new();
    let blog_path = Path::new(dir);

    if !blog_path.exists() {
        return Err(format!("目录不存在: {dir}"));
    }

    fn visit_dirs(dir: &Path, files: &mut Vec<PathBuf>) {
        if dir.is_dir() {
            if let Ok(entries) = fs::read_dir(dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() {
                        visit_dirs(&path, files);
                    } else if path.extension().and_then(|ext| ext.to_str()) == Some("mdx") {
                        files.push(path);
                    }
                }
            }
        }
    }

    visit_dirs(blog_path, &mut files);
    files.sort();
    Ok(files)
}

async fn process_mdx_file(
    pool: &PgPool,
    blog_root: &Path,
    file_path: &Path,
    force: bool,
) -> Result<ProcessResult, String> {
    let content =
        fs::read_to_string(file_path).map_err(|error| format!("读取文件失败: {error}"))?;
    let (frontmatter, body) = parse_mdx_content(&content, file_path, blog_root)?;
    let content_hash = compute_content_hash(&body);
    let published_at = if frontmatter.draft {
        None
    } else {
        Some(frontmatter.date)
    };
    let status = if frontmatter.draft {
        "draft"
    } else {
        "published"
    };
    let layout = frontmatter
        .layout
        .clone()
        .unwrap_or_else(|| "PostLayout".to_string());
    let category_id =
        resolve_category_id(pool, frontmatter.category.as_deref(), &frontmatter.slug).await?;
    let desired_tag_slugs = normalize_tag_slugs(&frontmatter.tags);

    let existing_post = sqlx::query_as::<_, ExistingPost>(
        r#"
        SELECT
            id,
            title,
            summary,
            content_hash,
            status::text AS status,
            published_at,
            category_id,
            show_toc,
            layout
        FROM posts
        WHERE slug = $1
        LIMIT 1
        "#,
    )
    .bind(&frontmatter.slug)
    .fetch_optional(pool)
    .await
    .map_err(|error| format!("查询文章失败: {error}"))?;

    match existing_post {
        Some(existing) => {
            let current_tag_slugs = fetch_tag_slugs(pool, existing.id).await?;
            let metadata_matches = existing.title == frontmatter.title
                && existing.summary == frontmatter.summary
                && existing.status == status
                && existing.published_at == published_at
                && existing.category_id == category_id
                && existing.show_toc == frontmatter.show_toc
                && existing.layout == layout
                && current_tag_slugs == desired_tag_slugs;

            if !force
                && existing.content_hash.as_deref() == Some(content_hash.as_str())
                && metadata_matches
            {
                return Ok(ProcessResult::Unchanged);
            }

            sqlx::query(
                r#"
                UPDATE posts
                SET title = $1,
                    content = $2,
                    summary = $3,
                    status = $4::post_status,
                    published_at = $5,
                    category_id = $6,
                    show_toc = $7,
                    layout = $8,
                    deleted_at = NULL,
                    updated_at = NOW()
                WHERE id = $9
                "#,
            )
            .bind(&frontmatter.title)
            .bind(&body)
            .bind(&frontmatter.summary)
            .bind(status)
            .bind(published_at)
            .bind(category_id)
            .bind(frontmatter.show_toc)
            .bind(&layout)
            .bind(existing.id)
            .execute(pool)
            .await
            .map_err(|error| format!("更新文章失败: {error}"))?;

            sync_tags(pool, existing.id, &frontmatter.tags).await?;
            ensure_post_stats(pool, &frontmatter.slug).await?;
            create_post_version(
                pool,
                existing.id,
                &frontmatter.title,
                &body,
                frontmatter.summary.as_deref(),
            )
            .await?;

            Ok(ProcessResult::Updated)
        }
        None => {
            let post_id = Uuid::new_v4();
            let reading_time = calculate_reading_time(&body);

            sqlx::query(
                r#"
                INSERT INTO posts (
                    id, slug, title, content, summary, status,
                    published_at, category_id, show_toc, layout,
                    reading_time
                ) VALUES ($1, $2, $3, $4, $5, $6::post_status, $7, $8, $9, $10, $11)
                "#,
            )
            .bind(post_id)
            .bind(&frontmatter.slug)
            .bind(&frontmatter.title)
            .bind(&body)
            .bind(&frontmatter.summary)
            .bind(status)
            .bind(published_at)
            .bind(category_id)
            .bind(frontmatter.show_toc)
            .bind(&layout)
            .bind(reading_time)
            .execute(pool)
            .await
            .map_err(|error| format!("创建文章失败: {error}"))?;

            sync_tags(pool, post_id, &frontmatter.tags).await?;
            ensure_post_stats(pool, &frontmatter.slug).await?;
            create_post_version(
                pool,
                post_id,
                &frontmatter.title,
                &body,
                frontmatter.summary.as_deref(),
            )
            .await?;

            Ok(ProcessResult::Created)
        }
    }
}

fn parse_mdx_content(
    content: &str,
    path: &Path,
    blog_root: &Path,
) -> Result<(MdxFrontmatter, String), String> {
    let mut lines = content.lines();

    match lines.next() {
        Some(line) if line.trim() == "---" => {}
        _ => return Err("缺少 frontmatter 分隔符".to_string()),
    }

    let mut frontmatter_lines = Vec::new();
    let mut found_end = false;

    for line in lines.by_ref() {
        if line.trim() == "---" {
            found_end = true;
            break;
        }

        frontmatter_lines.push(line.to_string());
    }

    if !found_end {
        return Err("frontmatter 未正确关闭".to_string());
    }

    let mut title = String::new();
    let mut date_str = String::new();
    let mut category = None;
    let mut summary = None;
    let mut tags = Vec::new();
    let mut draft = false;
    let mut show_toc = true;
    let mut layout = None;
    let mut pending_list_key: Option<String> = None;

    for raw_line in frontmatter_lines {
        let line = raw_line.trim();
        if line.is_empty() {
            pending_list_key = None;
            continue;
        }

        if let Some(key) = pending_list_key.as_deref() {
            if let Some(value) = line.strip_prefix("- ") {
                if key == "tags" {
                    let value = strip_quotes(value.trim());
                    if !value.is_empty() {
                        tags.push(value.to_string());
                    }
                }
                continue;
            }
            pending_list_key = None;
        }

        let Some((key, value)) = line.split_once(':') else {
            continue;
        };

        let key = key.trim();
        let value = value.trim();

        match key {
            "title" => {
                title = strip_quotes(value).to_string();
            }
            "date" => {
                date_str = strip_quotes(value).to_string();
            }
            "category" => {
                let parsed = strip_quotes(value);
                if !parsed.is_empty() {
                    category = Some(parsed.to_string());
                }
            }
            "summary" => {
                let parsed = strip_quotes(value);
                if !parsed.is_empty() {
                    summary = Some(parsed.to_string());
                }
            }
            "description" => {
                if summary.is_none() {
                    let parsed = strip_quotes(value);
                    if !parsed.is_empty() {
                        summary = Some(parsed.to_string());
                    }
                }
            }
            "tags" => {
                if value.is_empty() {
                    pending_list_key = Some("tags".to_string());
                } else {
                    tags = parse_list_value(value);
                }
            }
            "draft" => {
                draft = matches!(value.to_ascii_lowercase().as_str(), "true" | "yes");
            }
            "showTOC" | "show_toc" => {
                show_toc = !matches!(value.to_ascii_lowercase().as_str(), "false" | "no");
            }
            "layout" => {
                let parsed = strip_quotes(value);
                if !parsed.is_empty() {
                    layout = Some(parsed.to_string());
                }
            }
            _ => {}
        }
    }

    if title.is_empty() {
        title = path
            .file_stem()
            .and_then(|value| value.to_str())
            .unwrap_or("untitled")
            .to_string();
    }

    let slug = slug_from_path(blog_root, path)?;
    let date = parse_frontmatter_date(&date_str);
    let body = lines.collect::<Vec<_>>().join("\n");

    Ok((
        MdxFrontmatter {
            title,
            slug,
            date,
            category,
            summary,
            tags,
            draft,
            show_toc,
            layout,
        },
        body,
    ))
}

fn slug_from_path(blog_root: &Path, path: &Path) -> Result<String, String> {
    let relative = path
        .strip_prefix(blog_root)
        .map_err(|error| format!("无法计算 slug 相对路径: {error}"))?;
    let without_extension = relative.with_extension("");
    let slug = without_extension
        .components()
        .map(|component| component.as_os_str().to_string_lossy().to_string())
        .collect::<Vec<_>>()
        .join("/");

    if slug.is_empty() {
        return Err("生成的 slug 为空".to_string());
    }

    Ok(slug)
}

fn parse_frontmatter_date(value: &str) -> chrono::DateTime<chrono::Utc> {
    if value.is_empty() {
        return chrono::Utc::now();
    }

    chrono::DateTime::parse_from_rfc3339(value)
        .map(|date| date.with_timezone(&chrono::Utc))
        .or_else(|_| {
            chrono::NaiveDate::parse_from_str(value, "%Y-%m-%d").map(|date| {
                chrono::DateTime::<chrono::Utc>::from_naive_utc_and_offset(
                    date.and_hms_opt(0, 0, 0).unwrap(),
                    chrono::Utc,
                )
            })
        })
        .unwrap_or_else(|_| chrono::Utc::now())
}

fn parse_list_value(value: &str) -> Vec<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Vec::new();
    }

    if trimmed.starts_with('[') && trimmed.ends_with(']') {
        return trimmed[1..trimmed.len() - 1]
            .split(',')
            .map(|item| strip_quotes(item.trim()).to_string())
            .filter(|item| !item.is_empty())
            .collect();
    }

    vec![strip_quotes(trimmed).to_string()]
}

fn strip_quotes(value: &str) -> &str {
    value
        .strip_prefix('"')
        .and_then(|inner| inner.strip_suffix('"'))
        .or_else(|| {
            value
                .strip_prefix('\'')
                .and_then(|inner| inner.strip_suffix('\''))
        })
        .unwrap_or(value)
}

fn compute_content_hash(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn slugify_text(value: &str) -> String {
    value
        .trim()
        .to_lowercase()
        .replace(' ', "-")
        .replace('/', "-")
        .replace('\\', "-")
        .chars()
        .filter(|character| character.is_alphanumeric() || *character == '-' || *character == '_')
        .collect::<String>()
}

fn normalize_tag_slugs(tags: &[String]) -> Vec<String> {
    let mut normalized = tags
        .iter()
        .map(|tag| slugify_text(tag))
        .filter(|tag| !tag.is_empty())
        .collect::<Vec<_>>();
    normalized.sort();
    normalized.dedup();
    normalized
}

async fn resolve_category_id(
    pool: &PgPool,
    frontmatter_category: Option<&str>,
    slug: &str,
) -> Result<Option<Uuid>, String> {
    let mut candidates = Vec::new();

    if let Some(category) = frontmatter_category {
        let trimmed = category.trim();
        if !trimmed.is_empty() {
            candidates.push(trimmed.to_string());
            if let Some(alias) = map_category_alias(trimmed) {
                candidates.push(alias.to_string());
            }
        }
    }

    if let Some(path_category) = slug.split('/').next() {
        candidates.push(path_category.to_string());
        if let Some(alias) = map_category_alias(path_category) {
            candidates.push(alias.to_string());
        }
    }

    for candidate in unique_strings(candidates) {
        if let Some(category_id) = sqlx::query_scalar::<_, Uuid>(
            "SELECT id FROM categories WHERE slug = $1 OR name = $1 LIMIT 1",
        )
        .bind(&candidate)
        .fetch_optional(pool)
        .await
        .map_err(|error| format!("查询分类失败: {error}"))?
        {
            return Ok(Some(category_id));
        }
    }

    Ok(None)
}

fn map_category_alias(value: &str) -> Option<&'static str> {
    match value.trim().to_lowercase().as_str() {
        "computer" | "computer science" | "computer-science" | "计算机科学" => {
            Some("computer-science")
        }
        "robotics" | "机器人学" => Some("robotics"),
        "mathematics" | "math" | "数学" => Some("mathematics"),
        "chemistry" | "化学" => Some("chemistry"),
        "music" | "音乐" => Some("music"),
        "photography" | "摄影" => Some("photography"),
        "motor" | "motor-control" | "电机控制" => Some("motor-control"),
        "economics" | "social" | "社交" => Some("social"),
        "tactile" | "tactile-sensing" | "触觉传感" => Some("tactile-sensing"),
        _ => None,
    }
}

async fn fetch_tag_slugs(pool: &PgPool, post_id: Uuid) -> Result<Vec<String>, String> {
    let mut slugs = sqlx::query_scalar::<_, String>(
        r#"
        SELECT t.slug
        FROM tags t
        JOIN post_tags pt ON pt.tag_id = t.id
        WHERE pt.post_id = $1
        ORDER BY t.slug
        "#,
    )
    .bind(post_id)
    .fetch_all(pool)
    .await
    .map_err(|error| format!("查询标签失败: {error}"))?;

    slugs.sort();
    slugs.dedup();
    Ok(slugs)
}

async fn sync_tags(pool: &PgPool, post_id: Uuid, tags: &[String]) -> Result<(), String> {
    sqlx::query("DELETE FROM post_tags WHERE post_id = $1")
        .bind(post_id)
        .execute(pool)
        .await
        .map_err(|error| format!("清理旧标签失败: {error}"))?;

    let mut seen = HashSet::new();

    for tag_name in tags
        .iter()
        .map(|tag| tag.trim())
        .filter(|tag| !tag.is_empty())
    {
        let tag_slug = slugify_text(tag_name);
        if tag_slug.is_empty() || !seen.insert(tag_slug.clone()) {
            continue;
        }

        let tag_id = sqlx::query_scalar::<_, Uuid>(
            r#"
            INSERT INTO tags (slug, name, post_count)
            VALUES ($1, $2, 0)
            ON CONFLICT (slug) DO UPDATE
            SET name = EXCLUDED.name
            RETURNING id
            "#,
        )
        .bind(&tag_slug)
        .bind(tag_name)
        .fetch_one(pool)
        .await
        .map_err(|error| format!("创建或更新标签失败: {error}"))?;

        sqlx::query(
            "INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(post_id)
        .bind(tag_id)
        .execute(pool)
        .await
        .map_err(|error| format!("关联标签失败: {error}"))?;
    }

    Ok(())
}

async fn ensure_post_stats(pool: &PgPool, slug: &str) -> Result<(), String> {
    sqlx::query(
        r#"
        INSERT INTO post_stats (slug, view_count, like_count, comment_count, updated_at)
        VALUES ($1, 0, 0, 0, NOW())
        ON CONFLICT (slug) DO NOTHING
        "#,
    )
    .bind(slug)
    .execute(pool)
    .await
    .map_err(|error| format!("初始化文章统计失败: {error}"))?;

    Ok(())
}

async fn create_post_version(
    pool: &PgPool,
    post_id: Uuid,
    title: &str,
    content: &str,
    summary: Option<&str>,
) -> Result<(), String> {
    sqlx::query(
        r#"
        INSERT INTO post_versions (post_id, version_number, title, content, summary, created_by)
        VALUES (
            $1,
            COALESCE((SELECT MAX(version_number) + 1 FROM post_versions WHERE post_id = $1), 1),
            $2,
            $3,
            $4,
            NULL
        )
        "#,
    )
    .bind(post_id)
    .bind(title)
    .bind(content)
    .bind(summary)
    .execute(pool)
    .await
    .map_err(|error| format!("创建文章版本失败: {error}"))?;

    Ok(())
}

async fn refresh_taxonomy_counts(pool: &PgPool) -> Result<(), String> {
    sqlx::query(
        r#"
        UPDATE categories AS category
        SET post_count = (
            SELECT COUNT(*)
            FROM posts AS post
            WHERE post.category_id = category.id
              AND post.status = 'published'
              AND post.deleted_at IS NULL
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|error| format!("刷新分类统计失败: {error}"))?;

    sqlx::query(
        r#"
        UPDATE tags AS tag
        SET post_count = (
            SELECT COUNT(*)
            FROM post_tags AS post_tag
            JOIN posts AS post ON post.id = post_tag.post_id
            WHERE post_tag.tag_id = tag.id
              AND post.status = 'published'
              AND post.deleted_at IS NULL
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|error| format!("刷新标签统计失败: {error}"))?;

    Ok(())
}

async fn clear_cache(state: &AppState) -> Result<(), AppError> {
    let mut conn = state
        .redis
        .get()
        .await
        .map_err(|_| AppError::InternalError)?;

    let keys: Vec<String> = redis::cmd("KEYS")
        .arg("posts:list:*")
        .query_async(&mut conn)
        .await
        .map_err(|_| AppError::InternalError)?;

    for key in keys {
        let _: () = redis::cmd("DEL")
            .arg(&key)
            .query_async(&mut conn)
            .await
            .map_err(|_| AppError::InternalError)?;
    }

    let _: () = redis::cmd("DEL")
        .arg("categories")
        .query_async(&mut conn)
        .await
        .unwrap_or(());

    Ok(())
}

fn calculate_reading_time(content: &str) -> i32 {
    let clean_content = content
        .lines()
        .filter(|line| !line.trim_start().starts_with("```"))
        .collect::<Vec<_>>()
        .join("\n");

    let mut chinese_chars = 0;
    let mut english_words = 0;

    for line in clean_content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with('#') {
            continue;
        }

        let words: Vec<&str> = trimmed.split_whitespace().collect();
        for word in words {
            if word
                .chars()
                .any(|character| character.is_alphabetic() && (character as u32) > 0x7F)
            {
                chinese_chars += word
                    .chars()
                    .filter(|character| character.is_alphabetic() && (*character as u32) > 0x7F)
                    .count();
            } else if word
                .chars()
                .all(|character| character.is_alphabetic() || character == '\'' || character == '-')
            {
                english_words += 1;
            }
        }
    }

    let chinese_minutes = (chinese_chars as f64 / 400.0).ceil() as i32;
    let english_minutes = (english_words as f64 / 200.0).ceil() as i32;
    (chinese_minutes + english_minutes).max(1)
}

fn unique_strings(values: Vec<String>) -> Vec<String> {
    let mut seen = HashSet::new();
    values
        .into_iter()
        .filter(|value| !value.trim().is_empty())
        .filter(|value| seen.insert(value.clone()))
        .collect()
}
