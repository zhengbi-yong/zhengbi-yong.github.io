use axum::{
    extract::{Path, Query, State, Extension},
    http::{header, StatusCode},
    response::{IntoResponse, Json},
};
use blog_db::cms::*;
use blog_shared::{AppError, AuthUser};
use crate::state::AppState;
use utoipa;
use uuid::Uuid;

/// 上传媒体文件
/// TODO: Enable multipart feature in Cargo.toml to use this function
#[utoipa::path(
    post,
    path = "/admin/media/upload",
    tag = "admin/media",
    request_body = MediaUploadRequest,
    responses(
        (status = 201, description = "上传成功", body = MediaListItem),
        (status = 400, description = "请求参数错误"),
        (status = 401, description = "未认证"),
        (status = 413, description = "文件过大"),
        (status = 501, description = "暂未实现 - 需要启用 multipart feature")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn upload_media(
    State(_state): State<AppState>,
    Extension(_auth_user): Extension<AuthUser>,
    // mut mutipart: Multipart,  // Requires multipart feature
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    // TODO: Implement multipart file upload
    // Requires: axum = { version = "0.8", features = ["multipart"] }
    Err(AppError::BadRequest("Media upload not yet implemented - requires multipart feature".to_string()))

    /*
    let mut file_data: Option<Vec<u8>> = None;
    let mut filename: Option<String> = None;
    let mut alt_text: Option<String> = None;
    let mut caption: Option<String> = None;

    // 处理 multipart 数据
    while let Some(field) = mutipart.next_field().await.map_err(|e| {
        AppError::BadRequest(format!("Failed to read multipart: {}", e))
    })? {
        let field_name = field.name().unwrap_or("").to_string();

        match field_name.as_str() {
            "file" => {
                filename = field.file_name().map(|s| s.to_string());
                let data = field.bytes().await.map_err(|e| {
                    AppError::BadRequest(format!("Failed to read file: {}", e))
                })?;

                // 检查文件大小（最大 50MB）
                if data.len() > 50 * 1024 * 1024 {
                    return Err(AppError::BadRequest("File too large (max 50MB)".to_string()));
                }

                file_data = Some(data.to_vec());
            }
            "alt_text" => {
                alt_text = Some(field.text().await.unwrap_or_default());
            }
            "caption" => {
                caption = Some(field.text().await.unwrap_or_default());
            }
            _ => {}
        }
    }

    let data = file_data.ok_or_else(|| AppError::BadRequest("No file provided".to_string()))?;
    let original_filename = filename.ok_or_else(|| AppError::BadRequest("No filename provided".to_string()))?;

    // 检测 MIME 类型
    let mime_type = detect_mime_type(&data, &original_filename);

    // 验证文件类型
    if !is_allowed_mime_type(&mime_type) {
        return Err(AppError::BadRequest(format!("File type not allowed: {}", mime_type)));
    }

    // 生成文件名
    let file_extension = original_filename
        .rsplit('.')
        .next()
        .unwrap_or("bin");
    let new_filename = format!("{}.{}", Uuid::new_v4(), file_extension);

    // 确定媒体类型
    let media_type = get_media_type(&mime_type);

    // 获取图片尺寸（如果是图片）
    let (width, height) = if media_type == "image" {
        get_image_dimensions(&data)?
    } else {
        (None, None)
    };

    // 存储路径（本地存储，可以改为 S3/R2）
    let storage_path = format!("/media/{}", new_filename);

    // TODO: 实际保存文件到存储系统（本地文件系统、S3、R2等）
    // 这里需要根据实际的存储配置来实现
    // 例如：
    // let mut file = tokio::fs::File::create(format!("{}{}", state.media_upload_path, storage_path)).await?;
    // file.write_all(&data).await?;

    // 保存到数据库
    let id = sqlx::query_scalar!(
        r#"
        INSERT INTO media (
            filename, original_filename, mime_type, size_bytes,
            width, height, storage_path, alt_text, caption,
            uploaded_by, media_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
        "#,
        new_filename,
        original_filename,
        mime_type,
        data.len() as i64,
        width,
        height,
        storage_path,
        alt_text,
        caption,
        auth_user.id,
        media_type
    )
    .fetch_one(&state.db)
    .await?;

    // TODO: 如果使用 CDN，上传到 CDN 并获取 URL
    // let cdn_url = upload_to_cdn(&data, &new_filename).await?;
    let cdn_url = None;

    // 更新 CDN URL
    if let Some(cdn) = cdn_url {
        sqlx::query!(
            "UPDATE media SET cdn_url = $1 WHERE id = $2",
            cdn,
            id
        )
        .execute(&state.db)
        .await?;
    }

    // 返回媒体信息
    let media = sqlx::query_as!(
        MediaListItem,
        r#"
        SELECT
            id, filename, original_filename, mime_type,
            size_bytes, width, height,
            COALESCE(cdn_url, storage_path) as "url!",
            media_type, usage_count,
            created_at
        FROM media
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        id
    )
    .fetch_one(&state.db)
    .await?;

    // 清除缓存
    clear_media_cache(&state).await;

    Ok((
        StatusCode::CREATED,
        Json(media),
    ))
    */
}

/// 获取媒体文件详情

/// 获取媒体文件详情
#[utoipa::path(
    get,
    path = "/admin/media/{id}",
    tag = "admin/media",
    params(
        ("id" = Uuid, Path, description = "媒体文件ID")
    ),
    responses(
        (status = 200, description = "获取成功", body = Media),
        (status = 404, description = "媒体文件不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn get_media(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let media = sqlx::query_as!(
        Media,
        r#"
        SELECT
            id, filename, original_filename, mime_type,
            size_bytes, width, height,
            storage_path as "storage_path!",
            cdn_url,
            alt_text, caption, uploaded_by,
            media_type as "media_type!",
            usage_count, created_at, updated_at, deleted_at
        FROM media
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        id
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Media not found".to_string()))?;

    Ok(Json(media).into_response())
}

/// 更新媒体文件元数据
#[utoipa::path(
    patch,
    path = "/admin/media/{id}",
    tag = "admin/media",
    params(
        ("id" = Uuid, Path, description = "媒体文件ID")
    ),
    request_body = UpdateMediaRequest,
    responses(
        (status = 200, description = "更新成功", body = MessageResponse),
        (status = 401, description = "未认证"),
        (status = 404, description = "媒体文件不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn update_media(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateMediaRequest>,
) -> Result<impl IntoResponse, AppError> {
    // 检查媒体是否存在
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM media WHERE id = $1 AND deleted_at IS NULL)"
    )
    .bind(id)
    .fetch_one(&state.db)
    .await?;

    if !exists {
        return Err(AppError::NotFound("Media not found".to_string()));
    }

    // 构建更新查询
    let mut update_fields = Vec::new();
    let mut param_index = 2;

    if req.alt_text.is_some() {
        update_fields.push(format!("alt_text = ${}", param_index));
        param_index += 1;
    }
    if req.caption.is_some() {
        update_fields.push(format!("caption = ${}", param_index));
        param_index += 1;
    }

    if update_fields.is_empty() {
        return Ok(Json(MessageResponse {
            message: "No fields to update".to_string(),
        }).into_response());
    }

    let query = format!(
        "UPDATE media SET {} WHERE id = $1",
        update_fields.join(", ")
    );

    let mut query_builder = sqlx::query(&query).bind(id);

    if let Some(alt_text) = req.alt_text {
        query_builder = query_builder.bind(alt_text);
    }
    if let Some(caption) = req.caption {
        query_builder = query_builder.bind(caption);
    }

    query_builder.execute(&state.db).await?;

    // 清除缓存
    clear_media_cache(&state).await;

    Ok(Json(MessageResponse {
        message: "Media updated successfully".to_string(),
    }).into_response())
}

/// 删除媒体文件（软删除）
#[utoipa::path(
    delete,
    path = "/admin/media/{id}",
    tag = "admin/media",
    params(
        ("id" = Uuid, Path, description = "媒体文件ID")
    ),
    responses(
        (status = 200, description = "删除成功", body = MessageResponse),
        (status = 401, description = "未认证"),
        (status = 404, description = "媒体文件不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn delete_media(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let affected = sqlx::query!(
        "UPDATE media SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL",
        id
    )
    .execute(&state.db)
    .await?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound("Media not found".to_string()));
    }

    // 清除缓存
    clear_media_cache(&state).await;

    Ok(Json(MessageResponse {
        message: "Media deleted successfully".to_string(),
    }))
}

