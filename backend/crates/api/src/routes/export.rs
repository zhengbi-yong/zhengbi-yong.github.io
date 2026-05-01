//! 文章导出路由
//!
//! 提供文章导出为 MDX/Markdown 的 REST API 端点。

use axum::{
    extract::{Path, Query, State},
    Extension, Json,
    http::{header, HeaderMap, StatusCode},
    response::IntoResponse,
    body::Body,
};
use blog_core::blocknote_json_to_mdx;
use blog_shared::AppError;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use utoipa::ToSchema;
use uuid::Uuid;
use std::io::Write;

use crate::state::AppState;
use blog_shared::middleware::auth::AuthUser;

// ============================================================================
// Request / Response types
// ============================================================================

#[derive(Debug, Serialize, ToSchema)]
pub struct ExportMdxResponse {
    pub slug: String,
    /// 完整 MDX 文本（含 YAML frontmatter + 正文）
    pub mdx: String,
    /// 建议文件名
    pub filename: String,
    /// 文章标题
    pub title: String,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct BatchExportQuery {
    /// 指定文章 ID 列表（优先级最高）
    pub ids: Option<Vec<Uuid>>,
    /// 状态筛选
    pub status: Option<String>,
    /// 分类筛选
    pub category_id: Option<Uuid>,
    /// 标签筛选
    pub tag_id: Option<Uuid>,
    /// 最多导出数（默认 100）
    pub limit: Option<u32>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct BatchZipQuery {
    /// 逗号分隔的 UUID 列表
    pub ids: Option<String>,
    /// 是否将引用的媒体文件打包进 ZIP（默认 false）
    #[serde(default)]
    pub include_media: bool,
}

// ============================================================================
// Handlers
// ============================================================================

/// 导出单篇文章为 MDX 文本
///
/// 从数据库读取文章，组装 YAML frontmatter + MDX 正文，返回完整 MDX 文本。
///
/// MDX 正文获取策略（按优先级）：
/// 1. 如果 content_json 是 BlockNote JSON 数组 → blocknote_json_to_mdx()
/// 2. 如果是 TipTap JSON 对象 → tiptap_json_to_mdx()（legacy 兼容）
/// 3. 降级使用 content_mdx
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
        (status = 401, description = "未授权"),
    ),
)]
pub async fn export_post_mdx(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthUser>,
    Path(post_id): Path<Uuid>,
) -> Result<Json<ExportMdxResponse>, AppError> {
    // ── 1. 查询文章数据 ──────────────────────────────────────────────
    let row = sqlx::query(
        r#"SELECT slug, title, summary,
                  INITCAP(status::text) as status,
                  COALESCE(published_at::text, '') as published_at,
                  category_id, show_toc, layout, is_featured,
                  content_mdx, content_json, created_at::text,
                  COALESCE(meta_title, '') as meta_title,
                  COALESCE(meta_description, '') as meta_description,
                  COALESCE(canonical_url, '') as canonical_url
           FROM posts
           WHERE id = $1 AND deleted_at IS NULL"#,
    )
    .bind(post_id)
    .fetch_optional(&state.db)
    .await?;

    let row = match row {
        Some(r) => r,
        None => return Err(AppError::NotFound("文章不存在".into())),
    };

    let slug: String = row.try_get("slug")?;
    let title: String = row.try_get("title")?;
    let summary: Option<String> = row.try_get("summary")?;
    let status: String = row.try_get("status")?;
    let published_at: String = row.try_get("published_at")?;
    let show_toc: bool = row.try_get("show_toc")?;
    let layout: String = row.try_get("layout")?;
    let is_featured: bool = row.try_get("is_featured")?;
    let meta_title: String = row.try_get("meta_title")?;
    let meta_description: String = row.try_get("meta_description")?;
    let canonical_url: String = row.try_get("canonical_url")?;
    let content_mdx: Option<String> = row.try_get("content_mdx")?;
    let content_json: Option<serde_json::Value> = row.try_get("content_json")?;
    let created_at: String = row.try_get("created_at")?;

    // ── 2. 获取分类和标签 ────────────────────────────────────────────
    let category_name: Option<String> =
        match row.try_get::<Option<Uuid>, _>("category_id")? {
            Some(cat_id) => {
                sqlx::query_scalar("SELECT name FROM categories WHERE id = $1")
                    .bind(cat_id)
                    .fetch_optional(&state.db)
                    .await?
            }
            None => None,
        };

    let tags: Vec<String> = sqlx::query_scalar(
        r#"SELECT t.name FROM tags t
           JOIN post_tags pt ON t.id = pt.tag_id
           WHERE pt.post_id = $1
           ORDER BY t.name"#,
    )
    .bind(post_id)
    .fetch_all(&state.db)
    .await?;

    // ── 3. 获取 MDX 正文 ──────────────────────────────────────────────
    let body_mdx = match &content_json {
        Some(json) if !json.is_null() && !json.as_array().map(|a| a.is_empty()).unwrap_or(true) => {
            if json.is_array() {
                // BlockNote JSON 数组格式
                blocknote_json_to_mdx(json)
            } else {
                // Legacy TipTap JSON 对象格式
                blog_core::tiptap_json_to_mdx(json)
            }
        }
        _ => {
            // 没有 content_json 时降级使用 content_mdx
            content_mdx.as_deref().unwrap_or("").to_string()
        }
    };

    // ── 4. 组装 YAML frontmatter ─────────────────────────────────────
    let mut frontmatter = String::new();
    frontmatter.push_str("---\n");
    frontmatter.push_str(&format!("title: '{}'\n", yaml_escape(&title)));

    // 优先使用 published_at，否则用 created_at
    let date = if !published_at.is_empty() {
        published_at.chars().take(10).collect::<String>()
    } else {
        created_at.chars().take(10).collect::<String>()
    };
    frontmatter.push_str(&format!("date: '{}'\n", date));

    if let Some(ref cat) = category_name {
        if !cat.is_empty() {
            frontmatter.push_str(&format!("category: '{}'\n", yaml_escape(cat)));
        }
    }

    if !tags.is_empty() {
        frontmatter.push_str("tags:\n");
        for t in &tags {
            frontmatter.push_str(&format!("  - '{}'\n", yaml_escape(t)));
        }
    }

    if let Some(ref s) = summary {
        let trimmed = s.trim();
        if !trimmed.is_empty() {
            frontmatter.push_str(&format!("summary: '{}'\n", yaml_escape(trimmed)));
        }
    }

    if status.to_lowercase() == "draft" {
        frontmatter.push_str("draft: true\n");
    } else {
        frontmatter.push_str("draft: false\n");
    }

    frontmatter.push_str(&format!("showTOC: {}\n", show_toc));
    if !layout.is_empty() {
        frontmatter.push_str(&format!("layout: '{}'\n", yaml_escape(&layout)));
    }
    if is_featured {
        frontmatter.push_str("is_featured: true\n");
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

    frontmatter.push_str("---\n\n");

    let full_mdx = format!("{}{}", frontmatter, body_mdx);
    let safe_filename = slug_to_filename(&slug);

    Ok(Json(ExportMdxResponse {
        slug: slug.clone(),
        mdx: full_mdx,
        filename: format!("{}.mdx", safe_filename),
        title,
    }))
}

/// 导出单篇文章为纯 Markdown（不含 frontmatter）
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
        (status = 404, description = "文章不存在"),
    ),
)]
pub async fn export_post_md(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Path(post_id): Path<Uuid>,
) -> Result<Json<ExportMdxResponse>, AppError> {
    // 复用 export_post_mdx 的逻辑，但只返回 body（不含 frontmatter）
    let exported = export_post_mdx(State(state), Extension(auth_user), Path(post_id)).await?;

    // 提取 body（去掉 YAML frontmatter）
    let body = if let Some(idx) = exported.mdx.find("\n---\n") {
        exported.mdx[idx + 5..].trim().to_string()
    } else {
        exported.mdx.clone()
    };

    Ok(Json(ExportMdxResponse {
        slug: exported.slug.clone(),
        mdx: body,
        filename: format!("{}.md", slug_to_filename(&exported.slug)),
        title: exported.title.clone(),
    }))
}

