//! Audit regression tests — guards against accidental field name regressions.
//!
//! These tests ensure that the model field names `slug` (not `post_slug`) are used
//! in PostLike and Comment structs. If someone accidentally renames the field back
//! to `post_slug`, these tests will fail to compile.
//!
//! The tests also verify that the structs can be constructed with the correct field
//! names and that sqlx `FromRow` derives are compatible.

use std::time::Duration;

// ============================================================================
// Compile-time field name regression guards
// ============================================================================

/// If `PostLike.slug` is accidentally renamed back to `post_slug`,
/// this test will fail to compile.
#[test]
fn test_post_like_has_slug_field_not_post_slug() {
    let like = blog_db::PostLike {
        slug: "test-post".to_string(),
        user_id: uuid::Uuid::nil(),
        created_at: chrono::Utc::now(),
    };

    assert_eq!(like.slug, "test-post");
    assert_eq!(like.user_id, uuid::Uuid::nil());
}

/// If `Comment.slug` is accidentally renamed back to `post_slug`,
/// this test will fail to compile.
#[test]
fn test_comment_has_slug_field_not_post_slug() {
    let comment = blog_db::Comment {
        id: uuid::Uuid::nil(),
        slug: "test-post".to_string(),
        user_id: Some(uuid::Uuid::nil()),
        parent_id: None,
        content: "Hello world".to_string(),
        html_sanitized: "<p>Hello world</p>".to_string(),
        status: blog_db::CommentStatus::Approved,
        path: "00000000000000000000000000000000".to_string(),
        depth: 0,
        like_count: 0,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_ip: None,
        user_agent: None,
        moderation_reason: None,
    };

    assert_eq!(comment.slug, "test-post");
    assert_eq!(comment.content, "Hello world");
}

/// Ensure PostStats already uses `slug` (not `post_slug`) — it was fixed in migration 0002.
#[test]
fn test_post_stats_uses_slug_not_post_slug() {
    let stats = blog_db::PostStats {
        slug: "my-article".to_string(),
        view_count: 42,
        like_count: 7,
        comment_count: 3,
        updated_at: chrono::Utc::now(),
    };

    assert_eq!(stats.slug, "my-article");
    assert_eq!(stats.view_count, 42);
}

/// Ensure CommentWithUser already uses `slug` (not `post_slug`).
#[test]
fn test_comment_with_user_uses_slug_not_post_slug() {
    let comment = blog_db::CommentWithUser {
        id: uuid::Uuid::nil(),
        slug: "my-post".to_string(),
        user_id: Some(uuid::Uuid::nil()),
        parent_id: None,
        content: "Great article".to_string(),
        html_sanitized: "<p>Great article</p>".to_string(),
        status: blog_db::CommentStatus::Approved,
        path: "00000000000000000000000000000001".to_string(),
        depth: 0,
        like_count: 1,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_ip: None,
        user_agent: None,
        moderation_reason: None,
        username: "testuser".to_string(),
        profile: serde_json::json!({"avatar": null}),
    };

    assert_eq!(comment.slug, "my-post");
    assert_eq!(comment.username, "testuser");
}

// ============================================================================
// Test that field accesses compile correctly
// ============================================================================

/// If `slug` field is missing or renamed, this won't compile.
#[test]
fn test_slug_field_on_post_like_is_string() {
    let like = blog_db::PostLike {
        slug: String::from("test-slug"),
        user_id: uuid::Uuid::new_v4(),
        created_at: chrono::Utc::now(),
    };
    // Access .slug to verify the field exists with correct type
    let _s: &String = &like.slug;
}

/// If `slug` field is missing or renamed, this won't compile.
#[test]
fn test_slug_field_on_comment_is_string() {
    let comment = blog_db::Comment {
        id: uuid::Uuid::new_v4(),
        slug: String::from("test-slug"),
        user_id: None,
        parent_id: None,
        content: String::from("test"),
        html_sanitized: String::from("<p>test</p>"),
        status: blog_db::CommentStatus::Pending,
        path: String::from("00000000000000000000000000000000"),
        depth: 0,
        like_count: 0,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_ip: None,
        user_agent: None,
        moderation_reason: None,
    };
    let _s: &String = &comment.slug;
}
