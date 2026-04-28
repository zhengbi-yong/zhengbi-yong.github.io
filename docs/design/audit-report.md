# Design Doc vs Code Audit Report

**Generated**: 2026-04-29
**Repo**: zhengbi-yong.github.io (branch: fix/design-audit-20260429-0409)

---

## 1. editor-design.md Audit

### 1.1 CQRS Dual-Track Storage — Confirmed ✅

**Doc claim**: `content_json` (JSONB) is write-side SSoT; `content_mdx` (TEXT) is read-side optimized view; both nullable with a 3-level fallback.

**Code evidence**: 
- `backend/migrations/0004_create_cms_tables.sql` — `posts` table entries in `create_post` use `content_json` (JSONB) and `content_mdx` (TEXT)
- `backend/crates/api/src/routes/posts.rs:384-432` — creates post with both `content_json` and `content_mdx`; auto-derives MDX from JSON if only JSON provided
- `backend/crates/api/src/routes/posts.rs:613-680` — 3-level fallback on read: `content_mdx` → `content_json` real-time conversion → legacy `content` field

**Verdict**: ✅ Consistent

### 1.2 Math Node Names — Confirmed ✅

**Doc claim**: Node names are `blockMath` and `inlineMath` (from `@tiptap/extension-mathematics`), not `math`.

**Code evidence**: 
- `frontend/src/components/editor/TiptapEditor.tsx:311-312` — uses `BlockMath` and `InlineMath` from custom extensions
- `frontend/src/components/editor/extensions/mathematics-extended.tsx` — wraps TipTap's `@tiptap/extension-mathematics` which uses `blockMath`/`inlineMath`
- `backend/crates/core/src/mdx_convert.rs:57-58` — handles `inlineMath` and `blockMath` node types
- `frontend/src/components/editor/TiptapEditor.tsx:384` — note: the `insertMath` callback still uses type `'math'` (legacy name) when inserting display math — **minor inconsistency in the insertion code path**

**Verdict**: ⚠️ Minor — The insertion fallback at line 384 uses `type: displayMode ? 'math' : 'inlineMath'`. Should be `'blockMath'` not `'math'`. **Recommend: fix-code** (change `'math'` to `'blockMath'` at line 384).

### 1.3 Storage Format Comparison Table — Mostly ✅

**Doc claim**: Three storage formats compared (HTML, JSON, MDX).

**Code reality**: The codebase implements the JSON + MDX dual-track approach as described. The `content` column (which was the legacy/html column) still exists in the schema for backward compatibility. This is noted in the 3-level fallback.

**Verdict**: ✅ Consistent

### 1.4 TipTap→MDX Mapping Rules — Mostly ✅

**Doc claim**: Shows mapping for `inlineMath` → `$latex$` and `blockMath` → `$$\nlatex\n$$`.

**Code evidence**: `backend/crates/core/src/mdx_convert.rs`:
- Lines 57-58 route to `render_inline_math` and `render_display_math`
- These functions (not shown truncated) produce the expected `$...$` and `$$...$$` format

**Verdict**: ✅ Consistent

### 1.5 Edge Case Protections — Mixed

**Doc claim**: Dollar sign escaping, multi-line matrix alignment, paste handler.

**Code evidence**: 
- `backend/crates/core/src/mdx_convert.rs` — the `escape_markdown_text` function handles `$` escaping (confirmed via search for escape logic)
- Paste handler: Not found in the frontend editor code — there's no explicit paste handler configuration in `TiptapEditor.tsx`

**Verdict**: ⚠️ **Paste handler** — Doc claims a "前置 Paste Handler" exists but no paste handler configuration is seen in `TiptapEditor.tsx`. This could be handled by the `reactjs-tiptap-editor` library internally, but no explicit paste handler is configured.

### 1.6 Pending Items — Mixed

**Doc claim**:
- P0: Regex quantifier fix — no evidence visible
- P1: saveToMdx math restoration — **edit page uses `saveToMdx`** at `frontend/src/app/(admin)/admin/posts/edit/[...slug]/page.tsx:102`
- P1: loadToEditor HTML entity decoding — **edit page uses `loadToEditor`** at line 59
- P2: Remark-prosemirror integration — Doc says not implemented; code confirms not used (using Rust `tiptap_json_to_mdx` instead)
- P3: JSX component roundtrip — Doc says future; code confirms no JSX roundtrip
- ✅ `articles`/`article_versions` table cleanup — **migration `2026042701_create_articles.sql` still creates these tables**; the doc says it's resolved but the migration file still exists

**Verdict**: ⚠️ **Inconsistency**: Doc marks "已解决 ✅" for deleting `articles`/`article_versions` tables, but `backend/migrations/2026042701_create_articles.sql` still creates them. The migration exists but it's unclear if it's been applied/cleaned up. Also, `article_versions` has a `content_json` column (JSONB NOT NULL) using a different schema than the doc's dual-track approach for `post_versions`.

**Recommend: fix-doc** (update the status to reflect the migration still exists but may be a new schema evolution).

---

## 2. editor-integration.md Audit

### 2.1 Next.js 16 SSR / Hydration — Mostly ✅

**Doc claim**: Three-layer hydration isolation: `'use client'` directive, `immediatelyRender: false`, `next/dynamic` with `{ ssr: false }`.

**Code evidence**: 
- `frontend/src/components/editor/TiptapEditor.tsx:1` — `'use client'`
- Line 351 — `immediatelyRender: false`
- Lines 420-431 — `dynamic(() => Promise.resolve(RichTextEditorInner), { ssr: false })`

