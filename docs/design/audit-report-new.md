# Design Doc vs. Code Audit Report

**Date**: 2026-04-29
**Auditor**: Automated audit agent

---

## 1. testing-strategy.md

### 1.1 "97 个 E2E 测试用例覆盖 12 条核心路径" — Test count mismatch

- **Doc says**: 97 E2E test cases
- **Reality**: There are **11 E2E spec files** in `frontend/e2e/` — not 97 test cases. The actual number of `test()` or `it()` calls across all 11 files is significantly less than 97. Also the doc lists **12** core paths but only **11** spec files exist.
- **Files checked**: `frontend/e2e/*.spec.ts` — 11 files found: `auth.spec.ts`, `admin.spec.ts`, `blog.spec.ts`, `search.spec.ts`, `editor-publish.spec.ts`, `math-rendering.spec.ts`, `abc-notation.spec.ts`, `codeblock-shiki.spec.ts`, `codeblock-rendering.spec.ts`, `content-cqrs.spec.ts`, `api-contract.spec.ts`
- **Missing file**: `blog-rendering.spec.ts` is listed in the doc table but does **not exist** in the filesystem.
- **Verdict**: Fix **doc** — update the test count and core path list to match actual code. Either remove the `blog-rendering.spec.ts` entry or add it if planned.
- **Change needed**:
  - Line 8: Change `97 个测试用例覆盖 12 条核心路径` to `实际 11 条核心路径` (or count actual cases)
  - Lines 42-45: Remove or comment out the `blog-rendering.spec.ts` entry as it doesn't exist
  - Update the actual test case count to match reality

### 1.2 "28 个测试文件（含 mdx_convert 的 16 个测试）" — Test file count mismatch

- **Doc says**: 28 test files in backend
- **Reality**: There are **19 test files** in `backend/crates/*/tests/` directories, plus **23 inline test modules** (modules with `#[cfg(test)]` in `src/`). The doc conflates test **files** with test **functions**.
- **Also**: "mdx_convert 的 16 个测试" — There are indeed 16 `#[test]` functions in `backend/crates/core/src/mdx_convert.rs`, and 27 more in `mdx_to_json.rs` (both are MDX-related). The doc only mentions `mdx_convert`.
- **Verdict**: Fix **doc** — clarify the distinction between test files and test functions. Update to reflect 19 dedicated test files + 23 inline test modules.
- **Change needed**: Line 12: Change `28 个测试文件（含 mdx_convert 的 16 个测试）` to `19 个集成/单元测试文件 + 23 个内联测试模块（含 mdx_convert 16 个测试 + mdx_to_json 27 个测试）`

### 1.3 "前端 Vitest (188 tests)" — Test count mismatch

- **Doc says**: 188 frontend tests (line 10) and 146 test cases (line 25)
- **Reality**: There are **15 Vitest test files** in `frontend/tests/`. The actual number of individual test cases would need to be counted, but the doc gives two different numbers (188 vs 146) for the same thing, which is inconsistent.
- **Verdict**: Fix **doc** — either pick one number and verify it, or use a verifiable count.
- **Change needed**: Lines 10 and 25: Reconcile the two numbers. If 188 is correct, change line 25. If 146 is correct, change line 10.

### 1.4 "后端 cargo test" (line 10) — Misleading description

- **Doc says**: Backend integration tests run via `cargo test`
- **Reality**: The backend has tests in both the `tests/` directories (integration/security) and inline `#[cfg(test)]` modules in `src/`. The doc's pyramid shows integration tests separately from unit tests, but `cargo test` runs both together.
- **Verdict**: Minor — fix **doc** to be more precise about the test types.
- **Change needed**: Line 10: Clarify that `cargo test` includes both unit and integration tests.

### 1.5 "TypeScript tsc --noEmit" — Check doesn't exist in practice

