# Design 设计文档对齐计划

> 本次对齐的目标是：**设计文档准确描述当前代码，不编造不存在的内容**。
> 原则：文档描述"实际已实现的"而非"未来想实现的"。

**Goal:** 将 12 份设计文档与当前代码完全对齐，消除所有不一致。

**策略:**
1. **已实现但文档没写的** → 补充到文档
2. **文档写了但实际没实现的** → 标注为"尚未实施"或删除
3. **文档与实际实现方式不同的** → 更新文档匹配实际代码

**架构原则:**
- 数据库 schema 文档写数据库实际存在的结构
- 后端路由文档写 main.rs 中实际注册的路由
- 前端组件文档只列实际存在的文件
- 所有转换/流程描述写实际实现方式，而非理想方案

---

### Task 1: 对齐 `database-schema.md` — 补充 posts 表字段

**Objective:** posts 表有 50+ 字段，文档只列了 25 个，需要补充全部。

**Files:**
- Modify: `docs/design/database-schema.md`

**需要补充的字段:**
- `scheduled_at` TIMESTAMPTZ
- `meta_title` TEXT
- `meta_description` TEXT
- `canonical_url` TEXT
- `show_toc` BOOLEAN DEFAULT TRUE
- `layout` TEXT
- `lastmod_at` TIMESTAMPTZ
- `reading_time` INTEGER
- `edit_count` INTEGER
- `first_published_at` TIMESTAMPTZ
- `last_edited_by` UUID REFERENCES users(id)
- `publication_version` INTEGER
- `author_display_name` TEXT
- `is_featured` BOOLEAN DEFAULT false
- `excerpt` TEXT
- `og_image_id` UUID REFERENCES media(id)
- `words_count` INTEGER
- `meta_keywords` TEXT
- `estimated_reading_time` INTEGER
- `content_format` TEXT
- `language` TEXT
- `post_type` TEXT
- `copyright_info` TEXT
- `license_type` TEXT
- `source_url` TEXT
- `featured_image_caption` TEXT
- `rendered_at` TIMESTAMPTZ
- `deleted_at` TIMESTAMPTZ

### Task 2: 对齐 `database-schema.md` — 修正错误描述

**Files:**
- Modify: `docs/design/database-schema.md`

**改动项:**
1. post_stats PK: `post_id UUID` → `slug TEXT`（已勘误，确认即可）
2. outbox_events：删除"PARTITION BY LIST"描述（实际没有分区）
3. Redis 限流：ZSET 滑动窗口 → INCR+EXPIRE 固定窗口
4. 删除 `sync_epoch` 列（不存在）
5. 索引命名：`idx_users_email` → `idx_users_email_active`, `idx_users_username` → `idx_users_username_active`

### Task 3: 对齐 `backend-api-design.md` — 路由表

**Files:**
- Modify: `docs/design/backend-api-design.md`

**改动项:**
1. 认证路由：`POST /auth/tokens` → `POST /auth/login`, `PUT /auth/tokens` → `POST /auth/refresh`, `DELETE /auth/tokens` → `POST /auth/logout`
2. 注册路由：`POST /users` → `POST /auth/register`
3. 当前用户：`GET /users/me` → `GET /auth/me`
4. 冒号风格 → 斜杠风格：`/tags:autocomplete` → `/tags/autocomplete`, `/{slug}:view` → `/{slug}/view`
5. 补充缺失的路由清单（forgot-password, reset-password, stats, related, reading-progress 等）
6. 删除不存在的路由（bulkDelete, syncFromMdx 冒号版等）
7. 补充实际存在但文档缺失的二进制：worker, migrate, create_admin

### Task 4: 对齐 `auth-design.md`

**Files:**
- Modify: `docs/design/auth-design.md`

**改动项:**
1. token 模型：从单 session_id → 双令牌（access_token + refresh_token）
2. 认证方式：从仅 HttpOnly Cookie → Cookie + Authorization: Bearer 双路径
3. 中间件职责：设计文档写"检查 Redis 黑名单"，实际中间件不做 I/O
4. WebAuthn：标注为"尚未实施"

### Task 5: 对齐 `ast-conversion.md` — 重写为实际实现

**Files:**
- Modify: `docs/design/ast-conversion.md`
- Reference: `backend/crates/core/src/mdx_convert.rs`

**改动项:**
1. 语言/位置：前端 TypeScript → Rust 后端 `blog-core` crate
2. 方案：remark-prosemirror → 纯 Rust 递归 JSON 遍历 + 字符串拼接
3. 节点映射表：补充 taskList, taskItem, video, table, mention, details, callout
4. 节点名修正：`mathematics` → `math`
5. 补充：16 个单元测试的存在
6. 补充：增量编译和编译队列的描述

### Task 6: 对齐 `frontend-architecture.md`

**Files:**
- Modify: `docs/design/frontend-architecture.md`

**改动项:**
1. 删除 `mutator.ts` 引用（不存在），改为描述 `apiClient.ts` + `backend.ts`
2. 删除 `proxy.ts` 引用（不存在），BFF 代理在 `app/api/v1/[...path]/route.ts`
3. 删除 `article-theme.css` Layer 2（不存在），CSS 实际使用 monograph-theme.css + visitor-theme.css
4. 删除 `components/sandbox/` 引用，搜索降级在 `SearchDashboard.tsx`
5. 删除 `TagList`、`PostNavigation` 引用

### Task 7: 对齐 `frontend-components.md`

**Files:**
- Modify: `docs/design/frontend-components.md`

**改动项:**
1. 删除不存在的组件：LayoutWrapper, ListLayout, ListLayoutWithTags, MagazineLayout, WorksSection, FeaturedWork, BlogCard, WorkCard, ArticleCard, BentoCard, AdminStatsCard
2. 补充实际存在的组件：HeroSection, BentoGrid, ProjectGallery, MusicExperience, LatestWriting, MegaFooter, CodeBlock, TableOfContents 等

### Task 8: 对齐 `testing-strategy.md`

**Files:**
- Modify: `docs/design/testing-strategy.md`

**改动项:**
1. TypeScript 类型检查目标：100% → 合理目标（strict: false 是已知约束）
2. E2E 路径表：补充 ABC 乐谱、code block Shiki 渲染、Content CQRS、API 契约

### Task 9: 对齐 `deployment-security.md`

**Files:**
- Modify: `docs/design/deployment-security.md`
- Reference: `backend/Dockerfile`, `deployments/kubernetes/base/api-deployment.yaml`

**改动项:**
1. Docker 构建策略：分步缓存 → `COPY . .` 一次性构建
2. Rust 版本：1.80 → 1.92-slim-bookworm
3. 补充：前端 Dockerfile 文档
4. 补充：worker, migrate, create_admin 二进制
5. 补充：HEALTHCHECK, dumb-init 记录
6. 探针路径：`/.well-known/live` → `/livez`, `/.well-known/ready` → `/readyz`
7. 补充：k3s securityContext 与 base K8s 配置的差异说明

### Task 10: 对齐 `media-handling.md`

**Files:**
- Modify: `docs/design/media-handling.md`
- Reference: `backend/crates/api/src/routes/media.rs`

**改动项:**
1. 上传路径：`/api/v1/upload` → `/admin/media/upload`
2. 补充：预签名上传方案（presign + finalize）
3. 分片上传：标注为"尚未实施"
4. 缩略图生成：标注为"尚未实施"
5. 病毒扫描：标注为"尚未实施"
6. WebP/AVIF 转换：标注为"尚未实施"