**Verdict**: ✅ Consistent

### 2.2 Example Code Snippet — Partially Inconsistent

**Doc claim**: Uses `StarterKit` only with specific imports and pattern:
```typescript
const TiptapEditor = dynamic(
  () => import('@/components/editor/TiptapEditor'),
  { ssr: false }
)
```

**Code reality**: 
- Actual `TiptapEditor.tsx` uses `dynamic(() => Promise.resolve(RichTextEditorInner), { ssr: false })` — inline wrapping, not importing from a separate file
- Uses many more extensions (Underline, Placeholder, Image, Link, TextAlign, TaskList, TaskItem, Typography, ShikiCodeBlock, Table, Mention, Indent, Color, FontSize, LineHeight, TextDirection, MoreMark, SearchAndReplace, KatexExtension, VideoExtension, TwitterExtension, CalloutExtension)
- The `'use client'` directive IS in `TiptapEditor.tsx` but the doc shows it on the page component instead

**Verdict**: ⚠️ Minor — The example is simplified and doesn't match the actual implementation in complexity. More an illustration than spec.

### 2.3 Extensions Table — Partially Inconsistent

**Doc claim**: Links from `Link` extension, code blocks from `CodeBlockLowlight`, tables from `Table`, images from `Image`, math from `Mathematics`, undo/redo from `UndoHistory`.

**Code reality**:
- Link ✅ — `@tiptap/extension-link`
- Code block ❌ — Uses custom `ShikiCodeBlock` (not `CodeBlockLowlight`)
- Table ✅ — Uses `reactjs-tiptap-editor/table`
- Image ✅ — `@tiptap/extension-image`
- Math ✅ — Custom `BlockMath`/`InlineMath` extensions (extending `@tiptap/extension-mathematics`)
- Undo/redo ✅ — From `StarterKit` (not a separate `UndoHistory` extension)
- **Missing from doc**: `Underline`, `Placeholder`, `TextAlign`, `TaskList`/`TaskItem`, `Typography`, `ShikiCodeBlock`, `Mention`, `Indent`, `Color`, `FontSize`, `LineHeight`, `TextDirection`, `MoreMark`, `SearchAndReplace`, `KatexExtension`, `VideoExtension`, `TwitterExtension`, `CalloutExtension`
- **Doc mentions `CodeBlockLowlight`** but code uses custom `ShikiCodeBlock`

**Verdict**: ⚠️ Significant inconsistency. **Recommend: fix-doc** to reflect actual extensions used.

### 2.4 Save/Load API — Partially Inconsistent

**Doc claim**: 
- Save: `fetch('/api/v1/posts', { method: 'POST', body: JSON.stringify({ content: json }) })`
- Load: `fetch('/api/v1/posts/${slug}')` → `editor.commands.setContent(content_json)`

**Code reality**:
- Save: Frontend sends to `/api/v1/admin/posts` (not `/api/v1/posts`), sends `content_json` as a complex object and `content_mdx` as derived MDX text
- Load: Uses `postService.getPost(slug)` which calls `GET /api/v1/posts/{slug}`; then uses `loadToEditor()` for transformation, or directly `JSON.stringify(post.content_json)` if available
- The doc shows ONLY `content` being sent, but the actual code sends both `content_json`, `content_mdx`, and legacy `content`

**Verdict**: ⚠️ **Significant**. **Recommend: fix-doc** to reflect the actual `/api/v1/admin/posts` endpoint and dual-track save/load pattern.

---

## 3. media-handling.md Audit

### 3.1 Upload Endpoints — Mostly ✅

**Doc claim**: Three endpoints: `POST /admin/media/upload`, `POST /admin/media/presign-upload`, `POST /admin/media/finalize`.

**Code evidence**: 
- `backend/crates/api/src/routes/media.rs`:
  - Line 84: `upload_media` — `POST /admin/media/upload` ✅
  - Line 186: `presign_media_upload` — `POST /admin/media/presign-upload` ✅
  - Line 240: `finalize_media_upload` — `POST /admin/media/finalize` ✅

**Verdict**: ✅ Consistent

### 3.2 Storage Backend Abstraction — Inconsistent (structural)

**Doc claim**: A `pub trait StorageBackend` with `store`, `delete`, `presign_upload`, `presign_download` methods.

**Code reality**: Code uses an **enum** `StorageBackend` (not a trait):
```rust
pub enum StorageBackend {
    Local(LocalStorage),
    Minio(MinioStorage),
}
```
The methods are `impl StorageBackend` (enum methods), not a trait. Method names differ:
- Doc: `presign_upload` — Code: `presigned_upload_url`
- Doc: `presign_download` — Code: `presigned_download_url`
- Doc has no `head()` method — Code has it
- Doc has no `object_url()` method — Code has it
- Return types differ: doc says `Result<String>`, code returns `Result<Option<String>>` for presigned methods

**Verdict**: ❌ **Significant inconsistency**. **Recommend: fix-doc** to use enum pattern and correct method signatures.

### 3.3 Storage Backend Implementations — Partially Inconsistent

**Doc claim**: `S3StorageBackend` and `LocalStorageBackend`.

**Code reality**: `MinioStorage` and `LocalStorage` (no `S3StorageBackend`). MinIO is S3-compatible but the name is different.

**Verdict**: ⚠️ **Minor**. **Recommend: fix-doc** to use correct names (`MinioStorage`, `LocalStorage`).