- **Doc says**: `tsc --noEmit` is a testing step (line 24)
- **Reality**: No `tsc --noEmit` script is configured in `frontend/package.json`. Only ESLint is used. The tsconfig has `"strict": false` which the doc acknowledges, but the actual CI/regression pipeline doesn't run `tsc --noEmit`.
- **Verdict**: Fix **doc** — either add this to the regression script or update the doc to indicate it's aspirational.
- **Change needed**: Lines 24, 56: Remove `tsc --noEmit` from the regression script or add the script to `package.json`. Currently only `eslint` checks are run.

### 1.6 E2E core paths table lists nonexistent file

- **Doc says**: `blog-rendering.spec.ts` exists in the table
- **Reality**: File `frontend/e2e/blog-rendering.spec.ts` does not exist
- **Verdict**: Fix **doc** — remove this entry (or create the file if intended)
- **Change needed**: Line 45: Delete or comment out the `blog-rendering.spec.ts` entry

---

## 2. roadmap.md

### 2.1 Phase 1 "安全基线" — HttpOnly Cookie implementation

- **Doc says**: Phase 1 (1-2 weeks), delivered HttpOnly Cookie, CSRF 防护
- **Reality**: HttpOnly Cookie auth is fully implemented: `backend/crates/api/src/routes/auth.rs` sets HttpOnly cookies, and the entire frontend codebase references "GOLDEN_RULES 1.1" mandating HttpOnly-only auth. CSRF protection is also implemented via `backend/crates/api/src/middleware/csrf.rs` with XSRF-TOKEN cookies.
- **However**: The E2E tests in `frontend/e2e/` still use `localStorage.getItem('access_token')` extensively (e.g., `auth.spec.ts` lines 45, 137, 202, 220, 242, 253), indicating the tests haven't been fully migrated to the HttpOnly cookie model.
- **Verdict**: Phase 1 is **completed** in production code but E2E tests lag behind. Fix **tests** — update E2E tests to use HttpOnly cookie auth instead of localStorage.
- **Status**: ✅ Completed (code side)

### 2.2 Phase 2 "数据库优化" — UUIDv7 migration, ltree comments

- **Doc says**: UUIDv7 migration, ltree comments
- **Reality**: 
  - Migration `2026040901_uuidv7_migration.sql` exists — ✅
  - HOT optimization migration `2026040902_hot_optimization.sql` exists — ✅
  - Soft delete + partial indexes migration `2026040903_soft_delete_indexes.sql` exists — ✅
  - ltree is used in `comments.rs` line 115 via PostgreSQL ltree type — ✅
- **Verdict**: ✅ Completed — update roadmap doc to mark as done.
- **Status**: ✅ Completed

### 2.3 Phase 3 "API 契约" — Orval 配置, TS 客户端

- **Doc says**: Orval auto-generated TypeScript client
- **Reality**: No Orval configuration or auto-generation is set up. The file `scripts/lint/100_golden_rules.sh` line 690 explicitly states: "§9.1 的 Orval 自动化是 aspirational 目标，当前为手动类型". The frontend uses manually maintained types (e.g., `src/lib/types/backend.ts`, `src/lib/types/openapi-generated.ts`). The latter is a one-time generated file, not kept in sync via Orval.
- **Verdict**: Fix **doc** — Phase 3 is **not implemented**. Update roadmap to reflect that Orval generation is aspirational and types are currently manually maintained.
- **Change needed**: Line 9: Mark Phase 3 as "未完成 — 手动维护类型" or update to reflect current state.

### 2.4 Phase 4 "认证升级" — WebAuthn 集成

- **Doc says**: WebAuthn integration (2-3 weeks)
- **Reality**: No WebAuthn implementation exists in the codebase. The only references to WebAuthn are in documentation files (`docs/design/auth-design.md`, `docs/development/GOLDEN_RULES.md`, `docs/design/roadmap.md`).
- **Verdict**: Fix **doc** — this is still pending. Make sure the timeline accurately reflects that this has not been started.
- **Change needed**: Line 10: Mark Phase 4 as "未开始" or update expected timeline.

### 2.5 Phase 5 "搜索 CDC" — MeiliBridge 部署

