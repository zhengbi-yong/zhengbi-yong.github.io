use axum::{
    extract::{Path, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Json},
};
use blog_db::cms::*;
use blog_shared::AppError;
use crate::state::AppState;
use utoipa;
use uuid::Uuid;

/// 创建分类
#[utoipa::path(
    post,
    path = "/admin/categories",
    tag = "admin/categories",
    request_body = CreateCategoryRequest,
    responses(
        (status = 201, description = "创建成功", body = IdResponse),
        (status = 400, description = "请求参数错误"),
        (status = 401, description = "未认证"),
        (status = 409, description = "slug已存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn create_category(
    State(state): State<AppState>,
    Json(req): Json<CreateCategoryRequest>,
) -> Result<impl IntoResponse, AppError> {
    // 检查 slug 是否已存在
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM categories WHERE slug = $1)"
    )
    .bind(&req.slug)
    .fetch_one(&state.db)
    .await?;

    if exists {
        return Err(AppError::Conflict("Slug already exists".to_string()));
    }

    // 检查父分类是否存在（如果提供）
    if let Some(parent_id) = req.parent_id {
        let parent_exists: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM categories WHERE id = $1)"
        )
        .bind(parent_id)
        .fetch_one(&state.db)
        .await?;

        if !parent_exists {
            return Err(AppError::NotFound("Parent category not found".to_string()));
        }
    }

    let id = sqlx::query_scalar!(
        r#"
        INSERT INTO categories (
            slug, name, description, parent_id,
            icon, color, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        "#,
        req.slug,
        req.name,
        req.description,
        req.parent_id,
        req.icon,
        req.color,
        req.display_order.unwrap_or(0)
    )
    .fetch_one(&state.db)
    .await?;

    // 清除缓存
    clear_categories_cache(&state).await;

    Ok((
        StatusCode::CREATED,
        Json(IdResponse { id }),
    ))
}

/// 获取分类详情
#[utoipa::path(
    get,
    path = "/categories/{slug}",
    tag = "categories",
    params(
        ("slug" = String, Path, description = "分类slug")
    ),
    responses(
        (status = 200, description = "获取成功", body = Category),
        (status = 404, description = "分类不存在")
    )
)]
pub async fn get_category(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let category = sqlx::query_as!(
        Category,
        r#"
        SELECT
            id, slug, name, description, parent_id,
            icon, color, display_order, post_count,
            created_at, updated_at
        FROM categories
        WHERE slug = $1
        "#,
        slug
    )
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Category not found".to_string()))?;

    Ok((
        [(header::CACHE_CONTROL, "public, s-maxage=300, stale-while-revalidate=600")],
        Json(category),
    ).into_response())
}

/// 更新分类
#[utoipa::path(
    patch,
    path = "/admin/categories/{slug}",
    tag = "admin/categories",
    params(
        ("slug" = String, Path, description = "分类slug")
    ),
    request_body = UpdateCategoryRequest,
    responses(
        (status = 200, description = "更新成功", body = MessageResponse),
        (status = 400, description = "请求参数错误"),
        (status = 401, description = "未认证"),
        (status = 404, description = "分类不存在")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn update_category(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    Json(req): Json<UpdateCategoryRequest>,
) -> Result<impl IntoResponse, AppError> {
    let mut tx = state.db.begin().await?;

    // 检查分类是否存在
    let category_id: Uuid = sqlx::query_scalar(
        "SELECT id FROM categories WHERE slug = $1"
    )
    .bind(&slug)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::NotFound("Category not found".to_string()))?;

    // 检查父分类是否存在（如果提供）
    if let Some(parent_id) = req.parent_id {
        // 不能将自己设置为父分类
        if parent_id == category_id {
            return Err(AppError::BadRequest("Cannot set self as parent".to_string()));
        }

        let parent_exists: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM categories WHERE id = $1)"
        )
        .bind(parent_id)
        .fetch_one(&mut *tx)
        .await?;

        if !parent_exists {
            return Err(AppError::NotFound("Parent category not found".to_string()));
        }
    }

    // 构建更新查询
    let mut update_fields = Vec::new();
    let mut param_index = 2;

    if req.name.is_some() {
        update_fields.push(format!("name = ${}", param_index));
        param_index += 1;
    }
    if req.description.is_some() {
        update_fields.push(format!("description = ${}", param_index));
        param_index += 1;
    }
    if req.parent_id.is_some() {
        update_fields.push(format!("parent_id = ${}", param_index));
        param_index += 1;
    }
    if req.icon.is_some() {
        update_fields.push(format!("icon = ${}", param_index));
        param_index += 1;
    }
    if req.color.is_some() {
        update_fields.push(format!("color = ${}", param_index));
        param_index += 1;
    }
    if req.display_order.is_some() {
        update_fields.push(format!("display_order = ${}", param_index));
        param_index += 1;
    }

    if update_fields.is_empty() {
        tx.rollback().await?;
        return Ok(Json(MessageResponse {
            message: "No fields to update".to_string(),
        }).into_response());
    }

    let query = format!(
        "UPDATE categories SET {} WHERE slug = $1",
        update_fields.join(", ")
    );

    let mut query_builder = sqlx::query(&query).bind(&slug);

    if let Some(name) = req.name {
        query_builder = query_builder.bind(name);
    }
    if let Some(description) = req.description {
        query_builder = query_builder.bind(description);
    }
    if let Some(parent_id) = req.parent_id {
        query_builder = query_builder.bind(parent_id);
    }
    if let Some(icon) = req.icon {
        query_builder = query_builder.bind(icon);
    }
    if let Some(color) = req.color {
        query_builder = query_builder.bind(color);
    }
    if let Some(display_order) = req.display_order {
        query_builder = query_builder.bind(display_order);
    }

    query_builder.execute(&mut *tx).await?;
    tx.commit().await?;

    // 清除缓存
    clear_categories_cache(&state).await;

    Ok(Json(MessageResponse {
        message: "Category updated successfully".to_string(),
    }).into_response())
}