/// 批量导出文章列表（返回 MDX 文本数组，前端可打包为 ZIP）
#[utoipa::path(
    post,
    path = "/admin/posts/export/batch",
    tag = "admin/export",
    security(("BearerAuth" = [])),
    request_body = BatchExportQuery,
    responses(
        (status = 200, description = "批量导出成功"),
    ),
)]
pub async fn batch_export_posts(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Json(query): Json<BatchExportQuery>,
) -> Result<Json<Vec<ExportMdxResponse>>, AppError> {
    use sqlx::QueryBuilder;

    let limit = query.limit.unwrap_or(100).min(500);

    // 如果指定了 ids，按 id 列表导出
    if let Some(ref ids) = query.ids {
        if ids.is_empty() {
            return Ok(Json(vec![]));
        }
        let mut results: Vec<ExportMdxResponse> = Vec::new();
        for id in ids {
            match export_post_mdx(
                State(state.clone()),
                Extension(auth_user.clone()) as Extension<AuthUser>,
                Path(*id),
            )
            .await
            {
                Ok(r) => results.push(r.0),
                Err(_) => continue,
            }
        }
        return Ok(Json(results));
    }

    // 按条件查询
    let mut builder: QueryBuilder<'_, sqlx::Postgres> = QueryBuilder::new(
        "SELECT id FROM posts WHERE deleted_at IS NULL",
    );

    if let Some(ref status) = query.status {
        if !status.trim().is_empty() {
            builder.push(" AND INITCAP(status::text) = ");
            builder.push_bind(status.trim());
        }
    }
    if let Some(cat_id) = query.category_id {
        builder.push(" AND category_id = ");
        builder.push_bind(cat_id);
    }
    if let Some(tag_id) = query.tag_id {
        builder.push(" AND id IN (SELECT post_id FROM post_tags WHERE tag_id = ");
        builder.push_bind(tag_id);
        builder.push(")");
    }

    builder.push(" ORDER BY updated_at DESC LIMIT ");
    builder.push_bind(limit as i64);

    let post_ids: Vec<Uuid> = builder
        .build_query_scalar()
        .fetch_all(&state.db)
        .await?;

    let mut results: Vec<ExportMdxResponse> = Vec::new();
    for id in &post_ids {
        match export_post_mdx(
            State(state.clone()),
            Extension(auth_user.clone()) as Extension<AuthUser>,
            Path(*id),
        )
        .await
        {
            Ok(r) => results.push(r.0),
            Err(_) => continue,
        }
    }

    Ok(Json(results))
}