/// 获取媒体文件列表
#[utoipa::path(
    get,
    path = "/admin/media",
    tag = "admin/media",
    params(
        ("page" = Option<u32>, Query, description = "页码（从1开始）"),
        ("limit" = Option<u32>, Query, description = "每页数量（默认20）"),
        ("media_type" = Option<String>, Query, description = "媒体类型筛选：image, video, document, other"),
        ("search" = Option<String>, Query, description = "搜索关键词（文件名）")
    ),
    responses(
        (status = 200, description = "获取成功", body = MediaListResponse),
        (status = 401, description = "未认证")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn list_media(
    State(state): State<AppState>,
    Query(params): Query<MediaListParams>,
) -> Result<impl IntoResponse, AppError> {
    let page = params.page.unwrap_or(1).max(1);
    let limit = params.limit.unwrap_or(20).min(100);
    let offset = (page - 1) * limit;

    // 构建查询条件
    let mut where_conditions = vec!["deleted_at IS NULL".to_string()];

    if let Some(media_type) = &params.media_type {
        where_conditions.push(format!("media_type = '{}'", media_type));
    }

    if let Some(search) = &params.search {
        where_conditions.push(format!(
            "(original_filename ILIKE '%{}%' OR filename ILIKE '%{}%')",
            search.replace('\'', "''"),
            search.replace('\'', "''")
        ));
    }

    let where_clause = where_conditions.join(" AND ");

    // 查询总数
    let count_query = format!(
        "SELECT COUNT(*) FROM media WHERE {}",
        where_clause
    );
    let total: i64 = sqlx::query_scalar(&count_query)
        .fetch_one(&state.db)
        .await?;

    // 查询列表
    let list_query = format!(
        r#"
        SELECT
            id, filename, original_filename, mime_type,
            size_bytes, width, height,
            COALESCE(cdn_url, storage_path) as "url!",
            media_type, usage_count,
            created_at
        FROM media
        WHERE {}
        ORDER BY created_at DESC
        LIMIT {} OFFSET {}
        "#,
        where_clause, limit, offset
    );

    let media_list: Vec<MediaListItem> = sqlx::query_as(&list_query)
        .fetch_all(&state.db)
        .await?;

    let total_pages = ((total as f64) / (limit as f64)).ceil() as u32;

    Ok(Json(MediaListResponse {
        media: media_list,
        total,
        page,
        limit,
        total_pages,
    }).into_response())
}

/// 获取未使用的媒体文件
#[utoipa::path(
    get,
    path = "/admin/media/unused",
    tag = "admin/media",
    responses(
        (status = 200, description = "获取成功", body = Vec<MediaListItem>),
        (status = 401, description = "未认证")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn get_unused_media(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let media_list: Vec<MediaListItem> = sqlx::query_as!(
        MediaListItem,
        r#"
        SELECT
            id, filename, original_filename, mime_type,
            size_bytes, width, height,
            COALESCE(cdn_url, storage_path) as "url!",
            media_type as "media_type!",
            usage_count,
            created_at
        FROM media
        WHERE usage_count = 0
            AND deleted_at IS NULL
            AND created_at < NOW() - INTERVAL '30 days'
        ORDER BY created_at ASC
        "#
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(media_list).into_response())
}

// ===== 辅助函数 =====

fn detect_mime_type(_data: &[u8], filename: &str) -> String {
    // 基于文件扩展名的简单检测
    let extension = filename.rsplit('.').next().unwrap_or("").to_lowercase();

    match extension.as_str() {
        "jpg" | "jpeg" => "image/jpeg".to_string(),
        "png" => "image/png".to_string(),
        "gif" => "image/gif".to_string(),
        "webp" => "image/webp".to_string(),
        "svg" => "image/svg+xml".to_string(),
        "mp4" => "video/mp4".to_string(),
        "webm" => "video/webm".to_string(),
        "mov" => "video/quicktime".to_string(),
        "pdf" => "application/pdf".to_string(),
        "doc" | "docx" => "application/msword".to_string(),
        "xls" | "xlsx" => "application/vnd.ms-excel".to_string(),
        "txt" => "text/plain".to_string(),
        _ => "application/octet-stream".to_string(),
    }
}

fn is_allowed_mime_type(mime_type: &str) -> bool {
    const ALLOWED_TYPES: &[&str] = &[
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "application/pdf",
        "text/plain",
    ];

    ALLOWED_TYPES.contains(&mime_type)
}

fn get_media_type(mime_type: &str) -> &'static str {
    if mime_type.starts_with("image/") {
        "image"
    } else if mime_type.starts_with("video/") {
        "video"
    } else if mime_type == "application/pdf" {
        "document"
    } else {
        "other"
    }
}

fn get_image_dimensions(_data: &[u8]) -> Result<(Option<i32>, Option<i32>), AppError> {
    // 这里简化处理，实际应该使用 image crate 解析图片
    // 返回 None 表示无法获取尺寸
    Ok((None, None))
}

async fn clear_media_cache(state: &AppState) {
    if let Ok(mut conn) = state.redis.get().await {
        let _: () = redis::cmd("DEL")
            .arg("media:list")
            .query_async(&mut conn)
            .await
            .unwrap_or(());
    }
}
