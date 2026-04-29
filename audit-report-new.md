# Audit Batch 1: Design Docs vs Code — Findings Report

## 1. database-schema.md vs Actual Migrations

### Finding 1.1: Rust `PostLike` model field name doesn't match DB column (post_slug vs slug)
- **File**: `backend/crates/db/src/models.rs` line 78
- **What doc says**: `slug TEXT NOT NULL REFERENCES posts(slug)` (database-schema.md line 313)
- **What code does**: Migration `0003_fix_post_likes_column.sql` renamed column `post_slug` → `slug`. But `PostLike` struct at `models.rs:78` still has `pub post_slug: String` — this works because SQLX's `query_as!` map-columns-by-name would fail; however the code uses raw `sqlx::query_as::<PostLike>` which implicitly maps by index, but the struct field name `post_slug` is misleading and breaks named column mapping.
- **Which side is reasonable**: Code — the Rust model field name should match the actual DB column name
- **Fix**: Rename field:
  - Old: `pub post_slug: String,`
  - New: `pub slug: String,`

### Finding 1.2: Rust `Comment` model field name doesn't match DB column (post_slug vs slug)
- **File**: `backend/crates/db/src/models.rs` line 98
- **What doc says**: `slug TEXT NOT NULL` (database-schema.md line 152)
- **What code does**: Migration `0002_fix_column_names.sql` dropped `post_slug` and added `slug` column. But `Comment` struct still has `pub post_slug: String`. Code in `comments.rs` extracts `slug` value but stores into a field named `post_slug`.
- **Which side is reasonable**: Code
- **Fix**: Rename field:
  - Old: `pub post_slug: String,`
  - New: `pub slug: String,`

### Finding 1.3: Missing search indexes in database-schema.md
- **File**: `docs/design/database-schema.md`
- **What doc says**: No mention of `search_vector` tsvector column, `idx_posts_search_vector` GIN index, `idx_posts_title_trgm` or `idx_posts_content_trgm` trigram indexes
- **What code does**: Migration `20251230_add_fulltext_search.sql` adds:
  - `search_vector tsvector GENERATED ALWAYS AS (...) STORED`
  - `CREATE INDEX idx_posts_search_vector ON posts USING GIN (search_vector)`
  - `CREATE EXTENSION pg_trgm`, `idx_posts_title_trgm`, `idx_posts_content_trgm`
- **Which side is reasonable**: Code — the doc is missing these entire features
- **Fix**: Add to `docs/design/database-schema.md` posts table: add `search_vector tsvector` column definition and the three indexes

### Finding 1.4: Missing trigram indexes and generated column mentions for posts
- **File**: `docs/design/database-schema.md`
- **What doc says**: Only lists `idx_posts_status`, `idx_posts_published`, `idx_posts_content_json`, `idx_posts_title_exact`
- **What code does**: Also has `idx_posts_search_vector`, `idx_posts_title_trgm`, `idx_posts_content_trgm`
- **Which side is reasonable**: Code
- **Fix**: Add missing indexes to doc's posts table section

### Finding 1.5: `users` table `primary key DEFAULT` changed from `gen_random_uuid()` to `uuid_generate_v7()` but doc already reflects final state
- **File**: `docs/design/database-schema.md` line 45: `DEFAULT uuid_generate_v7()`
- **What code does**: `2026040901_uuidv7_migration.sql` updates default. Doc accurately reflects final state.
- **Verdict**: Consistent — no fix needed.

### Finding 1.6: `CommentWithUser` model uses `slug` field at line 119 — consistent with DB
- OK, consistent.

## 2. auth-design.md vs Actual Auth Middleware and Routes

### Finding 2.1: CSRF implementation differs from doc specification
- **File**: `docs/design/auth-design.md` lines 135-137
- **What doc says**: "HMAC-CSRF Token = base64(nonce(16B) || timestamp(8B) || HMAC-SHA256(nonce || timestamp))" — Nonce-based HMAC tokens with replay protection via Redis `csrf:nonce:{nonce_base64}` entries
- **What code does**: `backend/crates/api/src/middleware/csrf.rs` — Uses simple UUID-based tokens, no HMAC signing, no nonce replay protection in Redis. The `revoke_csrf_token()` function described in the doc does not exist.
- **Which side is reasonable**: Doc describes planned/enhanced implementation. Code has simplified version.
- **Fix**: Either update the doc to describe the actual UUID-based implementation, or add HMAC-CSRF to the code. Recommend: update doc.

