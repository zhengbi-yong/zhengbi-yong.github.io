use crate::state::AppState;
use axum::{
    extract::{Extension, Json, Path, Query, State},
    response::IntoResponse,
};
use blog_db::{
    UpdateAcademicProfileRequest, User, UserInfo, UserPublicProfile,
};
use blog_db::cms::PostListItem;
use blog_shared::{AppError, AuthUser};
use serde::Deserialize;
use sqlx::Row;
use utoipa::ToSchema;

/// 获取当前用户信息
#[utoipa::path(
    get,
    path = "/users/me",
    tag = "users",
    responses(
        (status = 200, description = "当前用户信息", body = UserInfo),
        (status = 401, description = "未认证")
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_me(
    Extension(auth_user): Extension<AuthUser>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let row = sqlx::query(
        r#"SELECT u.id, u.email, u.username, u.profile,
           u.email_verified, u.role,
           u.display_name, u.institution, u.research_fields,
           u.orcid_id, u.avatar_url, u.website, u.academic_bio
           FROM users u WHERE u.id = $1 AND u.deleted_at IS NULL"#,
    )
    .bind(auth_user.id)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AppError::Unauthorized)?
    .ok_or(AppError::Unauthorized)?;

    let role_raw: String = row.try_get("role").unwrap_or_else(|_| "user".into());

    Ok(Json(UserInfo {
        id: row.try_get("id").unwrap(),
        email: row.try_get("email").unwrap_or_default(),
        username: row.try_get("username").unwrap_or_default(),
        profile: row.try_get("profile").unwrap_or(serde_json::Value::Null),
        email_verified: row.try_get("email_verified").unwrap_or(false),
        role: role_raw,
        display_name: row.try_get("display_name").ok(),
        institution: row.try_get("institution").ok(),
        research_fields: row.try_get("research_fields").ok(),
        orcid_id: row.try_get("orcid_id").ok(),
        avatar_url: row.try_get("avatar_url").ok(),
        website: row.try_get("website").ok(),
        academic_bio: row.try_get("academic_bio").ok(),
    }))
}

/// 获取公开用户资料（学术名片）
#[utoipa::path(
    get,
    path = "/users/{username}",
    tag = "users",
    params(("username" = String, Path, description = "用户名")),
    responses(
        (status = 200, description = "用户公开资料", body = UserPublicProfile),
        (status = 404, description = "用户不存在")
    )
)]
pub async fn get_public_profile(
    Path(username): Path<String>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let row = sqlx::query(
        r#"SELECT
            u.username, u.display_name, u.avatar_url,
            u.profile->>'bio' as bio,
            u.institution, u.research_fields, u.orcid_id,
            u.google_scholar, u.academic_bio,
            u.profile->>'location' as location,
            u.website,
            u.profile->>'twitter' as twitter,
            u.profile->>'github' as github,
            u.role as role_text,
            u.created_at,
            u.status,
            COALESCE(pc.total_posts, 0)::bigint as total_posts,
            COALESCE(lc.total_likes, 0)::bigint as total_likes,
            COALESCE(fc.follower_count, 0)::bigint as follower_count,
            COALESCE(fg.following_count, 0)::bigint as following_count
        FROM users u
        LEFT JOIN LATERAL (
            SELECT COUNT(*) as total_posts FROM posts p
            WHERE p.author_id = u.id AND p.deleted_at IS NULL
              AND p.status = 'published'
        ) pc ON true
        LEFT JOIN LATERAL (
            SELECT COALESCE(SUM(p.like_count), 0) as total_likes FROM posts p
            WHERE p.author_id = u.id AND p.deleted_at IS NULL
        ) lc ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(*) as follower_count FROM follows f
            WHERE f.followed_id = u.id
        ) fc ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(*) as following_count FROM follows f
            WHERE f.follower_id = u.id
        ) fg ON true
        WHERE u.username = $1 AND u.deleted_at IS NULL"#,
    )
    .bind(&username)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| AppError::InternalError)?;

    let row = row.ok_or(AppError::NotFound("not found".into()))?;

    let role_raw: String = row.try_get("role_text").unwrap_or_else(|_| "user".into());

    Ok(Json(UserPublicProfile {
        username: row.try_get("username").unwrap_or_default(),
        display_name: row.try_get("display_name").ok(),
        avatar_url: row.try_get("avatar_url").ok(),
        bio: row.try_get("bio").ok(),
        institution: row.try_get("institution").ok(),
        research_fields: row.try_get("research_fields").ok(),
        orcid_id: row.try_get("orcid_id").ok(),
        google_scholar: row.try_get("google_scholar").ok(),
        location: row.try_get("location").ok(),
        website: row.try_get("website").ok(),
        twitter: row.try_get("twitter").ok(),
        github: row.try_get("github").ok(),
        academic_bio: row.try_get("academic_bio").ok(),
        role: role_raw,
        total_posts: row.try_get("total_posts").unwrap_or(0),
        total_likes: row.try_get("total_likes").unwrap_or(0),
        follower_count: row.try_get("follower_count").unwrap_or(0),
        following_count: row.try_get("following_count").unwrap_or(0),
        created_at: row.try_get("created_at").unwrap_or_default(),
    }))
}

