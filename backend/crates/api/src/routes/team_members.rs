use crate::state::AppState;
use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post, put},
    Json, Router,
};
use blog_db::cms::{IdResponse, MessageResponse};
use blog_db::models::{
    CreateTeamMemberRequest, TeamMember, TeamMemberDetail, TeamMemberListItem,
    UpdateTeamMemberRequest,
};
use blog_shared::middleware::AuthUser;
use blog_shared::AppError;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

// ============================================
// Public Routes
// ============================================

/// Team member list response for admin (with pagination)
#[derive(Debug, Serialize, ToSchema)]
pub struct TeamMemberListResponse {
    pub data: Vec<TeamMemberListItem>,
    pub total: i64,
    pub page: usize,
    pub page_size: usize,
}

/// Query params for admin list
#[derive(Debug, Deserialize)]
pub struct TeamMemberAdminListQuery {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub team_role: Option<String>,
    pub is_active: Option<bool>,
    pub search: Option<String>,
}

/// Public: List all active team members
#[utoipa::path(
    get,
    path = "/api/v1/team-members",
    tag = "team",
    responses(
        (status = 200, description = "List team members", body = Vec<TeamMemberListItem>)
    )
)]
pub async fn list_team_members(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let members = sqlx::query_as::<_, TeamMemberListItem>(
        r#"
        SELECT id, name, name_en, team_role, title, affiliation, avatar_media_id, display_order
        FROM team_members
        WHERE is_active = true
        ORDER BY display_order ASC, name ASC
        "#,
    )
    .fetch_all(&state.db_read)
    .await?;

    Ok(Json(members))
}

/// Public: Get single team member
#[utoipa::path(
    get,
    path = "/api/v1/team-members/{id}",
    tag = "team",
    params(
        ("id" = Uuid, Path, description = "Team member ID")
    ),
    responses(
        (status = 200, description = "Get team member", body = TeamMemberDetail),
        (status = 404, description = "Not found")
    )
)]
pub async fn get_team_member(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let member = sqlx::query_as::<_, TeamMember>(
        "SELECT * FROM team_members WHERE id = $1 AND is_active = true",
    )
    .bind(id)
    .fetch_optional(&state.db_read)
    .await?
    .ok_or_else(|| AppError::NotFound("Team member not found".to_string()))?;

    // Get avatar URL if avatar_media_id exists
    let avatar_url = if let Some(media_id) = member.avatar_media_id {
        sqlx::query_scalar::<_, String>("SELECT url FROM media WHERE id = $1")
            .bind(media_id)
            .fetch_optional(&state.db_read)
            .await?
    } else {
        None
    };

    let detail = TeamMemberDetail {
        avatar_url,
        ..TeamMemberDetail::from(member)
    };

    Ok(Json(detail))
}

// ============================================
// Admin Routes
// ============================================

/// Admin: List all team members (including inactive)
#[utoipa::path(
    get,
    path = "/api/v1/admin/team-members",
    tag = "admin/team",
    params(
        ("page" = Option<usize>, Query, description = "Page number"),
        ("page_size" = Option<usize>, Query, description = "Items per page"),
        ("team_role" = Option<String>, Query, description = "Filter by role"),
        ("is_active" = Option<bool>, Query, description = "Filter by active status"),
        ("search" = Option<String>, Query, description = "Search by name")
    ),
    responses(
        (status = 200, description = "List team members", body = TeamMemberListResponse)
    ),
    security(("BearerAuth" = []))
)]
pub async fn list_admin_team_members(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthUser>,
    Query(params): Query<TeamMemberAdminListQuery>,
) -> Result<impl IntoResponse, AppError> {
    let page = params.page.unwrap_or(1).max(1);
    let page_size = params.page_size.unwrap_or(20).min(100);
    let offset = (page - 1) * page_size;

    // Build query conditions
    let role_filter = params.team_role.as_deref();
    let active_filter = params.is_active;
    let search_filter = params.search.as_deref();

    let members = sqlx::query_as::<_, TeamMemberListItem>(
        r#"
        SELECT id, name, name_en, team_role, title, affiliation, avatar_media_id, display_order
        FROM team_members
        WHERE ($1::text IS NULL OR team_role = $1)
          AND ($2::bool IS NULL OR is_active = $2)
          AND ($3::text IS NULL OR name ILIKE '%' || $3 || '%' OR name_en ILIKE '%' || $3 || '%')
        ORDER BY display_order ASC, name ASC
        LIMIT $4 OFFSET $5
        "#,
    )
    .bind(role_filter)
    .bind(active_filter)
    .bind(search_filter)
    .bind(page_size as i64)
    .bind(offset as i64)
    .fetch_all(&state.db)
    .await?;

    let total: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*) FROM team_members
        WHERE ($1::text IS NULL OR team_role = $1)
          AND ($2::bool IS NULL OR is_active = $2)
          AND ($3::text IS NULL OR name ILIKE '%' || $3 || '%' OR name_en ILIKE '%' || $3 || '%')
        "#,
    )
    .bind(role_filter)
    .bind(active_filter)
    .bind(search_filter)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(TeamMemberListResponse {
        data: members,
        total: total.0,
        page,
        page_size,
    }))
}