### Finding 2.2: Rate limit defaults differ between auth-design.md and backend-api-design.md
- **File**: `docs/design/auth-design.md` line 112
- **What doc (auth) says**: `POST /auth/login, /auth/register → 5 次/分钟 + 1 次/秒`
- **What doc (backend-api) says**: `RATE_LIMIT_AUTH_RPM` default is 20 (backend-api-design.md line 191)
- **Which side is reasonable**: backend-api-design.md value of 20 is more realistic
- **Fix**: Update auth-design.md to match: change "5 次/分钟" to "20 次/分钟" (or whichever value the actual code defaults to in `rate_limit.rs`). Also check the actual code defaults.

### Finding 2.3: Doc says "JWT uses HMAC-SHA256" but mentions in context of middleware
- Doc line 85: "JWT 签名验证（HMAC-SHA256，CPU 运算）". Code likely uses HS256 (HMAC-SHA256) — consistent.

### Finding 2.4: CSRF middleware description says "HMAC-SHA256 双提交 Cookie 模式" but code uses UUID
- As noted in 2.1. The XSRF-TOKEN cookie approach differs from what the doc describes.

## 3. backend-api-design.md vs Actual Routes

### Finding 3.1: Route table says `/posts/{slug}/likes` uses POST+DELETE — code matches
- Doc line 74-75. Code at `main.rs` lines 434-438: `post(like)` + `delete(unlike)`. Consistent.

### Finding 3.2: Route table says `GET /categories/tree` — code has it
- Doc line 126. Code at `main.rs` line 469. Consistent.

### Finding 3.3: Route table says `GET /search/trending` — code has it
- Doc line 136. Code at `main.rs` line 533. Consistent.

### Finding 3.4: Doc lists `POST /admin/comments/{id}/status` as `PUT` not `POST`
- Doc line 162: `PUT /admin/comments/{id}/status | 审核评论`
- **What code does**: `main.rs` line 570: `put(blog_api::routes::admin::update_comment_status)` — consistent (PUT, not POST). Good.

### Finding 3.5: Doc says `/health` handler exists but not registered — code confirms
- Doc lines 326-327. Code at `main.rs`: no `/health` route registered. Consistent.

### Finding 3.6: Doc mentions Swagger UI is disabled — code confirms
- Doc lines 335-339. Code at `main.rs` lines 218-219. Consistent.

### Finding 3.7: Admin team member routes described in doc — code matches
- Doc line 141 mentions team members. Code at `main.rs` lines 366-376 registers `admin_team_members_routes()`. Consistent.

### Finding 3.8: Route table lists `POST /api/v1/reading-progress/history` but doc says `GET`
- Doc line 113: `GET /reading-progress/history | 阅读历史`
- Code at `main.rs` line 597: `get(blog_api::routes::reading_progress::get_reading_history_handler)` — consistent (GET, not POST). This is fine.

---

## Summary of Actionable Inconsistencies

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | **High** | `backend/crates/db/src/models.rs:78` | `PostLike.post_slug` should be `slug` to match DB column | Rename field |
| 2 | **High** | `backend/crates/db/src/models.rs:98` | `Comment.post_slug` should be `slug` to match DB column | Rename field |
| 3 | **Medium** | `docs/design/database-schema.md` | Missing `search_vector` column, `idx_posts_search_vector`, `idx_posts_title_trgm`, `idx_posts_content_trgm` indexes | Add missing schema |
| 4 | **Medium** | `docs/design/auth-design.md` | CSRF described as HMAC-based but code uses UUID-based CSRF | Update doc or add HMAC |
| 5 | **Low** | `docs/design/auth-design.md` vs `docs/design/backend-api-design.md` | Rate limit default for auth endpoints differs (5/min vs 20/min) | Align docs |

All other endpoint paths, status codes, middleware application, and request/response shapes are consistent between design docs and actual code.
