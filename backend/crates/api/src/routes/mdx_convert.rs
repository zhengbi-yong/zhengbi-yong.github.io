//! MDX 转换路由：MDX 文本 ↔ TipTap JSON
//!
//! 提供三个端点：
//! - POST /admin/mdx/convert — 单篇 MDX → TipTap JSON 转换
//! - POST /admin/mdx/batch-convert — 批量 MDX → TipTap JSON 转换（可更新数据库）
//! - POST /admin/mdx/migrate-all — 迁移数据库中所有 content_json 为空的文章

use axum::{extract::State, response::IntoResponse, Json};
use blog_shared::AppError;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
use utoipa::ToSchema;

use crate::state::AppState;

// ============================================================================
// Request / Response types
// ============================================================================

/// 单篇 MDX 转换请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct ConvertRequest {
    /// 原始 MDX 文本
    pub mdx_text: String,
}

/// 单篇 MDX 转换响应
#[derive(Debug, Serialize, ToSchema)]
pub struct ConvertResponse {
    /// TipTap JSON AST
    pub content_json: serde_json::Value,
    /// 转换后的 MDX（roundtrip 验证）
    pub mdx_compiled: String,
    /// 统计信息
    pub stats: blog_core::ConversionStats,
}

/// 批量转换请求中的单篇文章
#[derive(Debug, Deserialize, ToSchema)]
pub struct BatchArticle {
    /// 文章 slug（用于更新数据库）
    pub slug: String,
    /// 原始 MDX 文本
    pub mdx_text: String,
}

/// 批量转换请求
#[derive(Debug, Deserialize, ToSchema)]
pub struct BatchConvertRequest {
    /// 文章列表
    pub articles: Vec<BatchArticle>,
    /// 是否同时更新数据库
    #[serde(default)]
    pub update_database: bool,
}

/// 批量转换结果中的单条记录
#[derive(Debug, Serialize, ToSchema)]
pub struct BatchResult {
    pub slug: String,
    pub success: bool,
    pub content_json: Option<serde_json::Value>,
    pub error: Option<String>,
}