/// 删除分类
#[utoipa::path(
    delete,
    path = "/admin/categories/{slug}",
    tag = "admin/categories",
    params(
        ("slug" = String, Path, description = "分类slug")
    ),
    responses(
        (status = 200, description = "删除成功", body = MessageResponse),
        (status = 401, description = "未认证"),
        (status = 404, description = "分类不存在"),
        (status = 409, description = "分类下有子分类或文章")
    ),
    security(
        ("BearerAuth" = [])
    )
)]
pub async fn delete_category(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let mut tx = state.db.begin().await?;

    // 检查分类是否存在
    let category_id: Uuid = sqlx::query_scalar(
        "SELECT id FROM categories WHERE slug = $1"
    )
    .bind(&slug)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::NotFound("Category not found".to_string()))?;

    // 检查是否有子分类
    let has_children: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM categories WHERE parent_id = $1)"
    )
    .bind(category_id)
    .fetch_one(&mut *tx)
    .await?;

    if has_children {
        tx.rollback().await?;
        return Err(AppError::Conflict("Cannot delete category with subcategories".to_string()));
    }

    // 检查是否有关联的文章
    let has_posts: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM posts WHERE category_id = $1 AND deleted_at IS NULL)"
    )
    .bind(category_id)
    .fetch_one(&mut *tx)
    .await?;

    if has_posts {
        tx.rollback().await?;
        return Err(AppError::Conflict("Cannot delete category with posts".to_string()));
    }

    // 删除分类
    sqlx::query!(
        "DELETE FROM categories WHERE id = $1",
        category_id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    // 清除缓存
    clear_categories_cache(&state).await;

    Ok(Json(MessageResponse {
        message: "Category deleted successfully".to_string(),
    }))
}

/// 获取分类列表
#[utoipa::path(
    get,
    path = "/categories",
    tag = "categories",
    responses(
        (status = 200, description = "获取成功", body = Vec<Category>)
    )
)]
pub async fn list_categories(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let categories: Vec<Category> = sqlx::query_as!(
        Category,
        r#"
        SELECT
            id, slug, name, description, parent_id,
            icon, color, display_order, post_count,
            created_at, updated_at
        FROM categories
        ORDER BY display_order ASC, name ASC
        "#
    )
    .fetch_all(&state.db)
    .await?;

    Ok((
        [(header::CACHE_CONTROL, "public, s-maxage=300, stale-while-revalidate=600")],
        Json(categories),
    ).into_response())
}

/// 获取分类树
#[utoipa::path(
    get,
    path = "/categories/tree",
    tag = "categories",
    responses(
        (status = 200, description = "获取成功", body = Vec<CategoryTreeNode>)
    )
)]
pub async fn get_category_tree(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    // 尝试从缓存获取
    let cache_key = "categories:tree";

    let mut conn = state.redis.get().await
        .map_err(|_| AppError::InternalError)?;

    if let Ok(cached) = redis::cmd("GET")
        .arg(cache_key)
        .query_async::<Option<String>>(&mut conn)
        .await
    {
        if let Some(cached_str) = cached {
            if let Ok(tree) = serde_json::from_str::<Vec<CategoryTreeNode>>(&cached_str) {
                return Ok((
                    [(header::CACHE_CONTROL, "public, s-maxage=300, stale-while-revalidate=600")],
                    Json(tree),
                ).into_response());
            }
        }
    }

    // 从数据库获取所有分类
    let categories: Vec<Category> = sqlx::query_as!(
        Category,
        r#"
        SELECT
            id, slug, name, description, parent_id,
            icon, color, display_order, post_count,
            created_at, updated_at
        FROM categories
        ORDER BY display_order ASC, name ASC
        "#
    )
    .fetch_all(&state.db)
    .await?;

    // 构建树形结构
    let tree = build_category_tree(&categories);

    // 缓存
    if let Ok(json) = serde_json::to_string(&tree) {
        let _: () = redis::cmd("SETEX")
            .arg(cache_key)
            .arg(300) // 5 分钟
            .arg(&json)
            .query_async(&mut conn)
            .await?;
    }

    Ok((
        [(header::CACHE_CONTROL, "public, s-maxage=300, stale-while-revalidate=600")],
        Json(tree),
    ).into_response())
}

