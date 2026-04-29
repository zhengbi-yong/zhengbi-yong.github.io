# Design Doc Audit Report

Generated: 2026-04-29

## Summary

Audited two design docs (database-schema.md, auth-design.md) against actual code (27 migration files, auth middleware, routes, core auth service, shared types, DB models). Found **10 inconsistencies** across both docs.

---

## Document 1: `docs/design/database-schema.md`

### Inconsistency 1: `comment_likes` table schema mismatch

- **Doc says** (line 284-289): `comment_likes` has `PRIMARY KEY (comment_id, user_id)` with no `id` column.
- **Code reality** (`migrations/0005_add_comment_likes.sql`, line 3-4): `comment_likes` has `id BIGSERIAL PRIMARY KEY` plus `UNIQUE(comment_id, user_id)` — the PK is a synthetic `id` column, not the composite key.
- **Which side is more reasonable**: The **doc** is more reasonable. Using `(comment_id, user_id)` as a composite PK is the correct pattern (same as `post_likes`), preventing duplicate likes at the constraint level without needing a separate unique constraint.
- **Fix**: Update migration `0005_add_comment_likes.sql` to use `PRIMARY KEY (comment_id, user_id)` instead of `id BIGSERIAL PRIMARY KEY` + `UNIQUE(comment_id, user_id)`.

### Inconsistency 2: `post_stats` table PK column name

- **Doc says** (line 178): `slug TEXT PRIMARY KEY REFERENCES posts(slug)`.
- **Code reality**: After `0002_fix_column_names.sql` renamed `post_slug` to `slug`, this is consistent. However, the doc's `idx_post_stats_updated/views/likes` indexes (described in section "索引设计原则" as "禁止额外索引") are noted as being dropped by `2026040902_hot_optimization.sql`. The doc already acknowledges this — **consistent on close reading**.

### Inconsistency 3: `categories.parent_id` ON DELETE behavior

- **Doc says** (line 219): `parent_id UUID REFERENCES categories(id)` — no ON DELETE clause specified.
- **Code reality** (`migrations/0004_create_cms_tables.sql`, line 19): `parent_id UUID REFERENCES categories(id) ON DELETE SET NULL`.
- **Which side is more reasonable**: The **code** is more reasonable. `ON DELETE SET NULL` prevents orphaned category subtrees when a parent category is deleted.
- **Fix**: Update doc line 219 to add `ON DELETE SET NULL`.

### Inconsistency 4: `categories` table has extra columns not in doc

- **Doc says** (lines 213-223): `categories` has columns: id, slug, name, description, parent_id, "order", created_at.
- **Code reality** (`migrations/0004_create_cms_tables.sql`, lines 14-26): `categories` has additional columns: `icon TEXT`, `color TEXT`, `display_order INTEGER NOT NULL DEFAULT 0`, `post_count INTEGER NOT NULL DEFAULT 0`, `updated_at TIMESTAMPTZ`.
- **Which side is more reasonable**: The **code** is more reasonable. The extra columns (icon, color, display_order, post_count, updated_at) are standard CMS features.
- **Fix**: Update doc to include all actual columns from migration `0004_create_cms_tables.sql`.

### Inconsistency 5: `tags` table missing columns

- **Doc says** (lines 227-233): `tags` has: id, slug, name, post_count, created_at.
- **Code reality** (`migrations/0004_create_cms_tables.sql`, lines 36-43): `tags` also has `description TEXT`.
- **Which side is more reasonable**: The **code** is more reasonable. A description field is standard for tags.
- **Fix**: Add `description TEXT` to the tags table definition in the doc.

### Inconsistency 6: `media` table completely different schema

- **Doc says** (lines 244-258): `media` has: id, filename, url, mime_type, size, width, height, alt_text, uploader_id, article_id, created_at, deleted_at.
- **Code reality** (`migrations/0004_create_cms_tables.sql`, lines 53-70): `media` has: id, filename, original_filename, mime_type, size_bytes, width, height, storage_path, cdn_url, alt_text, caption, uploaded_by, media_type, usage_count, created_at, updated_at, deleted_at.
- **Key differences**:
  - Doc has `url` and `article_id` — code has `storage_path`, `cdn_url`, and no `article_id`
  - Doc has `size` (no type specified) — code has `size_bytes BIGINT`
  - Doc has `uploader_id` — code has `uploaded_by`
  - Code has additional fields: `original_filename`, `caption`, `media_type`, `usage_count`, `updated_at`
