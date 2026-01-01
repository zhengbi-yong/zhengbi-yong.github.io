use axum::{
    extract::State,
    response::{IntoResponse, Json},
    http::StatusCode,
};
use blog_db::cms::*;
use blog_shared::AppError;
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use std::path::{Path, PathBuf};
use std::fs;
use std::env;
use utoipa::ToSchema;

// ============================================
// 请求和响应模型
// ============================================

#[derive(Debug, Deserialize, ToSchema)]
pub struct MdxSyncRequest {
    #[serde(default)]
    pub force: Option<bool>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct SyncStats {
    pub total: usize,
    pub updated: usize,
    pub created: usize,
    pub unchanged: usize,
    pub failed: usize,
    pub errors: Vec<String>,
}

impl Default for SyncStats {
    fn default() -> Self {
        Self {
            total: 0,
            updated: 0,
            created: 0,
            unchanged: 0,
            failed: 0,
            errors: Vec::new(),
        }
    }
}

#[derive(Debug, Serialize, ToSchema)]
pub struct MessageResponse {
    pub message: String,
}

// ============================================
// API处理函数
// ============================================

/// 同步MDX文件到数据库
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

    // 获取MDX文件目录
    let blog_dir = env::var("FRONTEND_BLOG_DIR")
        .unwrap_or_else(|_| "../frontend/data/blog".to_string());

    // 扫描MDX文件
    let mdx_files = scan_mdx_files(&blog_dir)
        .map_err(|e| AppError::BadRequest(format!("扫描MDX文件失败: {}", e)))?;

    let mut stats = SyncStats::default();
    stats.total = mdx_files.len();

    // 处理每个MDX文件
    for file_path in mdx_files {
        match process_mdx_file(&state.db, &file_path, force).await {
            Ok(ProcessResult::Created) => {
                stats.created += 1;
            }
            Ok(ProcessResult::Updated) => {
                stats.updated += 1;
            }
            Ok(ProcessResult::Unchanged) => {
                stats.unchanged += 1;
            }
            Err(e) => {
                stats.failed += 1;
                stats.errors.push(format!("{}: {}", file_path.display(), e));
            }
        }
    }

    // 清除缓存
    clear_cache(&state).await?;

    Ok((StatusCode::OK, Json(stats)))
}

// ============================================
// 内部辅助函数
// ============================================

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
}

fn scan_mdx_files(dir: &str) -> Result<Vec<PathBuf>, String> {
    let mut files = Vec::new();
    let blog_path = Path::new(dir);

    if !blog_path.exists() {
        return Err(format!("目录不存在: {}", dir));
    }

    fn visit_dirs(dir: &Path, files: &mut Vec<PathBuf>) {
        if dir.is_dir() {
            if let Ok(entries) = fs::read_dir(dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() {
                        visit_dirs(&path, files);
                    } else if path.extension().and_then(|s| s.to_str()) == Some("mdx") {
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
    pool: &sqlx::PgPool,
    file_path: &Path,
    force: bool,
) -> Result<ProcessResult, String> {
    // 读取文件内容
    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;

    // 解析frontmatter和内容
    let (frontmatter, body) = parse_mdx_content(&content, file_path)?;

    // 计算content_hash
    let content_hash = compute_content_hash(&body);

    // 检查文章是否已存在
    let existing_post: Option<(String, Option<String>)> = sqlx::query_as(
        "SELECT id, content_hash FROM posts WHERE slug = $1 AND deleted_at IS NULL"
    )
    .bind(&frontmatter.slug)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("查询数据库失败: {}", e))?;

    match existing_post {
        Some((post_id, existing_hash)) => {
            // 文章已存在，检查是否需要更新
            if !force && existing_hash.as_ref() == Some(&content_hash) {
                return Ok(ProcessResult::Unchanged);
            }

            // 更新文章
            sqlx::query(
                r#"
                UPDATE posts
                SET title = $1,
                    content = $2,
                    summary = $3,
                    content_hash = $4,
                    updated_at = NOW()
                WHERE id = $5
                "#
            )
            .bind(&frontmatter.title)
            .bind(&body)
            .bind(&frontmatter.summary)
            .bind(&content_hash)
            .bind(&post_id)
            .execute(pool)
            .await
            .map_err(|e| format!("更新文章失败: {}", e))?;

            Ok(ProcessResult::Updated)
        }
        None => {
            // 创建新文章
            let published_at = if !frontmatter.draft {
                Some(frontmatter.date)
            } else {
                None
            };

            // 计算阅读时间（基于内容长度）
            let reading_time = calculate_reading_time(&body);

            // 获取分类ID
            let category_id: Option<uuid::Uuid> = if let Some(category_slug) = &frontmatter.category {
                sqlx::query_scalar::<_, uuid::Uuid>(
                    "SELECT id FROM categories WHERE slug = $1 OR name = $1 LIMIT 1"
                )
                .bind(category_slug)
                .fetch_optional(pool)
                .await
                .map_err(|e| format!("查询分类失败: {}", e))?
            } else {
                None
            };

            let post_id = uuid::Uuid::new_v4();

            let status_str = if frontmatter.draft { "draft" } else { "published" };

            sqlx::query(
                r#"
                INSERT INTO posts (
                    id, slug, title, content, summary, status,
                    published_at, category_id, show_toc, reading_time,
                    view_count, like_count, comment_count, content_hash
                ) VALUES ($1, $2, $3, $4, $5, $6::post_status, $7, $8, $9, $10, 0, 0, 0, $11)
                "#
            )
            .bind(post_id)
            .bind(&frontmatter.slug)
            .bind(&frontmatter.title)
            .bind(&body)
            .bind(&frontmatter.summary)
            .bind(status_str)
            .bind(published_at)
            .bind(category_id)
            .bind(frontmatter.show_toc)
            .bind(reading_time as i32)
            .bind(&content_hash)
            .execute(pool)
            .await
            .map_err(|e| format!("创建文章失败: {}", e))?;

            Ok(ProcessResult::Created)
        }
    }
}

fn parse_mdx_content(content: &str, path: &Path) -> Result<(MdxFrontmatter, String), String> {
    let mut lines = content.lines().peekable();

    // 检查frontmatter分隔符
    if lines.peek() != Some(&"---") {
        return Err("缺少frontmatter分隔符".to_string());
    }
    lines.next();

    // 解析frontmatter
    let mut title = String::new();
    let mut date_str = String::new();
    let mut category = None;
    let mut summary = None;
    let mut tags = Vec::new();
    let mut draft = false;
    let mut show_toc = true;

    loop {
        match lines.next() {
            Some("---") => break,
            Some(line) => {
                if line.starts_with("title:") {
                    title = line.replacen("title:", "", 1)
                        .trim()
                        .trim_matches('"')
                        .trim_matches('\'')
                        .to_string();
                } else if line.starts_with("date:") {
                    date_str = line.replacen("date:", "", 1).trim().to_string();
                } else if line.starts_with("category:") {
                    category = Some(
                        line.replacen("category:", "", 1)
                            .trim()
                            .trim_matches('"')
                            .trim_matches('\'')
                            .to_string()
                    );
                } else if line.starts_with("summary:") {
                    summary = Some(
                        line.replacen("summary:", "", 1)
                            .trim()
                            .trim_matches('"')
                            .trim_matches('\'')
                            .to_string()
                    );
                } else if line.starts_with("tags:") {
                    let tags_str = line.replacen("tags:", "", 1).trim().to_string();
                    if !tags_str.is_empty() && tags_str.starts_with('[') {
                        let cleaned = tags_str
                            .replace('[', "")
                            .replace(']', "")
                            .replace('\"', "")
                            .replace('\'', "");
                        tags = cleaned.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect();
                    }
                } else if line.starts_with("draft:") {
                    let draft_str = line.replacen("draft:", "", 1).trim().to_lowercase();
                    draft = draft_str == "true" || draft_str == "yes";
                } else if line.starts_with("showTOC:") || line.starts_with("show_toc:") {
                    let show_str = line
                        .replacen("showTOC:", "", 1)
                        .replacen("show_toc:", "", 1)
                        .trim()
                        .to_lowercase();
                    show_toc = show_str != "false" && show_str != "no";
                }
            }
            None => return Err("Frontmatter未正确关闭".to_string()),
        }
    }

    // 生成默认值
    if title.is_empty() {
        title = path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("untitled")
            .to_string();
    }

    let slug = generate_slug(&title);

    let date = if date_str.is_empty() {
        chrono::Utc::now()
    } else {
        chrono::DateTime::parse_from_rfc3339(&format!("{}T00:00:00Z", date_str))
            .or_else(|_| chrono::DateTime::parse_from_rfc3339(&format!("{}T00:00:00+00:00", date_str)))
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now())
    };

    // 收集正文内容
    let body = lines.collect::<Vec<&str>>().join("\n");

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
        },
        body,
    ))
}

