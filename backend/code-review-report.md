# Rust Backend Code Quality Review Report

**Date**: 2026-04-27
**Scope**: `crates/api`, `crates/core`, `crates/db`, `crates/shared`, `crates/worker`
**Reviewer**: Automated Code Review Agent

---

## Summary of Findings

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| unwrap() abuse | 2 | 5 | 8 | 30+ |
| Error handling | 0 | 3 | 4 | 10 |
| unsafe code | 0 | 0 | 0 | 0 |
| Security vulnerabilities | 2 | 3 | 1 | 2 |
| Config file leaks | 1 | 0 | 0 | 0 |
| SQL injection | 1 | 2 | 0 | 0 |
| Path traversal | 0 | 1 | 1 | 0 |

---

## 1. unwrap() and expect() Abuse

### 🔴 CRITICAL: Production code unwrap() that can panic

**1.1 `auth.rs` lines 157, 161, 174, 336, 340, 351** — Cookie string parsing
```rust
refresh_cookie.to_string().parse().unwrap(),   // line 157
access_cookie.to_string().parse().unwrap(),    // line 161
xsrf_cookie.parse().unwrap(),                  // line 174
```
- **Risk**: `Cookie::to_string()` may produce output that fails to parse back into a `HeaderValue`. If the cookie contains characters invalid in HTTP headers, this will panic and crash the server.
- **Fix**: Use `.expect("Cookie header should be valid")` with descriptive message, or better, handle the error gracefully via `.map_err(|_| AppError::InternalError)?`.

**1.2 `rate_limit.rs` line 237** — expect in middleware hot path
```rust
.expect("retry-after header should be valid"),
```
- While an `.expect()` with a message, it's in a middleware path that handles every request. If the retry-after calculation ever produces an invalid value, it takes down the entire server.
- **Fix**: Convert to proper error handling — rate limit misconfiguration should log a warning and continue, not panic.

**1.3 `media.rs` line 807** — Redis DEL in cache clear
```rust
let _: () = redis::cmd("DEL")
    .arg("media:list")
    .query_async(&mut conn)
    .await
    .unwrap_or(());
```
- `unwrap_or(())` here suppresses the error but returns the wrong type. If the query fails, `unwrap_or(())` returns `()` which is the same type as `Result<(), Error>?` — but this pattern is misleading. It's actually correct here but confusing. Also, this function is called after every media write operation — if the error is silently suppressed, stale cache persists.

### 🟡 HIGH: Production `.expect()` with descriptive messages (panics on init failure)

**1.4 `prometheus.rs` lines 49-207** — Metric registration panics
```rust
.expect("Failed to create http_requests_total counter");
.expect("Failed to register http_requests_total");
```
- ~30+ `.expect()` calls for metric creation and registration. During initialization this is acceptable **but only at startup**. However, the issue is that failure to register a metric causes a panic instead of returning an error. If Prometheus metrics system configuration has a problem, the server will crash during startup.
- **Fix**: Consider collecting all initialization errors and returning a combined error rather than panicking on the first failure.

### 🟢 LOW: Test code unwrap()

- `core/src/auth.rs`: ~50+ unwrap() calls in test code — acceptable in tests but indicates heavy reliance on testing happy paths.
- `api/tests/*`: ~100+ unwrap() calls across integration, security, fuzzing, stress tests.
- `api/src/routes/media.rs` line 828: `validate_media_object_key("/media/example.png").unwrap()` — test code, acceptable.

---

## 2. Error Handling Completeness

### 🟡 HIGH: Incomplete error handling patterns

**2.1 `search_optimized.rs` line 129** — Silently swallowed error
```rust
summary: row.try_get("summary")
    .inspect_err(|e| tracing::warn!("search: failed to get summary: {}", e))
    .ok(),
```
- This silently converts a missing "summary" column to `None` with only a log warning. If the database schema changes and the column is truly missing, searches will silently return empty summaries instead of failing with a clear error.

**2.2 `search_optimized.rs` line 135** — Unwrap on optional field
```rust
tags: row.try_get::<Vec<String>, _>("tags").unwrap_or_default(),
```
- If `tags` column type changes in the database, this silently returns an empty vec — data loss with no alert.

**2.3 `media.rs` lines 801-808** — Silent Redis failure in cache clear
```rust
async fn clear_media_cache(state: &AppState) {
    if let Ok(mut conn) = state.redis.get().await {
        let _: () = redis::cmd("DEL")
            .arg("media:list")
            .query_async(&mut conn)
            .await
            .unwrap_or(());
    }
}
```
- If Redis is unavailable, cache entries are never invalidated. Media changes won't be reflected for cached clients.

### 🟢 LOW: Pattern match on `Ok(())` in `search_optimized.rs`
```rust
let _: () = redis::cmd("SETEX")...query_async(&mut conn).await?;
```
- Using `?` to propagate Redis connection errors in non-critical cache operations could fail the entire response if Redis is down.