/// Admin: Get single team member
#[utoipa::path(
    get,
    path = "/api/v1/admin/team-members/{id}",
    tag = "admin/team",
    params(
        ("id" = Uuid, Path, description = "Team member ID")
    ),
    responses(
        (status = 200, description = "Get team member", body = TeamMemberDetail),
        (status = 404, description = "Not found")
    ),
    security(("BearerAuth" = []))
)]
pub async fn get_admin_team_member(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let member = sqlx::query_as::<_, TeamMember>(
        "SELECT * FROM team_members WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Team member not found".to_string()))?;

    let avatar_url = if let Some(media_id) = member.avatar_media_id {
        sqlx::query_scalar::<_, String>("SELECT url FROM media WHERE id = $1")
            .bind(media_id)
            .fetch_optional(&state.db_read)
            .await?
    } else {
        None
    };

    let detail = TeamMemberDetail {
        avatar_url,
        ..TeamMemberDetail::from(member)
    };

    Ok(Json(detail))
}

/// Admin: Create team member
#[utoipa::path(
    post,
    path = "/api/v1/admin/team-members",
    tag = "admin/team",
    request_body = CreateTeamMemberRequest,
    responses(
        (status = 201, description = "Created", body = IdResponse),
        (status = 400, description = "Validation error")
    ),
    security(("BearerAuth" = []))
)]
pub async fn create_team_member(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthUser>,
    Json(req): Json<CreateTeamMemberRequest>,
) -> Result<impl IntoResponse, AppError> {
    let id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO team_members (user_id, name, name_en, team_role, display_order, title, bio, affiliation, research_tags, email, github, website, avatar_media_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
        "#,
    )
    .bind(&req.user_id)
    .bind(&req.name)
    .bind(&req.name_en)
    .bind(req.team_role.as_deref().unwrap_or("member"))
    .bind(req.display_order.unwrap_or(0))
    .bind(&req.title)
    .bind(&req.bio)
    .bind(&req.affiliation)
    .bind(&req.research_tags)
    .bind(&req.email)
    .bind(&req.github)
    .bind(&req.website)
    .bind(&req.avatar_media_id)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(IdResponse { id })))
}

/// Admin: Update team member
#[utoipa::path(
    put,
    path = "/api/v1/admin/team-members/{id}",
    tag = "admin/team",
    params(
        ("id" = Uuid, Path, description = "Team member ID")
    ),
    request_body = UpdateTeamMemberRequest,
    responses(
        (status = 200, description = "Updated", body = MessageResponse),
        (status = 404, description = "Not found")
    ),
    security(("BearerAuth" = []))
)]
pub async fn update_team_member(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateTeamMemberRequest>,
) -> Result<impl IntoResponse, AppError> {
    // Check exists
    let exists: bool = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM team_members WHERE id = $1)",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await?;

    if !exists {
        return Err(AppError::NotFound("Team member not found".to_string()));
    }

    // Build dynamic update query
    let mut updates = Vec::new();
    let mut param_idx: i32 = 2;

    macro_rules! add_field {
        ($field:ident, $value:expr) => {
            if $value.is_some() {
                updates.push(format!("{} = ${}", stringify!($field), param_idx));
                param_idx += 1;
            }
        };
    }

    add_field!(user_id, req.user_id);
    add_field!(name, req.name);
    add_field!(name_en, req.name_en);
    add_field!(team_role, req.team_role);
    add_field!(display_order, req.display_order);
    add_field!(is_active, req.is_active);
    add_field!(title, req.title);
    add_field!(bio, req.bio);
    add_field!(affiliation, req.affiliation);
    add_field!(email, req.email);
    add_field!(github, req.github);
    add_field!(website, req.website);
    add_field!(avatar_media_id, req.avatar_media_id);

    if !updates.is_empty() {
        updates.push("updated_at = NOW()".to_string());
        let query = format!(
            "UPDATE team_members SET {} WHERE id = $1",
            updates.join(", ")
        );

        // Execute with bindings
        let mut q = sqlx::query(&query).bind(id);

        if let Some(ref v) = req.user_id {
            q = q.bind(v);
        }
        if let Some(ref v) = req.name {
            q = q.bind(v);
        }
        if let Some(ref v) = req.name_en {
            q = q.bind(v);
        }
        if let Some(ref v) = req.team_role {
            q = q.bind(v);
        }
        if let Some(v) = req.display_order {
            q = q.bind(v);
        }
        if let Some(v) = req.is_active {
            q = q.bind(v);
        }
        if let Some(ref v) = req.title {
            q = q.bind(v);
        }
        if let Some(ref v) = req.bio {
            q = q.bind(v);
        }
        if let Some(ref v) = req.affiliation {
            q = q.bind(v);
        }
        if let Some(ref v) = req.research_tags {
            q = q.bind(v);
        }
        if let Some(ref v) = req.email {
            q = q.bind(v);
        }
        if let Some(ref v) = req.github {
            q = q.bind(v);
        }
        if let Some(ref v) = req.website {
            q = q.bind(v);
        }
        if let Some(ref v) = req.avatar_media_id {
            q = q.bind(v);
        }

        q.execute(&state.db).await?;
    }

    Ok(Json(MessageResponse {
        message: "Updated successfully".to_string(),
    }))
}