fn generate_slug(title: &str) -> String {
    title.to_lowercase()
        .replace(' ', "-")
        .replace('/', "-")
        .replace('?', "")
        .replace('!', "")
        .replace('，', "-")
        .replace('。', "")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect::<String>()
}

fn compute_content_hash(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    let hash = hasher.finalize();
    format!("{:x}", hash)
}

async fn clear_cache(state: &AppState) -> Result<(), AppError> {
    let mut conn = state.redis.get().await
        .map_err(|_| AppError::InternalError)?;

    // 清除所有文章列表缓存
    let keys: Vec<String> = redis::cmd("KEYS")
        .arg("posts:list:*")
        .query_async(&mut conn)
        .await
        .map_err(|_| AppError::InternalError)?;

    if !keys.is_empty() {
        for key in keys {
            let _: () = redis::cmd("DEL")
                .arg(&key)
                .query_async(&mut conn)
                .await
                .map_err(|_| AppError::InternalError)?;
        }
    }

    Ok(())
}

/// 计算阅读时间（分钟）
/// 假设：中文400字/分钟，英文200词/分钟
fn calculate_reading_time(content: &str) -> i32 {
    // 移除markdown语法和代码块
    let clean_content = content
        .lines()
        .filter(|line| {
            // 跳过代码块
            !line.trim_start().starts_with("```")
        })
        .collect::<Vec<_>>()
        .join("\n");

    // 统计中文字符和英文单词
    let mut chinese_chars = 0;
    let mut english_words = 0;

    for line in clean_content.lines() {
        // 跳过标题行
        let trimmed = line.trim();
        if trimmed.starts_with('#') {
            continue;
        }

        // 简单统计：中文字符 vs 英文单词
        let words: Vec<&str> = trimmed.split_whitespace().collect();
        for word in words {
            if word.chars().any(|c| c.is_alphabetic() && (c as u32) > 0x7F) {
                // 包含非ASCII字符，算作中文
                chinese_chars += word.chars().filter(|c| {
                    c.is_alphabetic() && (*c as u32) > 0x7F
                }).count();
            } else if word.chars().all(|c| c.is_alphabetic() || c == '\'' || c == '-') {
                // 纯英文单词
                english_words += 1;
            }
        }
    }

    // 计算阅读时间（分钟）
    let chinese_minutes = (chinese_chars as f64 / 400.0).ceil() as i32;
    let english_minutes = (english_words as f64 / 200.0).ceil() as i32;

    let total_minutes = chinese_minutes + english_minutes;

    // 至少1分钟
    total_minutes.max(1)
}