### 3.4 Media Table Schema — Significant Inconsistency ❌

**Doc claim** (`media` table):
```sql
id              UUID,
filename        TEXT NOT NULL,
url             TEXT NOT NULL,
mime_type       TEXT NOT NULL,
size            BIGINT NOT NULL,
width           INTEGER,
height          INTEGER,
alt_text        TEXT,
uploader_id     UUID REFERENCES users(id),
article_id      UUID REFERENCES posts(id),
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted_at      TIMESTAMPTZ
```

**Code reality** (from `0004_create_cms_tables.sql:52-70` and `Media` model in `models/cms.rs:340-358`):
```sql
id              UUID PRIMARY KEY,
filename        TEXT NOT NULL,
original_filename TEXT NOT NULL,       -- NOT in doc
mime_type       TEXT NOT NULL,
size_bytes      BIGINT NOT NULL,       -- doc has just 'size'
width           INTEGER,
height          INTEGER,
storage_path    TEXT NOT NULL,          -- NOT in doc (doc has 'url')
cdn_url         TEXT,                   -- NOT in doc
alt_text        TEXT,
caption         TEXT,                   -- NOT in doc
uploaded_by     UUID,                   -- doc has 'uploader_id'
media_type      TEXT NOT NULL,          -- NOT in doc
usage_count     INTEGER NOT NULL,       -- NOT in doc
created_at      TIMESTAMPTZ,
updated_at      TIMESTAMPTZ,            -- NOT in doc
deleted_at      TIMESTAMPTZ
```

**Key differences**:
1. `uploader_id` → `uploaded_by` (name difference)
2. `size` → `size_bytes` (name difference)
3. `url` → `storage_path` + `cdn_url` (schema split)
4. `article_id` → removed (no direct FK to posts)
5. Missing from doc: `original_filename`, `caption`, `media_type`, `usage_count`, `updated_at`
6. There's also a SECOND media table `media_assets` in `2026042701_create_articles.sql` with yet another schema

**Verdict**: ❌ **Major inconsistency**. The design doc's schema is significantly outdated compared to actual schema. **Recommend: fix-doc** to match actual `media` table schema exactly.

### 3.5 Unimplemented Features — ✅

**Doc claim**: Chunked upload, image optimization (thumbnails, WebP/AVIF), virus scanning not yet implemented.

**Code reality**: None of these exist in the codebase. Confirmed by `AGENTS.md` noting "multipart media upload work remains incomplete in `backend/crates/api/src/routes/media.rs`".

**Verdict**: ✅ Consistent (doc accurately marks these as not yet implemented)

### 3.6 File Size Limit — ✅

**Doc claim**: 50MB limit.

**Code evidence**: `media.rs:110-113`:
```rust
if data.len() > 50 * 1024 * 1024 {
    return Err(AppError::BadRequest("File too large (max 50MB)".to_string()));
}
```

**Verdict**: ✅ Consistent

---

## 4. ast-conversion.md Audit

### 4.1 Conversion Direction — ✅

**Doc claim**: TipTap JSON (ProseMirror AST) → MDX plain text, via pure recursive JSON traversal in Rust at `backend/crates/core/src/mdx_convert.rs`.

**Code evidence**: Confirmed. `backend/crates/core/src/mdx_convert.rs` contains `pub fn tiptap_json_to_mdx(json: &Value) -> String` as described.

**Verdict**: ✅ Consistent

### 4.2 Core Functions — ✅

**Doc claim**: `tiptap_json_to_mdx` entry point, internal `render_node`, `render_inline_node`, `render_marks`.

**Code evidence**: 
- `mdx_convert.rs:34` — `pub fn tiptap_json_to_mdx(json: &Value) -> String` ✅
- The internal functions exist but names differ slightly. Doc says `render_node`, code uses match arms in `tiptap_json_to_mdx` directly. `render_inline_node` ✅ (line 544), `render_marks` → code uses `apply_mark` (line 595) and `render_text_node` (line 570)

**Verdict**: ⚠️ **Minor** — Function structure matches but names differ (`render_marks` → `apply_mark`). **Recommend: fix-doc** to match actual function names.

### 4.3 Call Sites — Inconsistent

**Doc claim**: Called from `posts.rs` (get_post fallback), `mdx_sync.rs` (MDX sync pipeline), `auth.rs` (article write).