/// 批量导出 ZIP（GET 请求，通过 query 参数传递 IDs）
///
/// 使用方式: `GET /admin/posts/export/batch-zip?ids=uuid1,uuid2,uuid3&include_media=true`
/// 返回 ZIP 文件，每篇文章一个 .mdx 文件，可选打包引用的媒体文件
#[utoipa::path(
    get,
    path = "/admin/posts/export/batch-zip",
    tag = "admin/export",
    security(("BearerAuth" = [])),
    params(
        ("ids" = String, Query, description = "逗号分隔的文章 ID 列表"),
        ("include_media" = Option<bool>, Query, description = "是否打包媒体文件到 ZIP"),
    ),
    responses(
        (status = 200, description = "ZIP 文件下载"),
        (status = 400, description = "参数错误"),
    ),
)]
pub async fn batch_export_zip(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Query(params): Query<BatchZipQuery>,
) -> Result<impl IntoResponse, AppError> {
    let ids: Vec<Uuid> = match &params.ids {
        Some(ids_str) if !ids_str.trim().is_empty() => {
            ids_str
                .split(',')
                .filter_map(|s| Uuid::parse_str(s.trim()).ok())
                .collect()
        }
        _ => {
            return Err(AppError::BadRequest("请提供 ids 参数（逗号分隔的 UUID 列表）".into()));
        }
    };

    if ids.is_empty() {
        return Err(AppError::BadRequest("未提供有效的文章 ID".into()));
    }

    let limit = ids.len().min(200);
    let include_media = params.include_media;

    // 收集所有 MDX 数据用于媒体提取
    let mut mdx_entries: Vec<(String, String)> = Vec::new(); // (filename, mdx_text)

    // 为每个 ID 生成 MDX 并打包
    let mut zip_buf = std::io::Cursor::new(Vec::new());
    {
        let mut zip_writer = zip::ZipWriter::new(&mut zip_buf);
        let options = zip::write::SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated);

        for (i, id) in ids.iter().take(limit).enumerate() {
            match export_post_mdx(
                State(state.clone()),
                Extension(auth_user.clone()),
                Path(*id),
            )
            .await
            {
                Ok(json_resp) => {
                    let data = json_resp.0;
                    let filename = format!("{}.mdx", data.slug.replace('/', "-"));
                    mdx_entries.push((filename.clone(), data.mdx.clone()));
                    zip_writer
                        .start_file(&filename, options)
                        .map_err(|e| {
                            tracing::error!(error=%e, "ZIP add file failed");
                            AppError::InternalError
                        })?;
                    zip_writer
                        .write_all(data.mdx.as_bytes())
                        .map_err(|e| {
                            tracing::error!(error=%e, "ZIP write failed");
                            AppError::InternalError
                        })?;
                }
                Err(e) => {
                    tracing::warn!(error=%e, ?id, "Skipped post in batch export");
                    continue;
                }
            }

            if (i + 1) % 50 == 0 {
                tracing::info!(count = i + 1, total = limit, "Batch ZIP export progress");
            }
        }

        // ── 打包媒体文件 ──────────────────────────────────────────────
        if include_media && !mdx_entries.is_empty() {
            let image_urls = extract_image_urls(&mdx_entries);
            if !image_urls.is_empty() {
                let added = pack_media_files(
                    &mut zip_writer,
                    &state,
                    &image_urls,
                    options,
                )
                .await;
                if let Err(ref e) = added {
                    tracing::warn!(error=%e, "Some media files could not be packed");
                }
                tracing::info!(
                    count = added.unwrap_or(0),
                    total = image_urls.len(),
                    "Media files packed into ZIP"
                );
            }
        }

        zip_writer.finish().map_err(|e| {
            tracing::error!(error=%e, "ZIP finish failed");
            AppError::InternalError
        })?;
    }

    let zip_data = zip_buf.into_inner();
    let zip_size = zip_data.len();
    tracing::info!(size = zip_size, count = limit, "Batch ZIP export complete");

    let disposition = format!(
        "attachment; filename=\"posts-export-{}.zip\"",
        chrono::Utc::now().format("%Y%m%d-%H%M%S")
    );

    let mut headers = HeaderMap::new();
    headers.insert(header::CONTENT_TYPE, "application/zip".parse().unwrap());
    headers.insert(header::CONTENT_DISPOSITION, disposition.parse().unwrap());

    let response = (StatusCode::OK, headers, Body::from(zip_data));

    Ok(response)
}