- **Doc says**: MeiliBridge CDC deployment (2 weeks)
- **Reality**: CDC worker is partially implemented in `backend/crates/worker/src/cdc_main.rs` with PostgreSQL WAL → Meilisearch sync. However, comments in the code indicate some features are still being developed (the code references both WAL streaming and poll modes). Meilisearch is configured in `deployments/docker/compose-files/dev/docker-compose.yml`. The CDC worker exists but may not be fully production-deployed.
- **Verdict**: Partially completed. Fix **doc** to clarify that the CDC worker is implemented but may need production hardening.
- **Change needed**: Line 11: Mark Phase 5 as "部分完成 — worker 已实现" with notes on what remains.

### 2.6 Phase 6 "K3s 迁移" — 生产级集群

- **Doc says**: K3s migration for production cluster (3-4 weeks)
- **Reality**: K3s deployment manifests exist at `deployments/k3s/` (backend, postgres, redis, namespace, network-policy yamls). Additionally, Kubernetes base configs exist at `deployments/kubernetes/base/`. However, the AGENTS.md states the project maintains **two** deployment paths: "Compose for single-host and small-fleet deployments" and "Kubernetes + optional GitOps release assets for clustered deployments". There's no indication the Docker Compose path has been fully replaced by K3s.
- **Verdict**: Partially completed. Fix **doc** to reflect that K3s deployment manifests exist but Compose remains the primary path.
- **Change needed**: Line 12: Mark Phase 6 as "部分完成 — K3s 清单已创建，Compose 仍为主路径" or update the doc to reflect current deployment strategy.

### 2.7 "内容处理 | Contentlayer | Velite" — Actually both exist

- **Doc says**: Content was migrated from Contentlayer to Velite
- **Reality**: The project currently uses **Velite** (confirmed in `frontend/package.json` line 173: `"velite": "0.3.1"`). However, references to Contentlayer still exist in documentation (e.g., `CLAUDE.md` line 98, `scripts/data/CLAUDE.md`). The actual build pipeline runs `pnpm velite build`.
- **Verdict**: ✅ Velite migration is done. Minor doc cleanup needed for stale Contentlayer references.
- **Status**: ✅ Completed

### 2.8 "JWT 存储 | localStorage | HttpOnly Cookie" — Implemented but tests use localStorage

- **Doc says**: JWT moved from localStorage to HttpOnly Cookie
- **Reality**: The frontend code enforces HttpOnly Cookie auth (GOLDEN_RULES 1.1), but E2E tests still read/write `access_token` in localStorage (e.g., `auth.spec.ts` line 45, `content-cqrs.spec.ts` lines 130-133). The login helper at `frontend/e2e/helpers/login.ts` still stores tokens in localStorage.
- **Verdict**: Fix **code** (E2E tests) — update E2E tests to use HttpOnly cookie-based auth instead of localStorage.
- **Status**: ✅ Implemented in app code; ❌ E2E tests not migrated

---

## 3. privacy-compliance.md

### 3.1 GDPR/CCPA/个人信息保护法 compliance requirements — Largely unimplemented

- **Doc says**: GDPR, CCPA, and Chinese Personal Information Protection Law compliance
- **Reality**: The doc explicitly states this is "规划" (planning) and "尚未实施" (not yet implemented). The code confirms this: there are **no** data export endpoints (`GET /api/v1/user/data-export` does not exist), **no** data deletion endpoints for users (`DELETE /api/v1/user/data` does not exist), **no** cookie consent mechanism, **no** privacy policy page, and **no** data retention enforcement.
- **Verdict**: ✅ Doc accurately describes its own status as "尚未实施" (not yet implemented). No action needed — the doc is honest about being a plan.
- **Change needed**: None — the doc correctly identifies itself as planning phase.

### 3.2 Data deletion — Admin delete_user exists but not user self-service

- **Doc says**: `DELETE /api/v1/user/data` for user self-service data deletion
- **Reality**: `backend/crates/api/src/routes/admin.rs` has `delete_user` (line 414) and `batch_delete_users` (line 753), but these are **admin-only** endpoints, not user self-service. The `DELETE /api/v1/user/data` endpoint does not exist.
- **Verdict**: Fix **doc** — if this is aspirational, keep it as-is (it says "规划"). If it should reflect current reality, add a note that admin-only deletion exists.
- **Change needed**: Line 48-56: Add a note that admin deletion exists but user self-service deletion is not yet implemented.