---

## 3. unsafe Code

### 🟢 No `unsafe` code in production source files

- The only `unsafe` reference was found in `CLAUDE.md` documentation (not actual code), describing an older pattern:
  ```
  unsafe { APP_START_TIME = Some(Utc::now()); }
  ```
- **No actual `unsafe` blocks exist in any `*.rs` file** in the `crates/` directory.
- ✅ Good: The project avoids unsafe code entirely in production.

---

## 4. Security Vulnerabilities

### 🔴 CRITICAL: SQL Injection via format!() string interpolation

**4.1 `search.rs` lines 89-163** — Full SQL injection vulnerability

The `search_posts` function in `search.rs` builds SQL queries using format strings with manual escaping that is **insufficient**:

```rust
let escaped_query = params.q.replace('\'', "''").replace('\\', "\\\\");
// ...
format!(
    "p.search_vector @@ plainto_tsquery('simple', '{}')",
    escaped_query  // INJECTION: simple quote escape is not enough!
);
```

**Why this is vulnerable:**
1. **Unicode bypass**: PostgreSQL accepts `U+2019` (RIGHT SINGLE QUOTATION MARK `'`) and other Unicode lookalikes as legitimate quote delimiters in certain configurations/encodings.
2. **Backslash handling**: The manual escaping only handles `'` and `\`, but PostgreSQL has more complex escaping rules depending on `standard_conforming_strings` setting.
3. **Wrong approach entirely**: Using `format!()` with user input in SQL is inherently dangerous. Even with escaping, it's fragile.

Similarly at line 103:
```rust
format!("c.slug = '{}'", category_slug.replace('\'', "''"))
```

Line 107:
```rust
format!("t.slug = '{}'", tag_slug.replace('\'', "''"))
```

Line 111:
```rust
format!("p.author_id = '{}'", author_id)
```

**The entire fallback PostgreSQL search path is vulnerable to SQL injection.**

**Fix**: Use parameterized queries (`$1`, `$2`, etc.) for ALL user input. The `search_optimized.rs` is already partially better by using bind parameters for the search function.

### 🔴 CRITICAL: `search_optimized.rs` line 147 — SQL injection in category filter

```rust
let total: i64 = if let Some(category) = &escaped_category {
    sqlx::query_scalar(&format!("{} AND p.category = '{}'", count_query, category))
        .bind(&escaped_query)
        .fetch_one(&state.db)
        .await?
```

Even though `escaped_category` has basic quote escaping, this is still unsafe:
- `count_query` itself uses `$1` which is safe
- But the category is interpolated via `format!()` with only quote escaping
- Same risks as 4.1 apply

### 🟡 HIGH: `media.rs` path traversal — Partial protection

**4.3 `validate_media_object_key` (line 700-712)**:
```rust
fn validate_media_object_key(object_key: &str) -> Result<&str, AppError> {
    let normalized = object_key.trim_start_matches('/');
    if !normalized.starts_with("media/")
        || normalized.len() <= "media/".len()
        || normalized.contains("..")
    {
        return Err(AppError::BadRequest(...));
    }
    Ok(normalized)
}
```
- **Deficiency**: Only checks for `..` but does NOT check for:
  - Absolute paths on Unix (`/etc/passwd`) — partially mitigated by `.trim_start_matches('/')` but what about `/media/../../etc/passwd`?
  - Null bytes or other special characters
  - Symlink attacks if the storage base path contains user-controlled directories
- `contains("..")` blocks `../` but what about encoded variants or Unicode homoglyphs?

**4.4 Storage `normalize_key` (line 369-371)** — Strips leading `/` only
```rust
fn normalize_key(key: &str) -> &str {
    key.trim_start_matches('/')
}
```
- Only trims leading slashes. Doesn't prevent `../../etc/passwd` if the path traversal check is bypassed.

---

## 5. Configuration File Leak

### 🔴 CRITICAL: `.env` file committed to git

**5.1 File**: `backend/.env` is tracked by git (`git ls-files` confirms)
```bash
$ git ls-files backend/.env
backend/.env
```

**Despite `.gitignore` having `backend/.env`**, the file was likely committed **before** the gitignore entry was added (or was force-added). This means the `.env` file is permanently in the git history — anyone with access to the repository can see:

- ~~Sensitive secrets (some redacted with `***` but not all)~~
- Exposed secrets still visible:
  - `CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000,http://192.168.0.161:3001` (internal IP exposed)
  - `MINIO_ACCESS_KEY=minioadmin`
  - `MEILISEARCH_MASTER_KEY=dev-meilisearch-master-key-change-me` (placeholder but also in `.env.example`)
  - `JWT_SECRET`, `PASSWORD_PEPPER`, `SESSION_SECRET`, `SMTP_PASSWORD` were redacted with `***` (but this likely happened AFTER the fix — if originally committed with real values, they're in git history)

**Severity**: If JWT_SECRET or SESSION_SECRET were ever committed with real values, all tokens issued before rotation are compromised.

**Fix**: 
1. `git rm --cached backend/.env`
2. Rotate all secrets
3. Use `git filter-repo` or `BFG Repo-Cleaner` to purge `.env` from history
4. Add `backend/.env` to `.gitignore` (already there but needs history purge)

---

## 6. SQL Injection Risk — Comprehensive Assessment

| File | Line(s) | Pattern | Risk |
|------|---------|---------|------|
| `search.rs` | 97-99 | `format!("...'{}'", escaped_query)` | 🔴 Critical |
| `search.rs` | 103 | `format!("c.slug = '{}'", ...)` | 🔴 Critical |
| `search.rs` | 107 | `format!("t.slug = '{}'", ...)` | 🔴 Critical |
| `search.rs` | 111 | `format!("p.author_id = '{}'", ...)` | 🔴 Critical |
| `search_optimized.rs` | 147-148 | `format!("... AND p.category = '{}'", category)` | 🔴 Critical |
| `search_optimized.rs` | 326 | `keyword.replace('\'', "''")` then `bind()` | 🟡 High (partial) |
| `posts.rs` | 1395-1424 | Uses `format!()` for `$N` placeholders but binds via vector | 🟢 Low (proper binding) |
| `admin.rs` | 200-289 | Uses `format!()` for `$N` placeholders but binds via vector | 🟢 Low (proper binding) |
| `media.rs` | 401-422 | `format!("UPDATE media SET {}...")` with col names from conditional logic | 🟢 Low (no user input in column names) |

**The `search.rs` function is the most dangerous** — it bypasses SQLx's parameterized query system entirely for the WHERE clause.

---

## 7. Path Traversal Risk

### Storage Layer Assessment

| Function | File | Risk | Notes |
|----------|------|------|-------|
| `normalize_key()` | `storage.rs:369` | 🟡 Medium | Only trims leading `/`, no path traversal prevention |
| `validate_media_object_key()` | `media.rs:700` | 🟢 Low | Checks `media/` prefix and blocks `..` |
| `build_media_object_key()` | `media.rs:686` | 🟢 Low | Uses UUID-based naming, no user-controlled path segments |
| `LocalStorage::full_path()` | `storage.rs:114` | 🟡 Medium | Joins `normalize_key(key)` with base_path — relies entirely on key being safe |
| `LocalStorage::delete()` | `storage.rs:136` | 🟡 Medium | Same path construction, but object_key is validated upstream |

**Risk**: If any code path calls `storage.delete()` or `store()` with an unvalidated key (bypassing `validate_media_object_key`), arbitrary file system access is possible.

---

## 8. Specific Recommendations

### Immediate (Critical — Fix ASAP)

1. **`search.rs`** — Rewrite fallback PostgreSQL search to use **parameterized queries** exclusively. Replace `format!()` with `$1`, `$2` bind parameters. This is a **SQL injection vulnerability**.
2. **`search_optimized.rs:147`** — Use parameterized query for category filter instead of `format!()` + manual escaping.
3. **`auth.rs` cookie parsing** — Replace `.unwrap()` with proper error handling on cookie-to-header conversion.
4. **`.env` in git** — Remove from git history and rotate all secrets.

### Short-term (High Priority)

5. **`posts.rs:list_posts`** — The parameterized query pattern here (building `WHERE` clause with `$N` bind parameters) is actually safe, but **consider using `sqlx::QueryBuilder`** for cleaner and less error-prone dynamic query construction.
6. **`media.rs:validate_media_object_key()`** — Add checks for absolute paths (`/` prefix after trim), null bytes, and encoded traversal sequences.
7. **`rate_limit.rs`** — Convert `.expect("retry-after header should be valid")` to proper error handling that doesn't panic.
8. **`search_optimized.rs:record_search_keyword`** — Remove the redundant escaped_keyword, use keyword directly with bind parameter (the ON CONFLICT upsert pattern is fine).

### Medium-term

9. **Add `deny.toml` checks** for `unwrap()` in non-test code (cargo-deny or custom Clippy lint).
10. **Add `#![forbid(unsafe_code)]`** to all crate lib.rs files (currently no unsafe code, make it a compiler error to add any).
11. **Add Clippy lint** `clippy::unwrap_used` and `clippy::expect_used` in CI for production crates.
12. **Review storage key validation** — ensure all code paths that call `storage::store/delete/head` are gated by proper key validation.

---

## Files Created
- `backend/code-review-report.md` — This report

## Issues Encountered
- Large number of test `.unwrap()` calls identified but excluded from critical count (tests are expected to use `.unwrap()`)
- Many `CLAUDE.md` files contain code snippets with `.unwrap()` but these are documentation, not production code