/// 批量转换响应
#[derive(Debug, Serialize, ToSchema)]
pub struct BatchConvertResponse {
    pub results: Vec<BatchResult>,
    pub summary: BatchSummary,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct BatchSummary {
    pub total: usize,
    pub success: usize,
    pub failed: usize,
}

/// 数据库迁移统计
#[derive(Debug, Serialize, ToSchema)]
pub struct MigrateAllStats {
    pub total: usize,
    pub updated: usize,
    pub skipped: usize,
    pub failed: Vec<String>,
    pub duration_ms: u64,
}

// ============================================================================
// Handlers
// ============================================================================

/// 单篇 MDX → TipTap JSON 转换
///
/// 将一段 MDX/Markdown 文本转换为 TipTap ProseMirror JSON AST。
/// 同时返回 roundtrip 验证后的 MDX 和统计信息。
#[utoipa::path(
    post,
    path = "/v1/admin/mdx/convert",
    tag = "mdx-convert",
    request_body = ConvertRequest,
    responses(
        (status = 200, description = "转换成功", body = ConvertResponse),
        (status = 400, description = "MDX 文本为空"),
        (status = 401, description = "未认证"),
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn convert_mdx(
    State(_state): State<AppState>,
    Json(req): Json<ConvertRequest>,
) -> Result<impl IntoResponse, AppError> {
    if req.mdx_text.trim().is_empty() {
        return Err(AppError::BadRequest("MDX text is empty".to_string()));
    }

    let (content_json, stats) = blog_core::mdx_to_tiptap_json_with_stats(&req.mdx_text);
    let mdx_compiled = blog_core::tiptap_json_to_mdx(&content_json);

    Ok(Json(ConvertResponse {
        content_json,
        mdx_compiled,
        stats,
    }))
}

/// 批量 MDX → TipTap JSON 转换
///
/// 同时处理多篇文章的 MDX → JSON 转换。
/// 如果 `update_database` 为 true，则同时更新数据库中的 `content_json` 字段。
#[utoipa::path(
    post,
    path = "/v1/admin/mdx/batch-convert",
    tag = "mdx-convert",
    request_body = BatchConvertRequest,
    responses(
        (status = 200, description = "批量转换完成", body = BatchConvertResponse),
        (status = 401, description = "未认证"),
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn batch_convert_mdx(
    State(state): State<AppState>,
    Json(req): Json<BatchConvertRequest>,
) -> Result<impl IntoResponse, AppError> {
    let mut results = Vec::with_capacity(req.articles.len());
    let mut success_count = 0;
    let mut failed_count = 0;

    for article in &req.articles {
        if article.mdx_text.trim().is_empty() {
            results.push(BatchResult {
                slug: article.slug.clone(),
                success: false,
                content_json: None,
                error: Some("MDX text is empty".to_string()),
            });
            failed_count += 1;
            continue;
        }

        let content_json = blog_core::mdx_to_tiptap_json(&article.mdx_text);

        if req.update_database {
            match update_article_content_json(&state.db, &article.slug, &content_json).await {
                Ok(_) => {
                    results.push(BatchResult {
                        slug: article.slug.clone(),
                        success: true,
                        content_json: Some(content_json),
                        error: None,
                    });
                    success_count += 1;
                }
                Err(e) => {
                    results.push(BatchResult {
                        slug: article.slug.clone(),
                        success: false,
                        content_json: Some(content_json),
                        error: Some(format!("Database update failed: {}", e)),
                    });
                    failed_count += 1;
                }
            }
        } else {
            results.push(BatchResult {
                slug: article.slug.clone(),
                success: true,
                content_json: Some(content_json),
                error: None,
            });
            success_count += 1;
        }
    }

    Ok(Json(BatchConvertResponse {
        results,
        summary: BatchSummary {
            total: req.articles.len(),
            success: success_count,
            failed: failed_count,
        },
    }))
}

/// 迁移数据库中所有 content_json 为空或无效的文章
///
/// 扫描 articles 表，找出 content_json 为空或无效的记录，
/// 使用 content_mdx 字段重新生成 TipTap JSON。
#[utoipa::path(
    post,
    path = "/v1/admin/mdx/migrate-all",
    tag = "mdx-convert",
    responses(
        (status = 200, description = "迁移完成", body = MigrateAllStats),
        (status = 401, description = "未认证"),
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn migrate_all_content_json(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let start = std::time::Instant::now();

    // 查找所有 content_json 需要重新生成的文章：
    // 1. content_json 为空/无效，或
    // 2. content_json 只有一个 paragraph 节点（历史遗留的伪 JSON）
    // 直接用 sqlx::query（非 query_as）配合显式类型提取
    let rows_raw = sqlx::query(
        r#"
        SELECT slug, content_mdx
        FROM posts
        WHERE content_mdx IS NOT NULL AND content_mdx != ''
        ORDER BY slug
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    let rows_with_mdx: Vec<(String, String)> = rows_raw
        .iter()
        .map(|row| {
            let slug: String = row.try_get(0).unwrap_or_default();
            let mdx: String = row.try_get(1).unwrap_or_default();
            (slug, mdx)
        })
        .collect();

    eprintln!(
        "DEBUG migrate-all: rows_with_mdx.len() = {}",
        rows_with_mdx.len()
    );

    // 过滤出需要迁移的行（检查 content_json）
    let mut rows: Vec<(String, String)> = Vec::new();
    for (slug, mdx) in &rows_with_mdx {
        let content_json: Option<serde_json::Value> =
            sqlx::query_scalar(r#"SELECT content_json FROM posts WHERE slug = $1"#)
                .bind(slug)
                .fetch_optional(&state.db)
                .await
                .map_err(AppError::Database)?
                .unwrap_or(None);

        if needs_regeneration(&content_json) {
            rows.push((slug.clone(), mdx.clone()));
        } else {
            eprintln!(
                "DEBUG migrate-all: skipping {} (content_json={:?})",
                slug, content_json
            );
        }
    }

    let total = rows.len();
    let mut updated = 0;
    let mut skipped = 0;
    let mut failed: Vec<String> = Vec::new();

    for (slug, content_mdx) in &rows {
        let json = blog_core::mdx_to_tiptap_json(content_mdx);
        let json_str = serde_json::to_string(&json)
            .map_err(|e| AppError::BadRequest(format!("JSON serialization failed: {}", e)))?;

        // 同时生成 MDX（双轨更新）
        let mdx_compiled = blog_core::tiptap_json_to_mdx(&json);

        match sqlx::query(
            r#"
            UPDATE posts
            SET content_json = $1::jsonb,
                content_mdx = $2
            WHERE slug = $3
            "#,
        )
        .bind(&json_str)
        .bind(&mdx_compiled)
        .bind(slug)
        .execute(&state.db)
        .await
        {
            Ok(_) => updated += 1,
            Err(e) => {
                failed.push(format!("{}: {}", slug, e));
                skipped += 1;
            }
        }
    }

    let duration_ms = start.elapsed().as_millis() as u64;

    Ok(Json(MigrateAllStats {
        total,
        updated,
        skipped,
        failed,
        duration_ms,
    }))
}

// ============================================================================
// Internal helpers
// ============================================================================

/// 判断 content_json 是否需要重新生成
///
/// 旧的批量导入脚本生成了伪 JSON，所有内容被塞入一个 paragraph 节点。
/// 真正的 TipTap JSON 应该有多个块级节点（heading, codeBlock 等）。
fn needs_regeneration(content_json: &Option<serde_json::Value>) -> bool {
    // 空值
    if content_json.is_none() {
        return true;
    }
    let content_json = content_json.as_ref().unwrap();
    if content_json.is_null() {
        return true;
    }
    if let Some(obj) = content_json.as_object() {
        // 空对象
        if obj.is_empty() {
            return true;
        }
        // 检查是否只有一个 paragraph 节点（且该 paragraph 包含换行符）
        if let Some(content) = obj.get("content").and_then(|c| c.as_array()) {
            if content.len() == 1 {
                let first = &content[0];
                if first.get("type") == Some(&serde_json::json!("paragraph")) {
                    // 如果 content_json 只有一个 paragraph，说明可能是伪 JSON
                    // 进一步检查：paragraph 的 text 是否包含 \n（说明没有被结构化）
                    if let Some(text_nodes) = first.get("content").and_then(|c| c.as_array()) {
                        for node in text_nodes {
                            if let Some(text) = node.get("text").and_then(|t| t.as_str()) {
                                if text.contains('\n') {
                                    return true;
                                }
                            }
                        }
                    }
                }
                // 只包含 horizontalRule 或 hardBreak — 也是合法的单节点内容
                let first_type = first.get("type").and_then(|t| t.as_str()).unwrap_or("");
                if first_type != "paragraph" && first_type != "heading" {
                    // 只有一个非标准块级节点 — 可能是伪 JSON
                    return true;
                }
            }
        }
    }
    // 有多个块级节点的或空对象 — 可能是有效的
    false
}

/// 更新数据库中单篇文章的 content_json
async fn update_article_content_json(
    db: &PgPool,
    slug: &str,
    content_json: &serde_json::Value,
) -> Result<(), AppError> {
    let json_str = serde_json::to_string(content_json)
        .map_err(|e| AppError::BadRequest(format!("JSON serialization failed: {}", e)))?;
    let mdx = blog_core::tiptap_json_to_mdx(content_json);

    sqlx::query(
        r#"
        UPDATE posts
        SET content_json = $1::jsonb,
            content_mdx = $2
        WHERE slug = $3
        "#,
    )
    .bind(&json_str)
    .bind(&mdx)
    .bind(slug)
    .execute(db)
    .await
    .map_err(AppError::Database)?;

    Ok(())
}