- **Which side is more reasonable**: The **code** is more reasonable. The schema evolved to support CDN, usage tracking, and proper media categorization. Doc is outdated.
- **Fix**: Completely rewrite the `media` table definition in the doc to match migration `0004_create_cms_tables.sql`.

### Inconsistency 7: `post_versions` table extra columns

- **Doc says** (lines 262-273): `post_versions` has: id, post_id, version_number, title, content, created_at, created_by, comment, UNIQUE(post_id, version_number).
- **Code reality** (`migrations/0004_create_cms_tables.sql`, lines 138-149): `post_versions` has extra fields: `summary TEXT`, `change_log TEXT` (instead of `comment`), and the created_by is `ON DELETE SET NULL`.
- **Which side is more reasonable**: The **code** is more reasonable. `summary` and `change_log` provide better version tracking.
- **Fix**: Update doc to replace `comment` with `change_log`, add `summary TEXT`, and add `ON DELETE SET NULL` on `created_by` reference.

### Inconsistency 8: `reading_progress` table different column names and types

- **Doc says** (lines 323-331): `reading_progress` has `progress INTEGER`, `last_read_at TIMESTAMPTZ`, `completed_at TIMESTAMPTZ`, `PRIMARY KEY (user_id, post_id)`.
- **Code reality** (`migrations/20251229_add_reading_progress.sql`, lines 4-20): `reading_progress` has `id UUID PRIMARY KEY DEFAULT uuid_generate_v7()`, `post_slug TEXT` (not `post_id UUID`), plus many extra columns: `last_read_position INTEGER`, `scroll_percentage FLOAT`, `word_count INTEGER`, `words_read INTEGER`, `is_completed BOOLEAN`, `updated_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ`. Uses `UNIQUE(user_id, post_slug)` instead of `PRIMARY KEY (user_id, post_id)`.
- **Which side is more reasonable**: The **code** is more reasonable. The richer schema (scroll position, word tracking, completion flag) provides better reading progress UX. However, the doc's use of `post_id UUID REFERENCES posts(id)` is cleaner than the code's `post_slug TEXT REFERENCES posts(slug)`.
- **Fix**: Update doc to match the actual richer schema, but consider if `post_id` should be used instead of `post_slug` in a future migration.

### Inconsistency 9: Missing `users.status` column

- **Doc says** (lines 44-60): `users` table has no `status` column.
- **Code reality** (`migrations/2026033102_user_status.sql`, lines 2-6): `users` has `status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned'))` plus `idx_users_status` index.
- **Which side is more reasonable**: The **code** is more reasonable. Account status (active/suspended/banned) is essential for user management.
- **Fix**: Add `status` column to the `users` table definition in the doc.

### Inconsistency 10: Doc mentions `order` column for categories, code uses `display_order`

- **Doc says** (line 220): `\"order\" INTEGER NOT NULL DEFAULT 0`.
- **Code reality** (`migrations/0004_create_cms_tables.sql`, line 22): `display_order INTEGER NOT NULL DEFAULT 0`.
- **Note**: `order` is a reserved word in SQL, requiring quoting. `display_order` avoids this issue.
- **Which side is more reasonable**: The **code** is more reasonable. Using `display_order` avoids the reserved word issue.
- **Fix**: Update doc line 220 to use `display_order INTEGER NOT NULL DEFAULT 0`.

### Inconsistency 11: Missing tables in doc