### 3.3 Data export API — Not implemented

- **Doc says**: `GET /api/v1/user/data-export` returns ZIP with profile, articles, comments, activity
- **Reality**: This endpoint does not exist. No search for `data-export` or `data_export` returned any results.
- **Verdict**: ✅ Doc correctly identifies this as planning phase.
- **Change needed**: None if the doc remains marked as "规划"/"尚未实施".

### 3.4 Auto-cleanup (DROP) strategy — Not implemented

- **Doc says**: 45-day data retention with automatic log rotation, search history cleanup, unverified user deletion, and deleted article physical deletion
- **Reality**: No cron jobs, background workers, or scheduled tasks implement this 45-day cleanup policy. The worker crate (`backend/crates/worker/src/cdc_main.rs`) handles CDC/Meilisearch sync, not data retention cleanup.
- **Verdict**: ✅ Doc correctly identifies this as planning phase.
- **Change needed**: None if the doc remains marked as "规划"/"尚未实施".

### 3.5 Cookie consent — Not implemented

- **Doc says**: GDPR requires "明确同意" (explicit consent)
- **Reality**: No cookie consent banner, modal, or mechanism exists anywhere in the frontend code. Search for `CookieConsent`, `cookie-consent`, `privacy`, `gdpr` in frontend source returned zero results.
- **Verdict**: ✅ Doc correctly identifies this as planning phase.
- **Change needed**: None if the doc remains marked as "规划"/"尚未实施".

---

## Summary of Required Fixes

### Fix Docs (update to match reality):

| # | Doc | What to Fix | How |
|---|-----|-------------|-----|
| 1 | testing-strategy.md | E2E test count (line 8) | Change "97 个" to actual count, remove `blog-rendering.spec.ts` (line 45) |
| 2 | testing-strategy.md | Backend test file count (line 12) | Change "28 个测试文件" to "19 个测试文件 + 23 个内联测试模块" |
| 3 | testing-strategy.md | Frontend test count inconsistency (lines 10, 25) | Reconcile "188 tests" vs "146 个测试用例" |
| 4 | testing-strategy.md | `tsc --noEmit` in regression flow (lines 24, 56) | Remove or add the actual script |
| 5 | roadmap.md | Phase 3 (Orval) — not implemented (line 9) | Mark as "未完成 — 手动维护类型" |
| 6 | roadmap.md | Phase 4 (WebAuthn) — not started (line 10) | Mark as "未开始" |
| 7 | roadmap.md | Phase 5 (CDC) — partially done (line 11) | Mark as "部分完成" |
| 8 | roadmap.md | Phase 6 (K3s) — partially done (line 12) | Mark as "部分完成 — K3s 清单已创建，Compose 仍为主路径" |

### Fix Code (update to match docs):

| # | File(s) | What to Fix | How |
|---|---------|-------------|-----|
| 1 | `frontend/e2e/auth.spec.ts`, `content-cqrs.spec.ts`, `helpers/login.ts` | E2E tests still use localStorage for tokens instead of HttpOnly cookies | Migrate all E2E auth flows to use HttpOnly cookie authentication (the app code already does this) |

### No Fix Needed (doc is accurately aspirational):

| # | Doc | Item | Reason |
|---|-----|------|--------|
| 1 | privacy-compliance.md | All items | Doc correctly identifies itself as "规划/尚未实施" |
| 2 | roadmap.md | Phases 1-2 (security baseline, DB optimization) | These are correctly implemented in code |
| 3 | roadmap.md | Velite migration, ltree comments | These match reality |

### Most Critical Inconsistencies:

1. **testing-strategy.md test counts are inaccurate** — Numbers don't match actual file counts
2. **roadmap.md Phase 3 (Orval) is marked as deliverable but doesn't exist** — Need to update timeline
3. **E2E tests use localStorage auth while app code uses HttpOnly cookies** — Tests need updating
4. **privacy-compliance.md is accurately self-described as planning** — No changes needed