/// 获取用户公开文章列表
#[derive(Debug, Deserialize, utoipa::IntoParams, ToSchema)]
pub struct UserPostsParams {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    #[param(inline = false, style = Form, allow_reserved)]
    pub search: Option<String>,
}

#[derive(Debug, serde::Serialize, ToSchema)]
pub struct UserPostsResponse {
    pub posts: Vec<PostListItem>,
    pub total: i64,
    pub page: u32,
    pub per_page: u32,
}

#[utoipa::path(
    get,
    path = "/users/{username}/posts",
    tag = "users",
    params(
        ("username" = String, Path, description = "用户名"),
        UserPostsParams
    ),
    responses(
        (status = 200, description = "用户文章列表"),
        (status = 404, description = "用户不存在")
    )
)]
pub async fn get_user_posts(
    Path(username): Path<String>,
    Query(params): Query<UserPostsParams>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(10).min(50);
    let offset = ((page - 1) * per_page) as i64;
    let search_term = params
        .search
        .as_deref()
        .filter(|s| !s.trim().is_empty())
        .map(|s| format!("%{}%", s))
        .unwrap_or_else(|| "%".to_string());

    let user_exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM users WHERE username = $1 AND deleted_at IS NULL)",
    )
    .bind(&username)
    .fetch_one(&state.db)
    .await
    .unwrap_or(false);

    if !user_exists {
        return Err(AppError::NotFound("not found".into()));
    }

    let total = sqlx::query_scalar::<_, i64>(
        r#"SELECT COUNT(*) FROM posts p
           JOIN users u ON p.author_id = u.id
           WHERE u.username = $1 AND p.deleted_at IS NULL
             AND p.status = 'published'
             AND (p.title ILIKE $2 OR p.summary ILIKE $2)"#,
    )
    .bind(&username)
    .bind(&search_term)
    .fetch_one(&state.db)
    .await
    .unwrap_or(0);

    let rows = sqlx::query_as!(
        PostListItem,
        r#"SELECT p.id, p.slug, p.title, p.summary,
           NULL::TEXT as cover_image_url,
           p.status as "status: blog_db::cms::PostStatus",
           p.published_at, COALESCE(c.name, '') as category_name,
           COALESCE(c.slug, '') as category_slug,
           u.username as author_name,
           p.view_count, p.like_count as "like_count!", p.comment_count as "comment_count!",
           p.created_at, p.reading_time,
           COALESCE((SELECT COUNT(*) FROM post_tags pt WHERE pt.post_id = p.id), 0) as "tag_count!",
           p.content_type
        FROM posts p
        JOIN users u ON p.author_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE u.username = $1 AND p.deleted_at IS NULL AND p.status = 'published'
          AND (p.title ILIKE $4 OR p.summary ILIKE $4)
        ORDER BY p.published_at DESC NULLS LAST
        LIMIT $2 OFFSET $3"#,
        username,
        per_page as i64,
        offset,
        search_term,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Failed to fetch user posts: {e}");
        AppError::InternalError
    })?;

    Ok(Json(UserPostsResponse {
        posts: rows,
        total,
        page,
        per_page,
    }))
}