- **Doc missing**: Several tables exist in migrations but are not documented in `database-schema.md`:
  - `password_reset_tokens` table (migration `2026041301_add_password_reset_tokens.sql`)
  - `team_members` table (migration `2026040601_create_team_members.sql`)
  - `post_media` junction table (migration `2026033101_post_media.sql`)
  - `search_keywords` and `search_history` tables (migration `20251230_add_fulltext_search.sql`)
  - `articles`, `article_versions`, `media_assets` tables (migration `2026042701_create_articles.sql`)
  - `views` table (mentioned in doc line 293 but it references `post_id UUID NOT NULL REFERENCES posts(id)` without `ON DELETE CASCADE`, and there is no actual migration for this table)
- **Which side is more reasonable**: The **code** (migrations are the source of truth). The doc should list all actual tables.
- **Fix**: Add all missing tables to the doc that have corresponding migrations. The `views` table referenced in the doc has no migration — either create a migration for it or remove from doc.

### Inconsistency 12: `views` table referenced in doc has no migration

- **Doc says** (lines 293-302): `views` table with `post_id UUID NOT NULL REFERENCES posts(id)` (no `ON DELETE CASCADE`).
- **Code reality**: No migration creates a `views` table exists in the migrations directory.
- **Which side is more reasonable**: The **doc** describes a needed table. The code is missing it.
- **Fix**: Either create a migration for the `views` table, or remove it from the doc. The `post_id` reference should also use `ON DELETE CASCADE`.

---

## Document 2: `docs/design/auth-design.md`

### Inconsistency 1: Auth middleware token extraction order (doc says "Cookie first", code says "Header first")

- **Doc says** (line 9): "同时兼容 Authorization: Bearer Header（调试与第三方集成）" — implies Cookie is primary.
- **Doc middleare section** (lines 44-45): "1. 从 Authorization: Bearer Token（优先）2. 若没有则从 access_token Cookie 提取" — this correctly states header first.
- **Code reality** (`middleware/auth.rs`, lines 16-47): `extract_token()` first tries Authorization header, then Cookie. The doc's middleware section is accurate, but the doc's introductory sentence implies Cookie-primary which is misleading.
- **Which side is more reasonable**: The **code** (header-first) is more reasonable for REST API standards, and the doc's middleware section already correctly describes this. The introductory statement (line 8-9) is slightly misleading.
- **Fix**: Reword line 8-9 to clarify that `Authorization: Bearer` header is the primary extraction path, with HttpOnly Cookie as secondary.

### Inconsistency 2: Access token returned in JSON body vs. auth-design doc

- **Doc says** (lines 28-33, login flow step 4): "返回 JSON (含 access_token) + 设置两个 HttpOnly Cookie".
- **Code reality** (`routes/auth.rs`, login handler, lines 346-353): Returns JSON containing both `access_token` AND `user` object, plus sets `refresh_token` and `access_token` cookies AND a CSRF token cookie.
- The code additionally returns user info and a CSRF token in the login response.
- **Which side is more reasonable**: The **code** is more reasonable. Returning user info with login is standard practice to avoid an extra `/me` call, and CSRF token generation at login is a security best practice.
- **Fix**: Update doc login flow step 4 to also mention user info and CSRF token in response.

### Inconsistency 3: Refresh token storage in code vs. doc

- **Doc says** (lines 20-22): refresh_token is returned "可选 Body 返回" (optional body return).
- **Code reality** (`routes/auth.rs`, register handler line 135-141, login handler line 291-296): refresh_token is always set as an HttpOnly cookie, but is NOT returned in the JSON response body.
- **Which side is more reasonable**: The **code** is more reasonable. Not exposing the refresh_token in the response body is more secure.
- **Fix**: Update doc line 22 to remove "可选 Body 返回", since refresh_token is only set as a cookie.

### Inconsistency 4: Middleware "no I/O" claim vs. actual `load_user_from_db` usage

- **Doc says** (lines 66-76): Middleware does NO I/O, and blacklist checking happens only in handler layer.
- **Code reality**: The auth middleware (`middleware/auth.rs`) indeed does no I/O — this is consistent. However, `load_user_from_db()` (line 98-127) is a function in the middleware module that DOES I/O. It's called by handlers, not the middleware itself, so technically consistent with the doc's claim.
- **Status**: **Consistent** — but note the presence of `load_user_from_db()` in the middleware module file is architecturally confusing even though it's called by handlers.