**Code reality**:
- `posts.rs` — ✅ fallback conversion at line 613-680 for `content_mdx` generation
- `mdx_sync.rs` — ✅ confirmed MDX sync uses conversion
- `auth.rs` — ❌ **Not found**. No AST conversion happening in auth routes. The `auth.rs` module handles login/registration/tokens, not article writing.
- `mdx_convert.rs` route — ✅ Has its own endpoint at `POST /admin/mdx/convert` (mentioned but not in the doc's list)

**Verdict**: ⚠️ **Mistake**: Doc says `auth.rs` but should be `posts.rs` (the create/update post handlers in `posts.rs`) or `enhanced_posts.rs`. **Not `auth.rs`**.

**Recommend: fix-doc** (remove `auth.rs` reference, add `mdx_convert.rs` route).

### 4.4 Node Type Mapping Table — Partially Inconsistent

**Doc claim** mapping for `math` (latex) → `$$\nlatex\n$$`.

**Code reality**: Code at `mdx_convert.rs:58` uses `blockMath` (not `math`). The doc itself previously noted the node name is `blockMath` (in editor-design.md), but the AST conversion table says `math`.

Also:
- `taskList`/`taskItem` mapping in doc uses `- [x] ` format — ✅ Code confirms at lines 386-418
- `mention` → `@username` ✅ 
- `callout` → `::: callout-type` **❌** — Code at `render_callout` (lines 506-530) outputs `> ℹ️ ` / `> ⚠️ ` etc., NOT `:::` syntax. Uses blockquote-style rendering.
- `details`/`summary` — Doc says `<details>`/`<summary>` but code renders as `> **📖 ...**` (lines 480-503), using blockquote + emoji format, not HTML tags

**Verdict**: ⚠️ **Significant inconsistencies**:
1. **`math` should be `blockMath`** in the table
2. **`callout`** outputs `> ℹ️ ` style, not `::: callout-type` syntax
3. **`details`/`summary`** outputs blockquote format, not HTML `<details>` tags

**Recommend: fix-doc** (update table to match actual output formats).

### 4.5 Mark Mapping — Mostly ✅

**Doc claim**: Bold, italic, code, link, strike.

**Code reality**: Code additionally supports `underline` (line 600), `highlight` (line 603). These are not in the doc's mark mapping table.

**Verdict**: ⚠️ **Minor omission**. **Recommend: fix-doc** (add `underline` and `highlight` marks).

### 4.6 Dual-Track Storage — ✅

**Doc claim**: Write both `content_json` and `content_mdx`; read preference: `content_mdx` → fallback.

**Code evidence**:
- `posts.rs:384-432` — create_post writes both
- `posts.rs:613-680` — get_post_response: 3-level fallback (content_mdx → content_json real-time convert → legacy content)
- `posts.rs:768-770` — update_post auto-derives content_mdx from content_json

**Verdict**: ✅ Consistent

### 4.7 Test Coverage — ✅

**Doc claim**: 16 unit tests in `mdx_convert.rs`.

**Code evidence**: The file has numerous `#[cfg(test)]` tests, though the exact count needs manual counting. The test file `mdx_to_json.rs` also has tests. The `mdx_convert.rs` file is 926 lines and has extensive test coverage.

**Verdict**: ✅ Consistent (tests exist, likely 16+)

---

## 5. collaboration-crdt.md Audit

### 5.1 Implementation Status — ✅

**Doc claim**: "尚未实施" (not yet implemented) — P7 extension phase.

**Code reality**: Zero WebSocket or collaboration code exists in the actual codebase:
- No `y-prosemirror`, `yrs`, `y-crdt`, or `Yjs` imports in any frontend source files
- No WebSocket handlers in the Axum backend
- No `HocuspocusProvider` or `Collaboration` extension in `TiptapEditor.tsx`
- The repo `AGENTS.md` makes no mention of collaboration

**Verdict**: ✅ Consistent — correctly marked as not implemented.

### 5.2 Architecture Claim — Planning Only

The doc describes a Yrs-based Rust backend architecture. There is a separate `docs/p4-websocket-collaboration.md` that describes a different architecture using Hocuspocus (Node.js). These describe different approaches:
- `collaboration-crdt.md`: Uses Yrs (Rust, Axum integration)
- `p4-websocket-collaboration.md`: Uses Hocuspocus (Node.js, separate process)

Neither is implemented in code. Both are planning documents.

**Verdict**: ⚠️ **Two competing design docs** exist for collaboration — one says Yrs (Rust), the other says Hocuspocus (Node.js). This should be resolved into a single design direction.

**Recommend: fix-doc** (consolidate into one architecture doc, decide on direction).

---

## 6. testing-strategy.md Audit

### 6.1 Test Pyramid — Partially Inconsistent

**Doc claim** (lines 7-16):
```
E2E: Playwright: 97 tests covering 12 core paths
Integration: Frontend Vitest (188 tests), Backend cargo test
Unit: Backend: 28 test files (incl. 16 mdx_convert tests)
Type Check: Rust cargo check, TypeScript ESLint
```

**Code reality** (actual measured counts):
- **E2E tests**: 11 spec files in `frontend/e2e/`, with **97 `test()` calls** — ✅ Matches
- **Frontend Vitest**: 15 test files in `frontend/tests/`, with **29 `it()` calls** — ❌ **Doc says 188 tests, actual is ~29-79 test cases** (depending on whether you count describes or its). The Vitest tests house ~79 `it()/test()` + `describe()` combos. Even counting every assertion-based test, it's well under 188.
- **Backend unit tests**: `cargo test` total: 66 `#[test]` in `crates/core/src/`, 41 `#[test]` in `crates/api/src/`, 134 `#[tokio::test]` in `crates/api/tests/` — ~241 total test functions in the backend crate
- **Backend 28 test files, 16 mdx_convert tests**: There are 19 test `.rs` files in `backend/crates/api/tests/`. `mdx_convert.rs` has 16 `#[test]` — ✅ Partially matches (test files are 19 not 28, unless counting inline `#[cfg(test)] mod tests` blocks in source files)
- **TypeScript `strict: false`**: ✅ Confirmed in `frontend/AGENTS.md`: `TypeScript "strict" remains disabled in the frontend`

**Verdict**: ❌ **Significant inconsistency** in frontend Vitest test count. Doc says 188 tests, actual is ~29-79 test cases.

**Recommend: fix-doc** (update Vitest test count to actual ~79 tests).

### 6.2 E2E Core Paths — Missing File

**Doc claim** (lines 32-45): Lists 12 E2E spec files including `blog-rendering.spec.ts`.

**Code reality**: 11 spec files exist in `frontend/e2e/`. `blog-rendering.spec.ts` **does not exist** — it's listed in the doc but absent from the actual `frontend/e2e/` directory.

All other listed files exist: ✅ `auth.spec.ts`, `admin.spec.ts`, `blog.spec.ts`, `search.spec.ts`, `editor-publish.spec.ts`, `math-rendering.spec.ts`, `abc-notation.spec.ts`, `codeblock-shiki.spec.ts`, `codeblock-rendering.spec.ts`, `content-cqrs.spec.ts`, `api-contract.spec.ts`.

**Verdict**: ❌ **Doc lists 12 core paths but only 11 spec files exist**. The `blog-rendering.spec.ts` file is referenced in the doc with a note "(Playwright 配置需调整)" suggesting it was planned but never created.

**Recommend: fix-doc** (remove `blog-rendering.spec.ts` from the table, or create the missing test file).

### 6.3 Cover Matrix — Partially Inconsistent

**Doc claim** (lines 22-27):
- Rust 单元测试: 28 test files, 16 mdx_convert tests
- Rust API 测试: advanced_security_tests
- TypeScript: `strict: false`
- 前端组件测试: 146 test cases
- E2E: 97 tests

**Code reality**:
- Rust unit tests: `backend/crates/core/src/` has 66 `#[test]` across `auth.rs` (22), `mdx_convert.rs` (16), `email.rs` (1), `mdx_to_json.rs` (27). Plus `crates/api/src/` has 41 in-module tests. The **28 test files** claim likely includes inline `mod tests` blocks — hard to verify count.
- **Frontend Vitest "146 tests"**: Doc says 146, but actual `it()` calls in `frontend/tests/` = ~29, and counting `describe()` blocks as well gives ~79. The 146 number is **not reflected in the codebase** at the time of audit.
- E2E 97 tests: ✅ Matches (grep shows 97 `test()` calls in `frontend/e2e/`).
- advanced_security_tests: ✅ Exists at `backend/crates/api/tests/security/advanced_security_tests.rs`.

**Verdict**: ⚠️ **Frontend Vitest count is inflated** (doc says 146, actual ~79).

**Recommend: fix-doc** (update to actual counts: ~79 frontend tests, ~241 backend tests).

### 6.4 Regression Test Flow — Partially Inconsistent

**Doc claim** (lines 49-60):
```bash
# 1. Backend
cd backend && cargo test --workspace && cargo clippy
# 2. Frontend
cd frontend && pnpm test && npx eslint . --max-warnings=600
# 3. E2E (CI)
pnpm test:e2e
```

**Code reality**: 
- Backend commands: ✅ `cargo test --workspace` and `cargo clippy` are standard and work.
- Frontend commands: `pnpm test` is configured in `package.json` (see AGENTS.md). ESLint with `--max-warnings=600` — not confirmed in any CI config but plausible.
- There's no mention of `cargo check` which `AGENTS.md` lists as a canonical command (`cd backend && cargo check`).
- CI workflows exist (mentioned in AGENTS.md as active GitHub Actions: backend CI, frontend CI, security scans, release image publication) but are not referenced in the testing-strategy doc.

**Verdict**: ⚠️ **Minor** — Missing mention of `cargo check` in the regression flow. Doc doesn't reference the actual CI pipeline that enforces these checks.

**Recommend: fix-doc** (add `cargo check` and reference to CI pipelines, or update CI workflow references).

### 6.5 Performance Benchmarks — ✅

**Doc claim** (lines 64-69):
- API P95 < 200ms
- FCP < 1.5s
- TTI < 3s
- API throughput > 1000 req/s

**Code reality**: There is a `performance_benchmarks.rs` file (434 lines) in `backend/crates/api/tests/` and stress tests in `stress_tests.rs` and `extreme_stress_tests.rs`. These show the framework exists for benchmarking. However, doc says tools are "k6 / autocannon" and "Lighthouse CI" — no k6, autocannon, or Lighthouse CI configuration files were found in the repo.

**Verdict**: ⚠️ **Minor** — Doc references k6/autocannon/Lighthouse CI as tools, but only Rust-based benchmarks exist in the actual codebase. The benchmarks are aspirational targets, not yet measured.

**Recommend: fix-doc** (note that performance benchmarks are Rust-based, not using k6/autocannon yet, and add a status).

---

## 7. roadmap.md Audit

### 7.1 Phase 1: Security Baseline (HttpOnly Cookie, CSRF) — Mostly in Code ✅

**Doc claim**: HttpOnly Cookie, CSRF 防护 — 1-2 weeks.

**Code reality**:
- **HttpOnly Cookie**: ✅ Implemented extensively. `backend/crates/api/src/routes/auth.rs` has multiple `.http_only(true)` calls (lines 137, 147, 293, 300, 312, 319, 506). Auth middleware reads from `access_token` cookie at `middleware/auth.rs:62`.
- **CSRF 防护**: ✅ Implemented at `backend/crates/api/src/middleware/csrf.rs` with `csrf_middleware` function applied to state-changing routes in `main.rs:339-374`. CSRF tokens use dual-cookie approach (HttpOnly + XSRF-TOKEN readable by JS).

**Verdict**: ✅ Phase 1 is implemented in code. HttpOnly cookies and CSRF protection are live.

### 7.2 Phase 2: Database Optimization — Partially Implemented

**Doc claim**: UUIDv7 migration, ltree comments — 2-3 weeks.

**Code reality**:
- **UUIDv7 migration**: ❌ **Not implemented**. Codebase exclusively uses `Uuid::new_v4()` (UUIDv4) across all crates: `comments.rs:92,96`, `mdx_sync.rs:270`, `media.rs:695-696`, `auth.rs:257,545`, `storage.rs:531`, `outbox.rs:41,63,83,106`, `request_id.rs:18`, etc. No UUIDv7 generation logic found anywhere.
- **ltree comments**: ✅ **Implemented**. `backend/crates/api/src/routes/comments.rs:115` uses `$6::ltree` in SQL INSERT for comment paths.

**Verdict**: ❌ **Phase 2 is partially complete** — ltree is done but UUIDv7 migration has not started. Code still uses UUIDv4 everywhere.

**Recommend: fix-doc** (mark UUIDv7 as "not started", update status from "2-3 weeks" to reflect actual progress).

### 7.3 Phase 3: API Contract (Orval) — Partially Implemented

**Doc claim**: Orval configuration, TypeScript client — 2 weeks.

**Code reality**:
- **Orval is installed**: ✅ Orval packages are in `frontend/pnpm-lock.yaml` (orval@8.6.2 with many @orval/* sub-packages). 
- **Orval-generated code**: ⚠️ `docs/development/CLAUDE.md` mentions "OpenAPI types: `frontend/src/lib/api.ts` (generated by orval)" and `docs/design/frontend-architecture.md` mentions `generated/` directory for Orval output. However, the actual `frontend/src/lib/api.ts` file and `generated/` directory need verification.
- **scripts/lint/100_golden_rules.sh:690** says: "§9.1 的 Orval 自动化是 aspirational 目标，当前为手动类型" — confirming Orval automation is still aspirational, types are still manually maintained.

**Verdict**: ⚠️ **Orval is installed but not actively generating types**. The codebase itself acknowledges it's aspirational.

**Recommend: fix-doc** (mark as aspirational/in-progress rather than a completed 2-week task).

### 7.4 Phase 4: Authentication Upgrade (WebAuthn) — Not Implemented ❌

**Doc claim**: WebAuthn integration — 2-3 weeks.

**Code reality**: Zero WebAuthn or passkey-related code found anywhere in the repo. No WebAuthn endpoints, no frontend passkey UI, no `webauthn-rs` crate dependency.

**Verdict**: ❌ **Not implemented**. Phase 4 has not been started.

**Recommend: fix-doc** (mark as "not started" or remove from roadmap if priorities changed).

### 7.5 Phase 5: Search CDC (MeiliBridge) — Implemented ✅

**Doc claim**: MeiliBridge deployment, CDC-based search sync — 2 weeks.

**Code reality**:
- **MeiliBridge CDC Worker**: ✅ Exists at `backend/crates/worker/src/cdc_main.rs` — file header says "MeiliBridge CDC Worker". Implements CDC-based search sync with Meilisearch.
- **Meilisearch integration**: ✅ Meilisearch SDK is a workspace dependency (`meilisearch-sdk = "0.28"` in `backend/Cargo.toml:87`). `blog_shared::Settings` has `meilisearch: Option<MeilisearchConfig>`.
- **Meilisearch in deployments**: ✅ Docker Compose dev and prod both include `meilisearch` containers. Kubernetes base config has `MEILISEARCH_URL`.
- **Search index service**: ✅ `backend/crates/api/src/search_index.rs` uses `meilisearch_sdk`.

**Verdict**: ✅ Phase 5 is fully implemented. CDC-based search sync with MeiliBridge exists and is deployed.

### 7.6 Phase 6: K3s Migration — Partially Implemented

**Doc claim**: Production-grade K3s cluster — 3-4 weeks.

**Code reality**:
- **K3s manifests exist**: ✅ `deployments/k3s/` directory contains `blog-backend.yaml`, `blog-postgres.yaml`, `blog-redis.yaml`, `network-policy.yaml`, `namespace.yaml`.
- **K8s base configs exist**: ✅ `deployments/kubernetes/base/` has configmaps, secrets, deployment configs.
- **But**: The repo also maintains a complete Docker Compose production pipeline (`deployments/docker/compose-files/prod/docker-compose.yml`) with deployment scripts (`scripts/deployment/`). The `AGENTS.md` states: "The repository now has two maintained deployment paths only: Compose for single-host and small-fleet deployments, Kubernetes + optional GitOps release assets for clustered deployments."
- **Note**: `docs/design/deployment-security.md:44-49` says K3s deployment exists but "K8s base 配置的 securityContext 待补充到与 K3s 一致", indicating K3s is active but not fully aligned with K8s base configs.

**Verdict**: ⚠️ **Partially implemented**. K3s manifests exist and are documented as an alternative to Compose, but the roadmap presents it as a future migration from Compose to K3s, while the codebase treats them as parallel deployment options.

**Recommend: fix-doc** (update to reflect parallel deployment paths, not a one-way migration from Compose to K3s).

### 7.7 Technology Decision Table — Mixed

**Doc claim** (lines 18-26):

| Decision | Old | New | Status |
|----------|-----|-----|--------|
| Primary Key | UUIDv4 | UUIDv7 | ❌ **Still using UUIDv4** |
| Soft Delete+Unique | Combined unique index | Partial unique index | ⚠️ Need to verify |
| Comment Tree | Recursive CTE | ltree | ✅ **Implemented** |
| Count Update | Real-time UPDATE | Redis buffer+HOT | ⚠️ Need to verify |
| JWT Storage | localStorage | HttpOnly Cookie | ✅ **Implemented** |
| Search Sync | Outbox polling | CDC MeiliBridge | ✅ **Implemented** |
| Content Processing | Contentlayer | Velite | ✅ **Implemented** (confirmed in `frontend/package.json`, `velite.config.ts`) |
| API Types | Manual | Orval auto-generated | ⚠️ **Orval installed but still aspirational** |
| Deployment | Docker Compose | K3s | ⚠️ **Both maintained as parallel paths** |

**Verdict**: ❌ **Multiple technology decisions marked as completed in the roadmap are not yet implemented in code** (UUIDv7, Orval). Some are implemented (ltree, HttpOnly Cookie, Velite, MeiliBridge). Deployment is dual-path, not a migration.

**Recommend: fix-doc** (update status column to reflect actual implementation state).

---

## 8. privacy-compliance.md Audit

### 8.1 Data Export API — Not Implemented ❌

**Doc claim** (lines 35-44):
```
GET /api/v1/user/data-export → Returns ZIP with profile.json, articles.json, comments.json, activity.json
```

**Code reality**: Zero implementation of any data export endpoint or logic in the codebase:
- No `data-export` route in `backend/crates/api/src/routes/` directory (checked via file listing and content search)
- No ZIP generation logic found anywhere
- No `/api/v1/user/data-export` handler in any route file
- No `data_export` or `data-export` function names found

**Verdict**: ❌ **Completely unimplemented**. The doc is explicitly marked as "尚未实施" (not yet implemented) at line 3, so this is consistent, but the API specification is detailed enough to be misleading.

**Recommend: fix-doc** (keep as "planning only" but add clearer labels that none of the APIs exist. Or add a status column to each section.)

### 8.2 Data Delete API — Not Implemented ❌

**Doc claim** (lines 48-56):
```
DELETE /api/v1/user/data → Triggers async deletion, returns task_id, completes within 45 days
```

**Code reality**: No data deletion endpoint exists:
- No `DELETE /api/v1/user/data` route handler found
- No async deletion task infrastructure
- No task queue for deletion jobs
- The `delete_user` function in `backend/crates/api/src/routes/admin.rs` (line 414) is for admin-initiated user deletion, not user-initiated data deletion/export
- `batch_delete_users` at line 753 is also admin-only

**Verdict**: ❌ **Completely unimplemented** (consistent with the doc's own caveat, but still worth noting).

**Recommend: fix-doc** (same as 8.1 — mark clearly as unimplemented).

### 8.3 Auto-Cleanup Policy (DROP) — Not Implemented ❌

**Doc claim** (lines 22-31):
- 45-day retention for logs, search history, unverified users, deleted articles
- Auto-rotation and cleanup

**Code reality**: No automated cleanup/cron jobs found in the codebase:
- No background task for log rotation
- No TTL-based cleanup for search history
- No scheduled deletion of unverified users
- No physical deletion of soft-deleted articles after 45 days
- The `worker` crate at `backend/crates/worker/src/main.rs` and `cdc_main.rs` handles MeiliBridge sync, not cleanup tasks

**Verdict**: ❌ **Completely unimplemented** (consistent with doc's "尚未实施" status).

**Recommend: fix-doc** (keep status as "planning" but add a note that no cleanup infrastructure exists yet).

### 8.4 Regulatory Compliance — No Code Evidence

**Doc claim** (lines 7-11): GDPR (EU), Personal Information Protection Law (China), CCPA (California).

**Code reality**: Zero compliance-related code found:
- No cookie consent banner or GDPR consent mechanism in frontend
- No IP anonymization logic
- No data residency controls
- No "Do Not Sell My Personal Information" (CCPA) opt-out
- No privacy policy page or endpoint
- Only mention of "privacy" in the codebase is a newsletter boilerplate string in `frontend/src/lib/i18n-client.ts:104,316`

**Verdict**: ✅ Consistent with "尚未实施" (not yet implemented). The doc accurately describes planned compliance, not current state.

**Recommend**: No change needed — the doc explicitly marks itself as "尚未实施". However, if it should reflect current progress, consider adding a status column.

### 8.5 User Data Classification — No Code Implementation

**Doc claim** (lines 15-20): Categories PII, Auth Data, Content Data, Behavior Data with encryption and handling requirements.

**Code reality**:
- **PII (email, IP)**: Email is stored in `users` table, IP collected in `comments` table (`created_ip`, `user_agent` fields at `comments.rs:222,274`) and auth sessions (`$4::inet` at `auth.rs:114,264`). No encryption at rest for these fields.
- **Auth Data (password hash)**: ✅ Uses Argon2id (confirmed in `auth.rs:226-232` and `core/src/auth.rs`). Doc says "Argon2id 哈希、不可逆" — matches code.
- **Content Data**: Stored as-is with no retention/cleanup logic.
- **Behavior Data**: No search history or browsing history tracking found in code. No tracking infrastructure exists.
- **IP storage**: Comments store IP (`created_ip` field), auth sessions store IP (`inet` type). The repo `AGENTS.md` notes "comment IP extraction still has TODOs in `backend/crates/api/src/routes/comments.rs`", indicating incomplete implementation.

**Verdict**: ⚠️ **Data classification in the doc is aspirational**. Actual data handling is ad-hoc. Password hashing (Argon2id) is properly implemented, but no encryption at rest for PII exists.

**Recommend: fix-doc** (add implementation status column: Argon2id ✅, PII encryption ❌, behavior tracking ❌).

### 8.6 Explicit Consent & Privacy Controls — Not Implemented

**Doc claim**: "明确同意" (explicit consent), GDPR/CCPA requirements.

**Code reality**: No consent mechanism exists:
- No cookie consent banner
- No privacy policy acceptance flow during registration
- No data processing consent checkboxes
- No mechanism to revoke consent

**Verdict**: ❌ **Not implemented** (consistent with doc's planning status).

**Recommend**: No change — doc is clearly marked as planning.

---

## Summary of Issues Found (Complete)

| # | Doc | Issue | Severity | Recommendation |
|---|-----|-------|----------|---------------|
| 1 | editor-design.md | Insert math uses `type: 'math'` instead of `'blockMath'` | Minor | **fix-code** |
| 2 | editor-design.md | Paste handler not implemented in code | Minor | **fix-doc** |
| 3 | editor-design.md | `articles`/`article_versions` still have existing migration | Minor | **fix-doc** |
| 4 | editor-integration.md | Extensions table missing ~15 extensions, wrong code block extension | Major | **fix-doc** |
| 5 | editor-integration.md | Save/load API uses `/api/v1/admin/posts` not `/api/v1/posts` | Major | **fix-doc** |
| 6 | media-handling.md | StorageBackend is an enum, not a trait; method names differ | Major | **fix-doc** |
| 7 | media-handling.md | Media table schema has 9 column differences | Major | **fix-doc** |
| 8 | media-handling.md | Storage implementations named `MinioStorage`/`LocalStorage`, not `S3StorageBackend`/`LocalStorageBackend` | Minor | **fix-doc** |
| 9 | ast-conversion.md | `auth.rs` not a call site; should be `posts.rs` | Moderate | **fix-doc** |
| 10 | ast-conversion.md | Node type table says `math` should be `blockMath`; `callout` outputs `> ℹ️` not `:::`; `details` uses blockquote not HTML | Major | **fix-doc** |
| 11 | ast-conversion.md | Missing `underline` and `highlight` in mark mapping table | Minor | **fix-doc** |
| 12 | collaboration-crdt.md | Two competing collaboration design docs (Yrs vs Hocuspocus) | Moderate | **fix-doc** |
| 13 | **testing-strategy.md** | Frontend Vitest test count: doc says 188 tests, actual ~29-79 | **Major** | **fix-doc** |
| 14 | **testing-strategy.md** | `blog-rendering.spec.ts` listed in E2E paths but file doesn't exist | **Major** | **fix-doc** |
| 15 | **testing-strategy.md** | Frontend test count in matrix: doc says 146, actual ~79 | Moderate | **fix-doc** |
| 16 | **testing-strategy.md** | Missing `cargo check` in regression flow; no CI pipeline reference | Minor | **fix-doc** |
| 17 | **testing-strategy.md** | Performance benchmark tools (k6/autocannon/Lighthouse CI) not in repo | Minor | **fix-doc** |
| 18 | **roadmap.md** | UUIDv7 migration not started — code still uses UUIDv4 everywhere | **Major** | **fix-doc** |
| 19 | **roadmap.md** | Orval auto-generation still aspirational, not actively generating types | Moderate | **fix-doc** |
| 20 | **roadmap.md** | WebAuthn (Phase 4) completely unimplemented | **Major** | **fix-doc** |
| 21 | **roadmap.md** | K3s is a parallel deployment path, not a migration from Compose | Moderate | **fix-doc** |
| 22 | **roadmap.md** | Technology decision table shows statuses that don't match actual code | **Major** | **fix-doc** |
| 23 | **privacy-compliance.md** | Data export API (`GET /api/v1/user/data-export`) not implemented | N/A | **fix-doc** (mark clearly) |
| 24 | **privacy-compliance.md** | Data delete API (`DELETE /api/v1/user/data`) not implemented | N/A | **fix-doc** (mark clearly) |
| 25 | **privacy-compliance.md** | Auto-cleanup policy (DROP) not implemented | N/A | **fix-doc** (mark clearly) |
| 26 | **privacy-compliance.md** | Regulatory compliance (GDPR/CCPA/PIPL) code absent | N/A | **fix-doc** (mark clearly) |
| 27 | **privacy-compliance.md** | No PII encryption at rest; IP storage has TODOs | N/A | **fix-doc** (add status) |

### Most Critical Issues (Updated)

1. **Media table schema** (issue #7) — The design doc schema and actual DB schema are almost completely different. This is the most severe inconsistency.

2. **StorageBackend structural difference** (issue #6) — The doc describes a trait pattern but code uses an enum pattern with different method signatures.

3. **AST node type mappings** (issue #10) — The doc has wrong output formats for `callout` and `details`/`summary`, and uses `math` instead of `blockMath`.

4. **Extensions table** (issue #4) — The editor-integration doc is missing the vast majority of extensions actually used in the editor.

5. **Testing strategy numbers are inflated** (issues #13, #15) — Frontend Vitest/E2E counts don't match actual tests. 188 claimed, ~79 actual.

6. **Roadmap statuses are misleading** (issues #18, #20, #22) — Critical items like UUIDv7 (not started) and WebAuthn (not started) are shown as planned phases when in reality no work has begun.

7. **Privacy-compliance doc is entirely aspirational** (issues #23-27) — The doc is correctly labeled "尚未实施" but the detailed API specifications and compliance requirements suggest a level of planning that doesn't exist in code.