/// 更新当前用户的学术资料
#[utoipa::path(
    patch,
    path = "/users/me/academic",
    tag = "users",
    request_body = UpdateAcademicProfileRequest,
    responses(
        (status = 200, description = "更新成功", body = UserInfo),
        (status = 401, description = "未认证")
    ),
    security(("bearer_auth" = []))
)]
pub async fn update_academic_profile(
    State(state): State<AppState>,
    Extension(auth_user): Extension<AuthUser>,
    Json(payload): Json<UpdateAcademicProfileRequest>,
) -> Result<impl IntoResponse, AppError> {
    sqlx::query(
        r#"UPDATE users SET
            display_name = COALESCE($2, display_name),
            institution = COALESCE($3, institution),
            research_fields = COALESCE($4, research_fields),
            orcid_id = COALESCE($5, orcid_id),
            google_scholar = COALESCE($6, google_scholar),
            academic_bio = COALESCE($7, academic_bio),
            website = COALESCE($8, website),
            profile = jsonb_set(
                jsonb_set(
                    jsonb_set(
                        COALESCE(profile, '{}'::jsonb),
                        '{location}', COALESCE(to_jsonb($9::text), profile->'location', 'null'::jsonb)
                    ),
                    '{twitter}', COALESCE(to_jsonb($10::text), profile->'twitter', 'null'::jsonb)
                ),
                '{github}', COALESCE(to_jsonb($11::text), profile->'github', 'null'::jsonb)
            ),
            updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL"#,
    )
    .bind(auth_user.id)
    .bind(&payload.display_name)
    .bind(&payload.institution)
    .bind(&payload.research_fields)
    .bind(&payload.orcid_id)
    .bind(&payload.google_scholar)
    .bind(&payload.academic_bio)
    .bind(&payload.website)
    .bind(&payload.location)
    .bind(&payload.twitter)
    .bind(&payload.github)
    .execute(&state.db)
    .await
    .map_err(|e| {
        tracing::error!("Failed to update academic profile: {e}");
        AppError::InternalError
    })?;

    let row = sqlx::query(
        r#"SELECT u.id, u.email, u.username, u.profile,
           u.email_verified, u.role,
           u.display_name, u.institution, u.research_fields,
           u.orcid_id, u.avatar_url, u.website, u.academic_bio
           FROM users u WHERE u.id = $1 AND u.deleted_at IS NULL"#,
    )
    .bind(auth_user.id)
    .fetch_one(&state.db)
    .await
    .map_err(|_| AppError::InternalError)?;

    let role_raw: String = row.try_get("role").unwrap_or_else(|_| "user".into());

    Ok(Json(UserInfo {
        id: row.try_get("id").unwrap(),
        email: row.try_get("email").unwrap_or_default(),
        username: row.try_get("username").unwrap_or_default(),
        profile: row.try_get("profile").unwrap_or(serde_json::Value::Null),
        email_verified: row.try_get("email_verified").unwrap_or(false),
        role: role_raw,
        display_name: row.try_get("display_name").ok(),
        institution: row.try_get("institution").ok(),
        research_fields: row.try_get("research_fields").ok(),
        orcid_id: row.try_get("orcid_id").ok(),
        avatar_url: row.try_get("avatar_url").ok(),
        website: row.try_get("website").ok(),
        academic_bio: row.try_get("academic_bio").ok(),
    }))
}
