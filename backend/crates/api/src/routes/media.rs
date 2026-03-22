use crate::state::AppState;
use crate::storage::StorageError;
use axum::{
    extract::{Extension, Multipart, Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
};
use blog_db::cms::*;
use blog_shared::{AppError, AuthUser};
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, QueryBuilder};
use std::collections::BTreeMap;
use std::path::Path as FsPath;
use utoipa::{self, ToSchema};
use uuid::Uuid;

#[derive(Debug, Deserialize, ToSchema)]
pub struct MediaPresignUploadRequest {
    pub filename: String,
    pub content_type: Option<String>,
    pub expires_secs: Option<u32>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct MediaPresignUploadResponse {
    pub object_key: String,
    pub upload_url: String,
    pub asset_url: String,
    pub upload_method: String,
    pub content_type: String,
    pub expires_in_secs: u32,
    pub required_headers: BTreeMap<String, String>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct FinalizeMediaUploadRequest {
    pub object_key: String,
    pub original_filename: String,
    pub alt_text: Option<String>,
    pub caption: Option<String>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct MediaDownloadUrlParams {
    pub expires_secs: Option<u32>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct MediaDownloadUrlResponse {
    pub url: String,
    pub expires_in_secs: Option<u32>,
}

struct NewMediaRecord {
    object_key: String,
    original_filename: String,
    mime_type: String,
    size_bytes: i64,
    width: Option<i32>,
    height: Option<i32>,
    alt_text: Option<String>,
    caption: Option<String>,
    uploaded_by: Uuid,
    media_type: String,
    url: String,
}

/// 上传媒体文件
#[utoipa::path(
    post,
    path = "/admin/media/upload",
    tag = "admin/media",
    request_body = MediaUploadRequest,
    responses(
        (status = 201, description = "上传成功", body = MediaListItem),
        (status = 400, description = "请求参数错误"),
        (status = 401, description = "未认证"),
        (status = 413, description = "文件过大")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn upload_media(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    mut multipart: Multipart,
) -> Result<(StatusCode, Json<MediaListItem>), AppError> {
    let mut file_data: Option<Vec<u8>> = None;
    let mut filename: Option<String> = None;
    let mut alt_text: Option<String> = None;
    let mut caption: Option<String> = None;
    let mut content_type: Option<String> = None;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|error| AppError::BadRequest(format!("Failed to read multipart: {}", error)))?
    {
        let field_name = field.name().unwrap_or("").to_string();

        match field_name.as_str() {
            "file" => {
                filename = field.file_name().map(|value| value.to_string());
                content_type = field.content_type().map(|value| value.to_string());
                let data = field.bytes().await.map_err(|error| {
                    AppError::BadRequest(format!("Failed to read file: {}", error))
                })?;

                if data.len() > 50 * 1024 * 1024 {
                    return Err(AppError::BadRequest(
                        "File too large (max 50MB)".to_string(),
                    ));
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
    let original_filename =
        filename.ok_or_else(|| AppError::BadRequest("No filename provided".to_string()))?;
    let mime_type = resolve_mime_type(content_type.as_deref(), &original_filename);
    ensure_allowed_mime_type(&mime_type)?;

    let object_key = build_media_object_key(&original_filename, &mime_type);
    let media_type = get_media_type(&mime_type).to_string();
    let (width, height) = if media_type == "image" {
        get_image_dimensions(&data)?
    } else {
        (None, None)
    };

    let stored_url = state
        .storage
        .store(&object_key, &data, &mime_type)
        .await
        .map_err(map_storage_error)?;

    let media = persist_media_record(
        &state,
        NewMediaRecord {
            object_key,
            original_filename,
            mime_type,
            size_bytes: data.len() as i64,
            width,
            height,
            alt_text,
            caption,
            uploaded_by: auth_user.id,
            media_type,
            url: stored_url,
        },
    )
    .await?;

    clear_media_cache(&state).await;

    Ok((StatusCode::CREATED, Json(media)))
}

/// 为对象存储生成直传 URL
#[utoipa::path(
    post,
    path = "/admin/media/presign-upload",
    tag = "admin/media",
    request_body = MediaPresignUploadRequest,
    responses(
        (status = 200, description = "生成成功", body = MediaPresignUploadResponse),
        (status = 400, description = "请求参数错误"),
        (status = 401, description = "未认证")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn presign_media_upload(
    State(state): State<AppState>,
    Json(req): Json<MediaPresignUploadRequest>,
) -> Result<impl IntoResponse, AppError> {
    if req.filename.trim().is_empty() {
        return Err(AppError::BadRequest("Filename is required".to_string()));
    }

    let expires_secs = normalize_presign_expiry(req.expires_secs);
    let mime_type = resolve_mime_type(req.content_type.as_deref(), &req.filename);
    ensure_allowed_mime_type(&mime_type)?;

    let object_key = build_media_object_key(&req.filename, &mime_type);
    let upload_url = state
        .storage
        .presigned_upload_url(&object_key, &mime_type, expires_secs)
        .await
        .map_err(map_storage_error)?
        .ok_or_else(|| {
            AppError::BadRequest(
                "Configured storage backend does not support presigned uploads".to_string(),
            )
        })?;

    let mut required_headers = BTreeMap::new();
    required_headers.insert("content-type".to_string(), mime_type.clone());

    Ok(Json(MediaPresignUploadResponse {
        object_key: object_key.clone(),
        upload_url,
        asset_url: state.storage.object_url(&object_key),
        upload_method: "PUT".to_string(),
        content_type: mime_type,
        expires_in_secs: expires_secs,
        required_headers,
    }))
}

/// 将直传对象登记为媒体记录
#[utoipa::path(
    post,
    path = "/admin/media/finalize",
    tag = "admin/media",
    request_body = FinalizeMediaUploadRequest,
    responses(
        (status = 201, description = "登记成功", body = MediaListItem),
        (status = 400, description = "请求参数错误"),
        (status = 401, description = "未认证"),
        (status = 404, description = "对象不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn finalize_media_upload(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Json(req): Json<FinalizeMediaUploadRequest>,
) -> Result<(StatusCode, Json<MediaListItem>), AppError> {
    let object_key = validate_media_object_key(&req.object_key)?;

    let metadata = state
        .storage
        .head(object_key)
        .await
        .map_err(map_storage_error)?;
    let mime_type = resolve_mime_type(metadata.content_type.as_deref(), &req.original_filename);
    ensure_allowed_mime_type(&mime_type)?;

    let media = persist_media_record(
        &state,
        NewMediaRecord {
            object_key: object_key.to_string(),
            original_filename: req.original_filename,
            mime_type: mime_type.clone(),
            size_bytes: metadata.size_bytes,
            width: None,
            height: None,
            alt_text: req.alt_text,
            caption: req.caption,
            uploaded_by: auth_user.id,
            media_type: get_media_type(&mime_type).to_string(),
            url: state.storage.object_url(object_key),
        },
    )
    .await?;

    clear_media_cache(&state).await;

    Ok((StatusCode::CREATED, Json(media)))
}

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
    let media = sqlx::query_as::<_, Media>(
        r#"
        SELECT
            id, filename, original_filename, mime_type,
            size_bytes, width, height, storage_path, cdn_url,
            alt_text, caption, uploaded_by, media_type,
            usage_count, created_at, updated_at, deleted_at
        FROM media
        WHERE id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Media not found".to_string()))?;

    Ok(Json(media).into_response())
}

/// 为媒体文件生成下载 URL
#[utoipa::path(
    get,
    path = "/admin/media/{id}/download-url",
    tag = "admin/media",
    params(
        ("id" = Uuid, Path, description = "媒体文件ID"),
        ("expires_secs" = Option<u32>, Query, description = "签名链接有效期，默认900秒")
    ),
    responses(
        (status = 200, description = "生成成功", body = MediaDownloadUrlResponse),
        (status = 404, description = "媒体文件不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn get_media_download_url(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Query(params): Query<MediaDownloadUrlParams>,
) -> Result<impl IntoResponse, AppError> {
    let expires_secs = normalize_presign_expiry(params.expires_secs);
    let storage_path: String =
        sqlx::query_scalar("SELECT storage_path FROM media WHERE id = $1 AND deleted_at IS NULL")
            .bind(id)
            .fetch_optional(&state.db)
            .await?
            .ok_or_else(|| AppError::NotFound("Media not found".to_string()))?;

    let stable_url = state.storage.object_url(&storage_path);
    let url = state
        .storage
        .presigned_download_url(&storage_path, expires_secs)
        .await
        .map_err(map_storage_error)?
        .unwrap_or_else(|| stable_url.clone());

    let expires_in_secs = if url == stable_url {
        None
    } else {
        Some(expires_secs)
    };

    Ok(Json(MediaDownloadUrlResponse {
        url,
        expires_in_secs,
    }))
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
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM media WHERE id = $1 AND deleted_at IS NULL)",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await?;

    if !exists {
        return Err(AppError::NotFound("Media not found".to_string()));
    }

    let mut update_fields = Vec::new();
    let mut param_index = 2;

    if req.alt_text.is_some() {
        update_fields.push(format!("alt_text = ${}", param_index));
        param_index += 1;
    }
    if req.caption.is_some() {
        update_fields.push(format!("caption = ${}", param_index));
    }

    if update_fields.is_empty() {
        return Ok(Json(MessageResponse {
            message: "No fields to update".to_string(),
        })
        .into_response());
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
    clear_media_cache(&state).await;

    Ok(Json(MessageResponse {
        message: "Media updated successfully".to_string(),
    })
    .into_response())
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
    let storage_path: String =
        sqlx::query_scalar("SELECT storage_path FROM media WHERE id = $1 AND deleted_at IS NULL")
            .bind(id)
            .fetch_optional(&state.db)
            .await?
            .ok_or_else(|| AppError::NotFound("Media not found".to_string()))?;

    sqlx::query("UPDATE media SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL")
        .bind(id)
        .execute(&state.db)
        .await?;

    if let Err(error) = state.storage.delete(&storage_path).await {
        tracing::warn!("Failed to delete media object {}: {}", storage_path, error);
    }

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
    let limit = params.limit.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * limit;

    let mut count_builder = QueryBuilder::<Postgres>::new(
        "SELECT COUNT(*)::BIGINT FROM media WHERE deleted_at IS NULL",
    );
    apply_media_filters(&mut count_builder, &params);
    let total: i64 = count_builder
        .build_query_scalar()
        .fetch_one(&state.db)
        .await?;

    let mut list_builder = QueryBuilder::<Postgres>::new(
        r#"
        SELECT
            id, filename, original_filename, mime_type,
            size_bytes, width, height,
            COALESCE(cdn_url, storage_path) AS url,
            media_type, usage_count, created_at
        FROM media
        WHERE deleted_at IS NULL
        "#,
    );
    apply_media_filters(&mut list_builder, &params);
    list_builder
        .push(" ORDER BY created_at DESC LIMIT ")
        .push_bind(limit as i64)
        .push(" OFFSET ")
        .push_bind(offset as i64);

    let media_list: Vec<MediaListItem> = list_builder.build_query_as().fetch_all(&state.db).await?;

    let total_pages = if total == 0 {
        0
    } else {
        ((total as f64) / (limit as f64)).ceil() as u32
    };

    Ok(Json(MediaListResponse {
        media: media_list,
        total,
        page,
        limit,
        total_pages,
    })
    .into_response())
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
    let media_list: Vec<MediaListItem> = sqlx::query_as::<_, MediaListItem>(
        r#"
        SELECT
            id, filename, original_filename, mime_type,
            size_bytes, width, height,
            COALESCE(cdn_url, storage_path) AS url,
            media_type, usage_count, created_at
        FROM media
        WHERE usage_count = 0
            AND deleted_at IS NULL
            AND created_at < NOW() - INTERVAL '30 days'
        ORDER BY created_at ASC
        "#,
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(media_list).into_response())
}

fn apply_media_filters(builder: &mut QueryBuilder<Postgres>, params: &MediaListParams) {
    if let Some(media_type) = params.media_type.as_deref() {
        builder
            .push(" AND media_type = ")
            .push_bind(media_type.to_string());
    }

    if let Some(search) = params
        .search
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        let pattern = format!("%{}%", search);
        builder
            .push(" AND (original_filename ILIKE ")
            .push_bind(pattern.clone())
            .push(" OR filename ILIKE ")
            .push_bind(pattern)
            .push(")");
    }
}

async fn persist_media_record(
    state: &AppState,
    media: NewMediaRecord,
) -> Result<MediaListItem, AppError> {
    let already_registered: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM media WHERE storage_path = $1 AND deleted_at IS NULL)",
    )
    .bind(&media.object_key)
    .fetch_one(&state.db)
    .await?;

    if already_registered {
        return Err(AppError::Conflict(
            "Media object has already been registered".to_string(),
        ));
    }

    let id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO media (
            filename, original_filename, mime_type, size_bytes,
            width, height, storage_path, cdn_url, alt_text, caption,
            uploaded_by, media_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
        "#,
    )
    .bind(
        media
            .object_key
            .rsplit('/')
            .next()
            .unwrap_or(&media.object_key),
    )
    .bind(&media.original_filename)
    .bind(&media.mime_type)
    .bind(media.size_bytes)
    .bind(media.width)
    .bind(media.height)
    .bind(&media.object_key)
    .bind(Some(media.url))
    .bind(media.alt_text)
    .bind(media.caption)
    .bind(media.uploaded_by)
    .bind(&media.media_type)
    .fetch_one(&state.db)
    .await?;

    fetch_media_list_item(state, id).await
}

async fn fetch_media_list_item(state: &AppState, id: Uuid) -> Result<MediaListItem, AppError> {
    sqlx::query_as::<_, MediaListItem>(
        r#"
        SELECT
            id, filename, original_filename, mime_type,
            size_bytes, width, height,
            COALESCE(cdn_url, storage_path) AS url,
            media_type, usage_count, created_at
        FROM media
        WHERE id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(Into::into)
}

fn build_media_object_key(original_filename: &str, mime_type: &str) -> String {
    let file_extension = FsPath::new(original_filename)
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.to_lowercase())
        .filter(|extension| !extension.is_empty())
        .or_else(|| infer_extension_from_mime(mime_type).map(str::to_string));

    match file_extension {
        Some(extension) => format!("media/{}.{}", Uuid::new_v4(), extension),
        None => format!("media/{}", Uuid::new_v4()),
    }
}

fn validate_media_object_key(object_key: &str) -> Result<&str, AppError> {
    let normalized = object_key.trim_start_matches('/');
    if !normalized.starts_with("media/")
        || normalized.len() <= "media/".len()
        || normalized.contains("..")
    {
        return Err(AppError::BadRequest(
            "object_key must point to a media/* object".to_string(),
        ));
    }

    Ok(normalized)
}

fn normalize_presign_expiry(expires_secs: Option<u32>) -> u32 {
    expires_secs.unwrap_or(900).clamp(60, 3600)
}

fn resolve_mime_type(candidate: Option<&str>, filename: &str) -> String {
    candidate
        .map(normalize_mime_type)
        .filter(|mime_type| !mime_type.is_empty())
        .unwrap_or_else(|| {
            mime_guess::from_path(filename)
                .first_or_octet_stream()
                .essence_str()
                .to_string()
        })
}

fn normalize_mime_type(mime_type: &str) -> String {
    mime_type
        .split(';')
        .next()
        .unwrap_or(mime_type)
        .trim()
        .to_lowercase()
}

fn ensure_allowed_mime_type(mime_type: &str) -> Result<(), AppError> {
    if is_allowed_mime_type(mime_type) {
        Ok(())
    } else {
        Err(AppError::BadRequest(format!(
            "File type not allowed: {}",
            mime_type
        )))
    }
}

fn infer_extension_from_mime(mime_type: &str) -> Option<&'static str> {
    mime_guess::get_mime_extensions_str(mime_type)
        .and_then(|extensions| extensions.first().copied())
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
    Ok((None, None))
}

fn map_storage_error(error: StorageError) -> AppError {
    match error {
        StorageError::NotFound(path) => {
            AppError::NotFound(format!("Media object not found: {}", path))
        }
        StorageError::Config(message) => AppError::BadRequest(message),
        other => {
            tracing::error!("Storage operation failed: {}", other);
            AppError::InternalError
        }
    }
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

#[cfg(test)]
mod tests {
    use super::{
        build_media_object_key, normalize_mime_type, normalize_presign_expiry,
        validate_media_object_key,
    };

    #[test]
    fn presign_expiry_is_clamped() {
        assert_eq!(normalize_presign_expiry(Some(5)), 60);
        assert_eq!(normalize_presign_expiry(None), 900);
        assert_eq!(normalize_presign_expiry(Some(99999)), 3600);
    }

    #[test]
    fn media_keys_must_stay_under_media_prefix() {
        assert_eq!(
            validate_media_object_key("/media/example.png").unwrap(),
            "media/example.png"
        );
        assert!(validate_media_object_key("../etc/passwd").is_err());
    }

    #[test]
    fn mime_types_are_normalized_without_parameters() {
        assert_eq!(
            normalize_mime_type("text/plain; charset=utf-8"),
            "text/plain"
        );
    }

    #[test]
    fn generated_media_keys_keep_extension_when_available() {
        let key = build_media_object_key("hero.png", "image/png");
        assert!(key.starts_with("media/"));
        assert!(key.ends_with(".png"));
    }
}