### Inconsistency 5: JWT signing algorithm not mentioned in doc

- **Doc says** (line 67): "JWT 签名验证（HMAC-SHA256，CPU 运算）".
- **Code reality** (`core/src/auth.rs`, JwtService): Uses HS256 (HMAC-SHA256) via `jsonwebtoken` crate — this is consistent. However, there's no explicit mention of the algorithm in the code (it uses `Header::default()` which defaults to HS256).
- **Status**: **Consistent** (by convention/default).

### Inconsistency 6: Token blacklist check location

- **Doc says** (line 81): "检查在 auth handler 层（is_token_blacklisted()），不在中间件层".
- **Code reality** (`middleware/auth.rs`, lines 133-148): `is_token_blacklisted()` exists in the middleware module file but there is no call to it from actual route handlers in `routes/auth.rs`. The only blacklist-related operations in `auth.rs` are in the `logout` handler which calls `blacklist_token()` and updates `refresh_tokens.revoked_at`.
- **Which side is more reasonable**: The **doc** describes the intended architecture. The code should implement blacklist checking in auth handlers.
- **Fix**: Either add `is_token_blacklisted()` calls to the relevant handlers (e.g., in `me`, or admin route handlers), or if intentionally deferred, update the doc to reflect current state.

### Inconsistency 7: `refresh_tokens` table in code has `created_ip` as `INET`, doc omits this

- **Doc in database-schema.md** (lines 306-318): `refresh_tokens` uses `created_ip INET`, `user_agent_hash TEXT`.
- **Code**: Migration `0001_initial.sql` lines 36-37: `created_ip INET`, `user_agent_hash TEXT`.
- **Status**: **Consistent**.

### Inconsistency 8: Refresh token uses JWT in code, doc treats it as opaque

- **Doc says** (line 17-18): refresh_token is "长期（7 天），带上 family_id 支持令牌旋转".
- **Code reality** (`core/src/auth.rs`): Refresh tokens are JWT tokens with `token_type: TokenType::Refresh { token_id, family_id }`.
- **Status**: Technically consistent, but worth noting for clarity.

### Inconsistency 9: `refresh` endpoint uses cookie-based extraction only, but doc mentions optional body

- **Doc says** (line 22): refresh_token can come from body.
- **Code reality** (`routes/auth.rs`, lines 367-374, `refresh` handler): Only extracts refresh_token from `CookieJar` — no body extraction.
- **Which side is more reasonable**: The **code** is more reasonable for security. Only reading refresh_token from cookies prevents accidental exposure.
- **Fix**: Update doc to remove "可选 Body 返回" for refresh_token and clarify it's cookie-only.

---

## Summary of Required Fixes

### Fixes to `database-schema.md`:
1. Fix `comment_likes` table to use composite PK
2. Add `ON DELETE SET NULL` to `categories.parent_id`
3. Add all missing columns to `categories` table (icon, color, display_order, post_count, updated_at)
4. Add `description` to `tags` table
5. Rewrite `media` table schema to match actual migration
6. Fix `post_versions` columns (change_log, summary, ON DELETE SET NULL)
7. Rewrite `reading_progress` table to match actual migration
8. Add `status` column to `users` table
9. Change `"order"` to `display_order` in categories
10. Add missing tables: password_reset_tokens, team_members, post_media, search_keywords, search_history
11. Either create migration or remove `views` table from doc
12. Add/remove `articles`, `article_versions`, `media_assets` (they were created in a migration but the doc uses `posts`/`post_versions`/`media` — decide which is canonical)

### Fixes to `auth-design.md`:
1. Reword line 8-9 to clarify Auth header is primary, Cookie is secondary
2. Update login flow to include user info and CSRF token in response
3. Remove "可选 Body 返回" for refresh_token (cookie-only)
4. Either add blacklist checking to handlers or update doc to reflect actual implementation

### Fixes to code:
1. Migration `0005_add_comment_likes.sql`: Change to `PRIMARY KEY (comment_id, user_id)` instead of synthetic `id` column
2. (Optional) Create migration for `views` table if needed