// ============================================================================
// 媒体提取和打包
// ============================================================================

/// 从多个 MDX 文本中提取所有图片 URL
fn extract_image_urls(entries: &[(String, String)]) -> Vec<String> {
    use regex::Regex;
    let re = Regex::new(r"!\[.*?\]\(([^)]+)\)").unwrap();
    let mut urls = Vec::new();

    for (_filename, mdx_text) in entries {
        for cap in re.captures_iter(mdx_text) {
            let url = cap[1].to_string();
            if !urls.contains(&url) && !url.is_empty() {
                urls.push(url);
            }
        }
    }

    urls
}

/// 将媒体文件从存储读取并写入 ZIP
///
/// 根据 URL 查找 media 表记录，读取文件内容，写入 ZIP 的 `media/` 目录。
/// 返回成功打包的文件数量。
async fn pack_media_files<W: std::io::Write + std::io::Seek>(
    zip_writer: &mut zip::ZipWriter<W>,
    state: &AppState,
    urls: &[String],
    options: zip::write::SimpleFileOptions,
) -> Result<usize, AppError> {
    if urls.is_empty() {
        return Ok(0);
    }

    // 批量查询 media 表 — 匹配 cdn_url 或 storage_path
    use sqlx::Row;

    // 构造 IN 子句
    let n = urls.len();
    let cdn_placeholders: Vec<String> = (1..=n)
        .map(|i| format!("${}", i))
        .collect();
    let storage_placeholders: Vec<String> = ((n + 1)..=(2 * n))
        .map(|i| format!("${}", i))
        .collect();
    let query = format!(
        r#"SELECT id, original_filename, cdn_url, storage_path, mime_type
           FROM media
           WHERE deleted_at IS NULL
           AND (
               cdn_url IN ({cdn}) OR storage_path IN ({storage})
           )"#,
        cdn = cdn_placeholders.join(","),
        storage = storage_placeholders.join(","),
    );

    let mut db_query = sqlx::query(&query);
    for url in urls {
        db_query = db_query.bind(url);
    }
    for url in urls {
        db_query = db_query.bind(url);
    }

    let rows = db_query.fetch_all(&state.db).await.map_err(|e| {
        tracing::error!(error=%e, "Failed to query media records");
        AppError::InternalError
    })?;

    // 构建 url → (original_filename, storage_path) 映射
    let mut url_to_path: std::collections::HashMap<String, (String, String)> =
        std::collections::HashMap::new();

    for row in &rows {
        let original_filename: String = row.get("original_filename");
        let storage_path: String = row.get("storage_path");

        if let Some(cdn_url) = row.get::<Option<String>, _>("cdn_url") {
            url_to_path.insert(cdn_url, (original_filename.clone(), storage_path.clone()));
        }
        // 也以 storage_path 作为 key（兼容无 cdn_url 的情况）
        url_to_path.insert(
            storage_path.clone(),
            (original_filename.clone(), storage_path.clone()),
        );
    }

    let mut added = 0usize;
    let storage = &state.storage;

    for url in urls {
        let (original_filename, storage_path) = match url_to_path.get(url) {
            Some(v) => v,
            None => {
                // 尝试直接以 URL 路径作为 storage key 读取
                tracing::debug!(url, "No media record found, trying direct storage read");
                let direct_key = url
                    .trim_start_matches(|c: char| c == '/')
                    .to_string();
                match storage.read(&direct_key).await {
                    Ok(_data) => {
                        // Fall through — use direct URL as key
                    }
                    Err(_) => continue,
                }
                // If direct read works, use URL-derived filename
                let fname = std::path::Path::new(url)
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| format!("image_{}.bin", added));
                match storage.read(&direct_key).await {
                    Ok(data) => {
                        let zip_name = format!("media/{}", fname);
                        if zip_writer.start_file(&zip_name, options).is_ok() {
                            if zip_writer.write_all(&data).is_ok() {
                                added += 1;
                            }
                        }
                    }
                    Err(_) => continue,
                }
                continue;
            }
        };

        // 从存储读取文件
        match storage.read(storage_path).await {
            Ok(data) => {
                let zip_name = format!("media/{}", original_filename);
                if zip_writer.start_file(&zip_name, options).is_ok() {
                    if zip_writer.write_all(&data).is_err() {
                        tracing::warn!(filename=original_filename, "Failed to write media to ZIP");
                    } else {
                        added += 1;
                    }
                }
            }
            Err(e) => {
                tracing::warn!(url, error=%e, "Failed to read media file");
            }
        }
    }

    Ok(added)
}

// ============================================================================
// 辅助函数
// ============================================================================

/// YAML 单引号安全转义
fn yaml_escape(s: &str) -> String {
    s.replace('\'', "''")
}

/// slug 转安全文件名
fn slug_to_filename(slug: &str) -> String {
    slug.replace('/', "-").replace('\\', "-")
}