/// Admin: Delete team member (soft delete)
#[utoipa::path(
    delete,
    path = "/api/v1/admin/team-members/{id}",
    tag = "admin/team",
    params(
        ("id" = Uuid, Path, description = "Team member ID")
    ),
    responses(
        (status = 200, description = "Deleted", body = MessageResponse),
        (status = 404, description = "Not found")
    ),
    security(("BearerAuth" = []))
)]
pub async fn delete_team_member(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let affected = sqlx::query(
        "UPDATE team_members SET is_active = false, updated_at = NOW() WHERE id = $1 AND is_active = true",
    )
    .bind(id)
    .execute(&state.db)
    .await?
    .rows_affected();

    if affected == 0 {
        return Err(AppError::NotFound(
            "Team member not found or already inactive".to_string(),
        ));
    }

    Ok(Json(MessageResponse {
        message: "Deleted successfully".to_string(),
    }))
}

/// Batch delete request
#[derive(Debug, Deserialize, ToSchema)]
pub struct BatchDeleteTeamMembersRequest {
    pub member_ids: Vec<Uuid>,
}

/// Admin: Batch delete team members
#[utoipa::path(
    post,
    path = "/api/v1/admin/team-members/batch/delete",
    tag = "admin/team",
    request_body = BatchDeleteTeamMembersRequest,
    responses(
        (status = 200, description = "Batch deleted", body = MessageResponse)
    ),
    security(("BearerAuth" = []))
)]
pub async fn batch_delete_team_members(
    State(state): State<AppState>,
    Extension(_auth_user): Extension<AuthUser>,
    Json(req): Json<BatchDeleteTeamMembersRequest>,
) -> Result<impl IntoResponse, AppError> {
    if req.member_ids.is_empty() {
        return Ok(Json(MessageResponse {
            message: "No members to delete".to_string(),
        }));
    }

    sqlx::query(
        "UPDATE team_members SET is_active = false, updated_at = NOW() WHERE id = ANY($1) AND is_active = true",
    )
    .bind(&req.member_ids)
    .execute(&state.db)
    .await?;

    Ok(Json(MessageResponse {
        message: format!("Deleted {} members", req.member_ids.len()),
    }))
}

// ============================================
// Route Aggregation
// ============================================

/// Public team member routes
pub fn team_members_routes() -> Router<AppState> {
    Router::new()
        .route("/api/v1/team-members", get(list_team_members))
        .route("/api/v1/team-members/{id}", get(get_team_member))
}

/// Admin team member routes
pub fn admin_team_members_routes() -> Router<AppState> {
    Router::new()
        .route("/api/v1/admin/team-members", get(list_admin_team_members))
        .route("/api/v1/admin/team-members", post(create_team_member))
        .route(
            "/api/v1/admin/team-members/{id}",
            get(get_admin_team_member),
        )
        .route(
            "/api/v1/admin/team-members/{id}",
            put(update_team_member),
        )
        .route(
            "/api/v1/admin/team-members/{id}",
            delete(delete_team_member),
        )
        .route(
            "/api/v1/admin/team-members/batch/delete",
            post(batch_delete_team_members),
        )
}