/// 获取分类的文章列表
#[utoipa::path(
    get,
    path = "/categories/{slug}/posts",
    tag = "categories",
    params(
        ("slug" = String, Path, description = "分类slug"),
        ("page" = Option<u32>, Query, description = "页码（从1开始）"),
        ("limit" = Option<u32>, Query, description = "每页数量（默认20）")
    ),
    responses(
        (status = 200, description = "获取成功", body = PostListResponse),
        (status = 404, description = "分类不存在")
    )
)]
pub async fn get_category_posts(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    Query(params): Query<PostListParams>,
) -> Result<impl IntoResponse, AppError> {
    // 检查分类是否存在
    let category_id: Uuid = sqlx::query_scalar(
        "SELECT id FROM categories WHERE slug = $1"
    )
    .bind(&slug)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Category not found".to_string()))?;

    let page = params.page.unwrap_or(1).max(1);
    let limit = params.limit.unwrap_or(20).min(100);
    let offset = (page - 1) * limit;

    // 查询总数
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM posts WHERE category_id = $1 AND deleted_at IS NULL"
    )
    .bind(category_id)
    .fetch_one(&state.db)
    .await?;

    // 查询文章列表
    let posts: Vec<PostListItem> = sqlx::query_as!(
        PostListItem,
        r#"
        SELECT
            p.id, p.slug, p.title, p.summary,
            m.cdn_url as "cover_image_url?",
            p.status as "status!: blog_db::cms::PostStatus",
            p.published_at,
            c.name as "category_name?", c.slug as "category_slug?",
            u.username as "author_name?",
            p.view_count, p.like_count, p.comment_count,
            p.created_at, p.reading_time as "reading_time?: i32",
            COUNT(DISTINCT pt.tag_id) as "tag_count!"
        FROM posts p
        LEFT JOIN media m ON p.cover_image_id = m.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN post_tags pt ON p.id = pt.post_id
        WHERE p.category_id = $1 AND p.deleted_at IS NULL
        GROUP BY p.id, m.cdn_url, c.name, c.slug, u.username
        ORDER BY p.published_at DESC
        LIMIT $2 OFFSET $3
        "#,
        category_id,
        limit as i64,
        offset as i64
    )
    .fetch_all(&state.db)
    .await?;

    let total_pages = ((total as f64) / (limit as f64)).ceil() as u32;

    Ok((
        [(header::CACHE_CONTROL, "public, s-maxage=60, stale-while-revalidate=300")],
        Json(PostListResponse {
            posts,
            total,
            page,
            limit,
            total_pages,
        }),
    ).into_response())
}

// ===== 辅助函数 =====

fn build_category_tree(categories: &[Category]) -> Vec<CategoryTreeNode> {
    let mut category_map = std::collections::HashMap::new();

    // 首先创建所有节点
    for category in categories {
        category_map.insert(category.id, CategoryTreeNode {
            id: category.id,
            slug: category.slug.clone(),
            name: category.name.clone(),
            description: category.description.clone(),
            icon: category.icon.clone(),
            color: category.color.clone(),
            display_order: category.display_order,
            post_count: category.post_count,
            children: Vec::new(),
        });
    }

    // 构建父子关系映射
    let mut child_to_parent: std::collections::HashMap<Uuid, Option<Uuid>> = std::collections::HashMap::new();
    for category in categories {
        child_to_parent.insert(category.id, category.parent_id);
    }

    // 构建树形结构
    let mut roots = Vec::new();

    for category in categories {
        if let Some(node) = category_map.remove(&category.id) {
            if let Some(parent_id) = category.parent_id {
                // 找到父节点并添加当前节点
                if let Some(parent) = category_map.get_mut(&parent_id) {
                    parent.children.push(node);
                }
            } else {
                // 顶级节点
                roots.push(node);
            }
        }
    }

    roots.sort_by(|a, b| {
        a.display_order
            .cmp(&b.display_order)
            .then_with(|| a.name.cmp(&b.name))
    });

    roots
}

async fn clear_categories_cache(state: &AppState) {
    if let Ok(mut conn) = state.redis.get().await {
        let _: () = redis::cmd("DEL")
            .arg("categories:tree")
            .arg("categories:list")
            .query_async(&mut conn)
            .await
            .unwrap_or(());
    }
}
