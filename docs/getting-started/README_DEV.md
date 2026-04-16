# README_DEV

Developer handoff and current work summary for this repository.

Last updated: 2026-04-03

## v2.3.0 Release (2026-04-03)

Homepage light/dark mode adaptation, footer unification, and bug fixes.

### Changes

1. **Light mode particle background** — ParticleBackground GLSL fragment shader now has dual rendering paths: additive blending with luminous glow in dark mode, normal blending with soft bokeh in light mode. Added `uIsDark` uniform and dynamic blending mode switching via `useFrame`.

   Modified files:
   - `frontend/src/components/home/ParticleBackground.tsx` — Added `uIsDark` uniform, conditional fragment shader, dynamic `THREE.AdditiveBlending` / `THREE.NormalBlending`

2. **Light mode custom cursor** — `mix-blend-difference` makes the cursor ring invisible on white backgrounds. Now conditionally applied only in dark mode.

   Modified files:
   - `frontend/src/components/home/CustomCursor.tsx` — `mix-blend-difference` class only when `isDark`

3. **MegaFooter light/dark mode** — Full-screen footer was always black (`bg-[#050508]`). Now adapts all colors (background, text, borders, separators) to the current theme.

   Modified files:
   - `frontend/src/components/home/MegaFooter.tsx` — Theme-aware background (`bg-[#fafafa]` light / `bg-[#050508]` dark), text colors, borders, separator gradients

4. **Homepage footer unification** — Homepage previously rendered both MegaFooter (from `Main.tsx`) and the default Footer (from layout). Layout now hides the default Footer when `pathname === '/'`, keeping only the full-screen MegaFooter.

   Modified files:
   - `frontend/src/app/(public)/layout.tsx` — Converted to client component, uses `usePathname()` to conditionally render `<Footer />`

5. **ICP filing in MegaFooter** — Added 备案信息 link (`京ICP备2025110798号-1`) to the MegaFooter bottom bar. Consolidated into the existing bottom bar section to maintain exact full-screen fit.

   Modified files:
   - `frontend/src/components/home/MegaFooter.tsx` — ICP link in bottom bar

6. **OSMD music sheet rendering fixes** — Music data file had bare filenames without `/musicxml/` prefix, causing 404s. `.mxl` files now pass URL directly to OSMD for internal fetch+decompress.

   Modified files:
   - `frontend/data/musicData.ts` — Fixed `src` paths to include `/musicxml/` prefix, reordered `.xml` tracks first
   - `frontend/src/components/home/MusicOSMDRenderer.tsx` — `.mxl` files use `osmd.load(url)` directly

7. **Latest Thoughts article link fix** — Article links had doubled `/blog/blog/...` paths because `toBlogLikePost()` already includes `blog/` prefix in `path`.

   Modified files:
   - `frontend/src/components/home/LatestWriting.tsx` — Changed `href={`/blog/${post.path}`}` to `href={`/${post.path}`}`

### Technical Notes

- ParticleBackground uses `THREE.NormalBlending` for light mode because `AdditiveBlending` makes particles invisible on white backgrounds (white + any color = white)
- Custom cursor uses `mix-blend-difference` only in dark mode because it inverts black to white, making the ring invisible on light backgrounds
- The `(public)/layout.tsx` was converted from server to client component to use `usePathname()`; this is a minimal change that only adds the `'use client'` directive and the pathname hook
- MegaFooter ICP filing is merged into the bottom bar (not a separate section) to maintain `min-h-screen` fit — footer height matches viewport exactly

---

## v2.2.0 Release (in progress — 2026-03-31)

Admin panel media library, types/API client foundation, and chemistry media support. Remaining phases (editor enhancement, user management, integration) tracked in `NEXT.md`.

### Changes

1. **Frontend types expanded** — Updated `MediaItem` with `original_filename`, `size_bytes`, `media_type`. Added types: `MediaDetail`, `MediaPresignUploadRequest`, `MediaPresignUploadResponse`, `FinalizeMediaUploadRequest`, `UpdateMediaRequest`, `MediaDownloadUrlResponse`, `MediaType` union. Added user types: `CreateUserRequest`, `UpdateUserRequest`, `UserDetail`. Added post fields: `is_featured`, `is_pinned`, `cover_image_id`, `layout`, `show_toc` to `PostDetail`/`PostListItem`.

   Modified files:
   - `frontend/src/lib/types/backend.ts`

2. **Admin API client expanded** — Added media methods: `uploadMedia()`, `presignUpload()`, `finalizeUpload()`, `getMediaById()`, `updateMedia()`, `getMediaDownloadUrl()`. Added user methods: `createUser()`, `getUserDetail()`, `updateUser()`, `suspendUser()`, `batchUpdateUserRoles()`, `batchDeleteUsers()`. Updated post methods to accept full field set.

   Modified files:
   - `frontend/src/lib/api/backend.ts`

3. **Backend: special media MIME types** — Extended `get_media_type()` classification to return `chemistry`, `3d-model`, `music-score` for new MIME types (`application/json`, `model/gltf-binary`, `model/gltf+json`, `application/xml`, `text/xml`).

   Modified files:
   - `backend/crates/api/src/routes/media.rs`

4. **Backend: chemistry media endpoint** — New `POST /admin/media/chemistry` handler accepting `{ smiles, name, description? }`. Stores SMILES JSON data as a file, creates media record with `media_type='chemistry'`.

   Modified files:
   - `backend/crates/api/src/routes/media.rs` — Added `ChemistryUploadRequest` struct and `create_chemistry_media` handler
   - `backend/crates/api/src/main.rs` — Added chemistry route

5. **Media library page rewrite** — Complete rewrite of `/admin/media` with:
   - Filter bar: media type dropdown, search input, upload button, grid/list toggle, "Show unused only" toggle
   - Drag-drop upload zone (direct for ≤10MB, presigned URL for >10MB) with progress bars
   - Responsive grid/list view with thumbnails for images, icons for non-image types
   - Detail dialog with preview, metadata editing (alt_text, caption), download URL, delete
   - Pagination with per-page selector
   - Batch select with bulk delete
   - Chemistry upload dialog (SMILES input + name/description)

   Modified files:
   - `frontend/src/app/admin/media/page.tsx` — Complete rewrite (~945 lines)

6. **MediaPickerModal component** — Reusable modal for selecting media from the library. Two tabs: "Library" (browse existing) and "Upload" (inline upload). Supports single and multi-select, type pre-filtering via `acceptTypes` prop, search and pagination.

   New files:
   - `frontend/src/components/media/MediaPickerModal.tsx`

### Technical Notes

- Backend compiles cleanly: `cargo check -p blog-api` passes
- TypeScript has known errors in `media/page.tsx` (unused imports, `alt_text`/`caption` not on `MediaItem`) and `MediaPickerModal.tsx` (unused import) — tracked in `NEXT.md`
- The `is_featured` column already exists in posts table (added in migration `20260116_enhance_posts_schema.sql`)
- Files >10MB use presigned URL flow: `presignUpload()` -> PUT to presigned URL -> `finalizeUpload()`

---

## v2.1.4 Release (2026-03-30)

Fix route conflict in admin posts that caused 500 errors.

### Changes

1. **Fixed [id] vs [slug] route conflict** — Next.js 16 does not allow different dynamic segment names at the same route level. `admin/posts/[id]/versions` and `admin/posts/[slug]/edit` coexisted, causing `Error: You cannot use different slug names for the same dynamic path ('id' !== 'slug')`.

   - Merged `[id]/versions` into `[slug]/versions`
   - Updated `versions/page.tsx` to use `params.slug` instead of `params.id`

   Modified files:
   - `frontend/src/app/admin/posts/[id]/versions/page.tsx` → `frontend/src/app/admin/posts/[slug]/versions/page.tsx` (renamed, param fix)

---

## v2.1.3 Release (2026-03-30)

This release adds a Team page, blog admin consolidation, and blog edit functionality.

### Changes

1. **Team page** — New `/team` page at the same level as Blog, Projects, and Music:
   - Advisor section: 2-column grid with avatar/initial + info (Newsreader serif name, amber accent role, research tags, contact links)
   - Team members section: 3-column responsive card grid (1 col mobile, 2 col tablet, 3 col desktop)
   - Round avatar with first-character fallback for missing images
   - Full dark mode support (zinc backgrounds, amber accents)
   - Research interest tags with border style

   New files:
   - `frontend/data/teamData.ts` — Team member data with 4 members (1 advisor, 1 lead, 2 members)
   - `frontend/src/app/team/page.tsx` — Team page component

   Modified files:
   - `frontend/data/headerNavLinks.ts` — Added `{ href: '/team', title: '团队' }` between projects and music
   - `frontend/src/components/Footer.tsx` — Added 团队 navigation link between 项目 and 音乐

2. **Blog admin consolidation** — Removed 2 duplicate post management pages and fixed the main management page:
   - Deleted `frontend/src/app/admin/posts-refine/` (Refine-based read-only view with `@ts-nocheck`)
   - Deleted `frontend/src/app/admin/posts-simple/` (hardcoded localhost URL)
   - Replaced `frontend/src/app/admin/posts/page.tsx` with redirect to `/admin/posts-manage`
   - Fixed `posts-manage/page.tsx` to use `adminService` API methods instead of raw `fetch`
   - Fixed admin sidebar to link to `/admin/posts-manage` instead of `/admin/posts`
   - Added `listAdminPosts()`, `createPost()`, `updatePost()` methods to `adminService` in `backend.ts`

3. **Blog edit page** — New `/admin/posts/[slug]/edit` page for editing existing posts:
   - Loads post data via `postService.getPost(slug)`
   - Rich text editing with TiptapEditor (dynamic import, SSR disabled)
   - Metadata editing via `ArticleMetadata` component (title, summary, category, tags)
   - Save as draft or publish directly
   - Current status indicator and last-updated timestamp

   New files:
   - `frontend/src/app/admin/posts/[slug]/edit/page.tsx`

### Technical Notes

- Team data is a static TypeScript array (not API-backed). To add/remove members, edit `frontend/data/teamData.ts`.
- The `TeamMember` interface supports optional fields: `nameEn`, `title`, `avatar`, `email`, `github`, `website`, `affiliation`, `research`.
- Avatar images use Next.js `Image` component with fixed dimensions (112px for advisor, 64px for members).
- The page uses `genPageMetadata` for SEO metadata.
- Blog admin now uses the canonical `adminService` (from `@/lib/api/backend`) for all API calls, eliminating raw `fetch` usage.
- The edit page uses Next.js 16 `use(params)` pattern for accessing params (params is a `Promise` in Next.js 16).

---

## v2.1.2 Release (2026-03-30)

This release unifies site-wide header/footer branding and removes redundant hero headers from list pages.

### Changes

1. **Great Vibes font for site logo** — Header and footer "Zhengbi Yong" logo text now uses the `Great Vibes` decorative script font instead of `Newsreader italic`.

   Modified files:
   - `frontend/src/app/layout.tsx` — Added `Great_Vibes` font via `next/font/google` with CSS variable `--font-great-vibes`
   - `frontend/src/components/header/HeaderOptimized.tsx` — Logo uses `style={{ fontFamily: 'var(--font-great-vibes)' }}` inline style (Tailwind arbitrary class doesn't work because Next.js hashes CSS variable names)
   - `frontend/src/components/Footer.tsx` — Footer logo uses `style={{ fontFamily: 'var(--font-great-vibes)' }}` inline style (same as header)

2. **Removed duplicate header from blog listing page** — `ApiBlogPage.tsx` previously rendered its own complete dark-mode header with navigation, duplicating the site-wide `HeaderOptimized` component already rendered by the root layout. Removed ~160 lines of redundant header code.

3. **Removed hero headers from list pages** — Blog list, Projects, and Music pages each had a large title/subtitle hero section (e.g., "技术博客" / "记录技术见解、学术思考与项目实践"). These are now removed. The site-wide header navigation already highlights the current page link, making the hero text redundant.

   Modified files:
   - `frontend/src/components/blog/ApiBlogPage.tsx` — Removed `<header>` hero block with "博客" / "技术博客" / category title and subtitle
   - `frontend/src/app/projects/page.tsx` — Removed `<PageTitle>` hero with "项目" / "研究和学术项目"
   - `frontend/src/app/music/page.tsx` — Removed `<PageTitle>` hero with "音乐" / "探索我的音乐作品和乐谱收藏"

### Technical Notes

- The Great Vibes font is loaded as a Google Font via `next/font/google` and registered as a CSS custom property on the `<html>` element.
- The header logo requires an inline `style` attribute because Next.js 16 hashes CSS variable class names (e.g., `--font-great-vibes` becomes `--font-great-vibes__variable_a10525` in Tailwind), making the Tailwind arbitrary value `font-[var(--font-great-vibes)]` unreliable. The inline `fontFamily` style resolves correctly because the CSS variable is registered at the DOM level.
- The header `getNavLinkClass(isActive)` function already handles current-page highlighting via `currentPath.startsWith(menu.href)`.
- The footer logo also requires the same inline `style` workaround as the header (Tailwind arbitrary class fails for the same reason).

4. **Redesigned music score detail page** — `FullscreenMusicSheet` component completely redesigned with a gallery-style UI inspired by high-end sheet music viewers:
   - Dark/light mode support via MutationObserver on DOM (portal renders outside React context)
   - Asymmetric metadata header with title (Newsreader serif), composer, and description
   - Score canvas with paper-like shadow (multi-layer box-shadow)
   - Thin vertical sidebar with zoom tool SVG icons
   - Minimal top bar with back navigation and zoom controls
   - New props: `composer`, `description` passed through from music detail page
   - Background gradient for light mode, dark surface for dark mode

   Modified files:
   - `frontend/src/components/FullscreenMusicSheet.tsx` — Complete UI rewrite, MutationObserver-based theme detection, new props
   - `frontend/src/app/music/[name]/page.tsx` — Pass `composer` and `description` from musicData

5. **Redesigned projects list page** — Editorial gallery layout inspired by high-end portfolio showcases:
   - Staggered 2-column grid (even items offset with `md:mt-24`)
   - Large aspect-[4/5] portrait images with hover zoom
   - Category/year labels in small uppercase tracking
   - Serif headlines with Newsreader font
   - Full dark mode support with amber accent colors
   - Hover state transitions on card backgrounds
   - "查看详情" links with underline hover animation
   - Added `category` and `year` fields to projectsData

   Modified files:
   - `frontend/src/app/projects/page.tsx` — Complete layout redesign
   - `frontend/data/projectsData.ts` — Added `category` and `year` fields, improved descriptions

6. **Redesigned music list page** — Gallery-style score library layout inspired by "The Great Hall" music score viewers:
   - 3-column responsive card grid (1 col mobile, 2 col tablet, 3 col desktop)
   - Aspect-[3/4] score preview areas with decorative staff lines and centered music note SVG icon
   - Category badge overlays (amber background) and difficulty badges (border style)
   - Composer and year metadata with separator
   - Instrument type labels in small uppercase amber tracking
   - Serif titles with Newsreader font
   - Full dark mode support with amber accent colors
   - Hover effects: shadow glow with amber tint, music note icon color transition
   - Bottom gradient overlay for depth
   - "查看乐谱 →" links in amber accent
   - Added `category`, `instrument`, `difficulty`, and `year` fields to musicData
   - Removed dependency on `MusicCard` component (layout now inline)
   - Improved descriptions for all three music entries

   Modified files:
   - `frontend/src/app/music/page.tsx` — Complete layout redesign, removed MusicCard import
   - `frontend/data/musicData.ts` — Added `category`, `instrument`, `difficulty` fields, enriched descriptions and added year data

---

## v2.1.1 Release (2026-03-30)

This release fixes TOC navigation issues in PostLayoutMonograph.

### Problem

The TOC navigation was unreliable because:
- TOC was extracted from raw markdown text using `extractTocFromContent()`
- MDX rendering may transform heading text (e.g., via custom components, KaTeX processing)
- This caused mismatches between TOC entries and actual DOM headings
- Some TOC entries like "制定固件版本" (half-sentences) couldn't match any DOM heading

### Solution

Changed PostLayoutMonograph to extract TOC directly from the rendered DOM:

1. Added `extractTocFromDOM()` function that:
   - Queries all h1-h6 headings from DOM after MDX rendering
   - Extracts heading text and ID (from rehype-slug)
   - Only includes h1 and h2 headings (depth <= 2)

2. TOC extraction happens 500ms after component mount to ensure MDX has rendered

3. Simplified click handling now uses direct ID lookup (no complex text matching needed)

4. Falls back to original `tocProp` if DOM extraction yields no results

### Modified Files

1. **frontend/src/components/layouts/PostLayoutMonograph.tsx**
   - Added `extractTocFromDOM()` helper function
   - Added `domToc` and `isTocReady` state
   - TOC now rendered from DOM-based extraction
   - Simplified click handler (ID-first lookup, text fallback)
   - Removed complex fuzzy matching strategies

2. **frontend/src/app/blog/[...slug]/DynamicPostPage.tsx**
   - Removed unused `defaultLayout` and `isLayoutKey`

---

## v2.1.0 Release (2026-03-30)

This release adds a new article detail page layout with improved TOC navigation.

### Key Features

- **PostLayoutMonograph**: New 3-column article detail layout with golden ratio proportions
  - Left column (16%): Metadata (author, date, reading time, tags)
  - Center column (68%): Article content with real BackendComments integration
  - Right column (16%): TOC navigation with active section highlighting
- **Real TOC Navigation**: Extracts h1/h2 headings from MDX content, adds rehype-slug for anchor IDs
- **Real Backend Integration**: Replaces template data with actual comments and related posts

### New Files

1. **frontend/src/components/layouts/PostLayoutMonograph.tsx**
   - 3-column layout with golden ratio proportions (16% | 68% | 16%)
   - Sticky TOC navigation with scroll-based active section highlighting
   - Reading progress bar
   - Real BackendComments integration
   - Related posts section

2. **frontend/src/lib/utils/extract-toc.ts**
   - Extracts TOC from MDX content
   - Filters to only h1 and h2 headings
   - Generates URL-safe anchor IDs

3. **frontend/src/styles/monograph-theme.css**
   - Monograph-style CSS variables and classes
   - Custom styling for article layout

### Modified Files

1. **frontend/src/lib/mdx-runtime.tsx**
   - Added rehype-slug plugin for heading anchor IDs

2. **frontend/src/app/layout.tsx**
   - Fixed `<link>` tag precedence error for Google Fonts

3. **frontend/src/app/blog/[...slug]/DynamicPostPage.tsx**
   - Force use PostLayoutMonograph layout
   - Extract TOC from article content

---

## v2.0.0 Release (2026-03-29)

This release consolidates all work since v1.8.2 into a stable baseline.

### Key Features Completed Since v1.8.2

- **Table Rendering**: Full table styling with dark mode support in both prose and non-prose contexts
- **Math Formula Rendering**: Custom KaTeX-based rendering for dynamic articles with HTML entity decoding, code block protection, and inline/block formula support
- **Admin Panel**: Post management with Tiptap editor, HTML-to-Markdown conversion, Giscus comment integration
- **UUID-based Article Slugs**: Unified slug format with title lookup index
- **API-backed Blog Runtime**: All blog pages (home, list, category, detail) use backend API as canonical source
- **Windows Native Dev Workflow**: PowerShell entrypoints, Contentlayer prebuild, Docker prebuilt-runner target
- **Backend Migrator**: Dedicated migration crate solving SQLx compile-time bootstrap issues
- **Docker Deployment**: Prebuilt-runner frontend image (~56.8MB backend), image streaming, fast remote refresh
- **Chemistry Visualization**: 3Dmol.js, RDKit.js with lazy loading and shared client-side loader
- **Monitoring**: Prometheus metrics, Grafana dashboards, Meilisearch search backend
- **Production Deployment**: Complete deployment pipeline with Nginx cutover, SSL, blog content sync

### Current Version

- VERSION file: `2.0.0`
- Frontend package: `2.0.0`
- Backend workspace: `2.0.0`

---

## Recent Changes (2026-03-27)

### Dynamic Article & Math Formula Rendering Fixes

**问题概述**：
- 动态创建的文章中数学公式无法渲染
- Tiptap 编辑器输出 HTML 而非 Markdown
- 静态 MDX 文件使用 remark/rehype 插件，但不兼容 next-mdx-remote 客户端渲染
- 评论系统配置缺失时显示空白

**解决方案**：
采用自定义数学公式渲染方案，而非 remark/rehype 插件。

**修改的文件**：

1. **frontend/src/lib/mdx-runtime.tsx**
   - 移除了 remark/rehype 插件（在客户端不兼容）
   - 添加 KatexRenderer 组件到 MDX 组件映射
   - 简化配置，避免 acorn 解析错误

2. **frontend/src/components/KatexRenderer.tsx** (新建)
   - 自定义数学公式渲染组件
   - 使用 KaTeX 直接渲染
   - 处理 HTML 实体解码
   - 支持行内和块级公式

3. **frontend/src/lib/mdx-runtime-normalize.ts**
   - 添加 convertMathFormulas 函数：将 `$...$` 和 `$$...$$` 转换为 `<KatexRenderer>` 组件
   - HTML 转义：避免公式中的引号破坏 HTML 属性
   - 保护代码块：避免处理代码块中的 `$` 符号
   - 支持跨行块级公式

4. **frontend/src/components/editor/TiptapEditor.tsx**
   - 添加 turndown 服务（HTML → Markdown 转换）
   - 在 onUpdate 回调中将 HTML 转换为 Markdown
   - 保留数学公式语法不被转义

5. **frontend/src/app/admin/posts/new/page.tsx**
   - 初始内容从 `'<p>开始写作...</p>'` 改为 `'开始写作...'`（Markdown 格式）

6. **frontend/src/components/Comments.tsx**
   - 添加 Giscus 配置验证
   - 配置缺失时显示友好的提示信息
   - 提供配置说明和链接

**数据库更改**：
- 文章内容现在保存为 Markdown 格式而非 HTML
- 示例：`行内公式测试：$E=mc^2$`

**测试验证**：
- ✅ 动态文章数学公式渲染正常
- ✅ 静态文章（从数据库）数学公式渲染正常
- ✅ 支持行内公式 `$...$` 和块级公式 `$$...$$`
- ✅ 代码块中的 `$` 符号不会被误转换
- ✅ 公式中包含引号也能正确渲染

**安装的新依赖**：
- `turndown@7.2.2` - HTML 到 Markdown 转换
- `@types/turndown@5.0.6` - TypeScript 类型定义

**环境变量**（可选）：
```bash
# Giscus 评论系统配置
NEXT_PUBLIC_GISCUS_REPO=zhengbi-yong/zhengbi-yong.github.io
NEXT_PUBLIC_GISCUS_REPOSITORY_ID=R_kgDOJ_xpA
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDOJ_xpM4CJuJs
```

---

## Purpose

This file tracks the current optimization work, the verified local development
paths, and the next recommended steps for contributors who continue from the
current branch state.

## Current Focus

The current workstream is improving native Windows development without breaking
the existing Unix-like workflows, and hardening the canonical Compose
deployment path so the same workspace can publish stable local images from
Windows.

## Completed In This Workstream

### Tooling and package management

- `pnpm` was installed and verified on Windows: `10.28.2`
- frontend `package.json` now uses Windows-safe commands for type generation and
  build orchestration
- frontend build on Windows falls back to webpack through
  [frontend/scripts/build/run-next-build.js](frontend/scripts/build/run-next-build.js)
- frontend dev on Windows now prebuilds Contentlayer before starting Next dev,
  which avoids the transient `.contentlayer` module-missing startup race that
  could surface as early `404` responses on `/`
- blog list and blog detail pages now use the backend API as the canonical
  runtime source in development, instead of mixing static Contentlayer list
  pages with database-backed detail pages
- home page and blog category detail pages now also use the backend API at
  runtime, so the public blog flow no longer depends on Contentlayer data for
  local development rendering

### Root development entrypoints

- added PowerShell entrypoints:
  - [start-dev.ps1](start-dev.ps1)
  - [start-backend.ps1](start-backend.ps1)
  - [start-frontend.ps1](start-frontend.ps1)
  - [start-worker.ps1](start-worker.ps1)
  - [sync-blog-content.ps1](sync-blog-content.ps1)
- `start-dev.ps1` now also supports `-Detached` so the full dev stack can be
  launched in the background for manual verification
- `start-dev.ps1` now triggers blog-content sync automatically after the backend
  becomes healthy when the post table is empty
- updated Unix shell entrypoints to use the new migration flow:
  - [start-dev.sh](start-dev.sh)
  - [start-backend.sh](start-backend.sh)

### Backend migration and startup flow

- added dedicated migrator crate:
  - [backend/crates/migrator/Cargo.toml](backend/crates/migrator/Cargo.toml)
  - [backend/crates/migrator/src/lib.rs](backend/crates/migrator/src/lib.rs)
  - [backend/crates/migrator/src/main.rs](backend/crates/migrator/src/main.rs)
- this fixes the old bootstrap problem where SQLx compile-time checks could
  block migrations on a fresh database
- the legacy command `cargo run --bin migrate` now delegates to the dedicated
  migrator and remains usable
- backend environment files were normalized to current runtime variable names:
  - [backend/.env](backend/.env)
  - [backend/.env.clean](backend/.env.clean)
  - [backend/.env.example](backend/.env.example)

### Windows-native validation

- added backend smoke scripts:
  - [backend/scripts/smoke-backend-start.ps1](backend/scripts/smoke-backend-start.ps1)
  - [backend/scripts/smoke-worker-start.ps1](backend/scripts/smoke-worker-start.ps1)
- added stack status helper:
  - [check-dev-stack.ps1](check-dev-stack.ps1)
- expanded Windows CI:
  - [.github/workflows/windows-native-ci.yml](.github/workflows/windows-native-ci.yml)
- CI now covers:
  - frontend install, type generation, smoke test, and build
  - backend migrations
  - `cargo check --workspace`
  - backend PowerShell smoke start
  - PowerShell syntax parsing for all current Windows entrypoints

### Runtime stability fixes

- visitor tracking is now disabled by default in development unless
  `NEXT_PUBLIC_ENABLE_VISITOR_TRACKING=true` is set; this avoids Next.js dev
  rebuild loops caused by writing visitor files under the frontend workspace
- service worker registration remains disabled by default in development, with
  explicit cleanup/unregister behavior
- Sentry client debug logging is now opt-in instead of always on in development
- i18n client debug logging is now opt-in instead of always on in development
- backend MDX sync now preserves nested path-based slugs such as
  `chemistry/rdkit-visualization`, creates tag/category relationships, ensures
  `post_stats` rows exist, and queues search rebuilds after sync
- frontend API proxy now preserves encoded nested slugs, forwards request bodies
  correctly, handles backend `204 No Content` responses, and strips invalid
  response encoding headers that previously caused
  `ERR_CONTENT_DECODING_FAILED` in the browser
- article layouts now normalize backend post payloads instead of assuming the
  old Contentlayer `path` shape, which fixes the `path.split(...)` crash on
  database-backed article pages
- database-backed MDX rendering now normalizes expression props before runtime
  serialization so components like `RDKitStructure`, `MoleculeFingerprint`, and
  `SimpleChemicalStructure` keep multi-line `data={\`...\`}` and numeric props
  such as `height={350}`, `radius={3}`, and `bits={1024}`
- 3D chemistry components now lazy-load `3dmol`, fetch file-backed structures,
  infer model formats, and render without the previous browser-side
  `createViewer` failure
- RDKit loading now goes through a shared client-side single-flight loader, so
  article pages no longer inject both `/rdkit-init.js` and
  `/chemistry/rdkit-init.js` during the same render flow
- RDKit 2D rendering now routes both SMILES and MOL/SDF payloads through the
  same normalized chemistry helper path, which fixes the old
  `Invalid MOL data` regression for ChemDraw-style database-backed article MDX
- backend article view tracking is now de-duplicated per browser session so
  React development remounts do not spam repeated `POST /view` requests
- home page content width was widened for laptop-sized viewports by increasing
  the main hero, social, hero-card, and newsletter container widths

### Compose deployment hardening

- frontend Docker now has a Windows-friendly `prebuilt-runner` target in
  [frontend/Dockerfile](frontend/Dockerfile) that packages an already-built
  `.next/standalone` output instead of re-running `pnpm install` inside Docker
- the `prebuilt-runner` image rewrites pnpm junction targets inside the image
  from Windows absolute paths such as `C:\\...\\node_modules\\.pnpm\\...` to
  container-local `/app/node_modules/.pnpm/...` symlinks, which fixes the
  previous `Cannot find module 'next'` and `Cannot find module
  'styled-jsx/package.json'` startup failures
- [frontend/.dockerignore](frontend/.dockerignore) now includes
  `.next/standalone`, `.next/static`, and `.contentlayer` so the prebuilt image
  path sends only the required runtime artifacts instead of the whole frontend
  workspace
- [scripts/deployment/build-all.sh](scripts/deployment/build-all.sh) now
  validates the frontend prebuilt runtime artifacts when
  `FRONTEND_DOCKER_TARGET=prebuilt-runner`
- [scripts/deployment/build-all.sh](scripts/deployment/build-all.sh) now
  auto-selects `FRONTEND_DOCKER_TARGET=prebuilt-runner` when host-built
  artifacts exist, and otherwise falls back to `runner`
- on Windows machines where `bash` resolves to an unavailable WSL install, run
  the canonical deployment scripts through Git Bash, for example
  `C:\Program Files\Git\bin\bash.exe`
- [scripts/deployment/build-all.sh](scripts/deployment/build-all.sh) now uses a
  local Swagger UI zip cache for backend builds only when
  `backend/swagger-ui-cache/v5.17.14.zip` is actually present; otherwise it
  falls back to the crate default download behavior instead of assuming the
  cache exists
- MinIO-backed backend startup now requires AWS Rust SDK behavior-version
  initialization; [backend/crates/api/src/storage.rs](backend/crates/api/src/storage.rs)
  now sets `aws_sdk_s3::config::BehaviorVersion::latest()` when constructing
  the S3/MinIO client
- backend Docker now has an explicit `local-runtime` stage that reuses the
  slim production runtime instead of packaging the full Rust builder toolchain;
  local `blog-backend:local` size dropped from about `1.59GB` to about `56.8MB`
- backend Docker Swagger UI handling now only exports
  `SWAGGER_UI_DOWNLOAD_URL` when it is non-empty, which avoids the previous
  `invalid SWAGGER_UI_DOWNLOAD_URL` panic path
- backend Docker apt source rewriting is now optional via
  `DEBIAN_APT_FORCE_HTTPS` (surfaced in build wrapper as
  `BACKEND_DEBIAN_APT_FORCE_HTTPS`), so unstable networks can keep default
  Debian sources
- backend Docker apt retry loops now self-heal transient broken package states
  with `apt-get -f install` and `dpkg --configure -a` before retrying
- [scripts/deployment/stream-local-images.sh](scripts/deployment/stream-local-images.sh)
  now compares local/remote image IDs and streams only changed images; unchanged
  images are skipped
- [scripts/deployment/deploy-compose-stack.sh](scripts/deployment/deploy-compose-stack.sh)
  now supports `--skip-infra` and `--services` for targeted app refreshes
- [scripts/deployment/deploy-remote-compose.sh](scripts/deployment/deploy-remote-compose.sh)
  now supports `--use-existing-env`, `--skip-infra`, and `--services`, enabling
  update deploys that reuse the existing remote `.env.production`
- added [scripts/deployment/refresh-remote-compose.sh](scripts/deployment/refresh-remote-compose.sh),
  a fast update path for existing servers that:
  - reuses remote `shared/.env.production`
  - streams only changed local images
  - restarts only affected services
  - defaults migration behavior to auto (run when backend image changed)
  - optionally cleans stale non-live compose projects on the remote host with
    `--cleanup-stale-projects` to avoid memory pressure from historical test
    stacks
- [scripts/deployment/cutover-system-nginx.sh](scripts/deployment/cutover-system-nginx.sh)
  now retries post-cutover public health checks before failing, which avoids
  false negatives during short warm-up windows
- deployment SSH flows now set explicit connect and keepalive timeouts, so
  hosts that accept TCP 22 but never return an SSH banner fail fast instead of
  hanging for a long time
- [.gitignore](.gitignore) now ignores
  `frontend/.docker-runtime` and `backend/swagger-ui-cache/` so deployment cache
  artifacts do not keep the worktree dirty

### Documentation updates

- updated:
  - [README.md](README.md)
  - [docs/quick-start.md](docs/quick-start.md)
  - [docs/getting-started/local-development-windows.md](docs/getting-started/local-development-windows.md)

## Verified Commands

The following commands were run successfully in the current workspace:

```powershell
pnpm --version
pnpm generate:types
pnpm exec vitest run tests/lib/api/resolveBackendApiBaseUrl.test.ts
pnpm build
pnpm exec tsc --noEmit --pretty false

docker build --build-arg APP_VERSION=1.8.2 --build-arg VCS_REF=local --build-arg BUILD_DATE=2026-03-27T00:00:00Z --build-arg NEXT_IGNORE_BUILD_ERRORS=1 --build-arg NEXT_IGNORE_ESLINT=1 --target prebuilt-runner -t blog-frontend:local -f frontend/Dockerfile frontend
docker run -d --name blog-frontend-smoke -p 13001:3001 -e NEXT_PUBLIC_BACKEND_URL=http://host.docker.internal:3000 -e NEXT_PUBLIC_API_URL=http://host.docker.internal:3000 blog-frontend:local
Invoke-WebRequest http://127.0.0.1:13001/

cargo check -p blog-api
docker build --build-arg APP_VERSION=1.8.2 --build-arg VCS_REF=local --build-arg BUILD_DATE=2026-03-27T00:00:00Z --build-arg SQLX_OFFLINE=false --build-arg DATABASE_URL=postgresql://blog_user:blog_password@host.docker.internal:5432/blog_db --build-arg SWAGGER_UI_DOWNLOAD_URL=file:///app/swagger-ui-cache/v5.17.14.zip --target local-runtime -t blog-backend:local -f backend/Dockerfile backend
docker image inspect blog-backend:local blog-frontend:local --format "{{.RepoTags}} {{.Id}} {{.Size}}"

powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Mode infra -NoInfra
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -IncludeWorker -Detached
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Mode frontend -NoInfra -Detached
powershell -ExecutionPolicy Bypass -File .\check-dev-stack.ps1
powershell -ExecutionPolicy Bypass -File .\sync-blog-content.ps1
powershell -ExecutionPolicy Bypass -File .\backend\scripts\smoke-backend-start.ps1
powershell -ExecutionPolicy Bypass -File .\backend\scripts\smoke-worker-start.ps1

cd backend
cargo run -p blog-migrator
cargo run --bin migrate
cargo check --workspace
```

The following local endpoints were also manually verified from this workspace on
2026-03-26:

- frontend home: `http://127.0.0.1:3001`
- frontend blog list: `http://127.0.0.1:3001/blog`
- frontend blog category: `http://127.0.0.1:3001/blog/category/chemistry`
- frontend blog detail: `http://127.0.0.1:3001/blog/chemistry/rdkit-visualization`
- frontend search: `http://127.0.0.1:3001/search`
- frontend admin shell: `http://127.0.0.1:3001/admin`
- backend health: `http://127.0.0.1:3000/healthz`
- backend posts API: `http://127.0.0.1:3000/api/v1/posts`
- Meilisearch health: `http://127.0.0.1:7700/health`
- MinIO console: `http://127.0.0.1:9001`

Browser-level verification in this workstream included:

- home page opens successfully and the main content width now occupies roughly
  `1216px / 1280px` on a standard laptop-sized viewport
- blog category page opens successfully with API-backed data and no new runtime
  console errors
- nested-slug article page
  `chemistry/rdkit-visualization` opens successfully with no runtime console
  errors; the previous `path.split(...)`, `zustand create(...)`, `204 proxy`,
  and MDX chemistry rendering regressions were all cleared
- the `blog-frontend:local` prebuilt image now starts successfully on Windows
  and returns `200` on `http://127.0.0.1:13001/`
- the `blog-backend:local` image rebuilt successfully after the MinIO/S3
  behavior-version fix

## Recommended Local Workflows

### Windows

Start infra only:

```powershell
docker compose -f deployments/docker/compose-files/dev/docker-compose.yml up -d
```

Start frontend + backend:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Start frontend + backend + worker:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -IncludeWorker
```

Start everything in the background:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -IncludeWorker -Detached
```

Sync blog content into the database manually:

```powershell
powershell -ExecutionPolicy Bypass -File .\sync-blog-content.ps1
powershell -ExecutionPolicy Bypass -File .\sync-blog-content.ps1 -Force
```

Run backend smoke validation:

```powershell
powershell -ExecutionPolicy Bypass -File .\backend\scripts\smoke-backend-start.ps1
powershell -ExecutionPolicy Bypass -File .\backend\scripts\smoke-worker-start.ps1
```

Check the stack status:

```powershell
powershell -ExecutionPolicy Bypass -File .\check-dev-stack.ps1
```

Manual verification URLs:

```text
Frontend:        http://localhost:3001
Search:          http://localhost:3001/search
Admin:           http://localhost:3001/admin
Backend health:  http://localhost:3000/healthz
Backend API:     http://localhost:3000
Meilisearch:     http://localhost:7700
MinIO API:       http://localhost:9000
MinIO console:   http://localhost:9001
```

Build Windows-local deployment images without re-installing frontend
dependencies inside Docker:

```powershell
$env:FRONTEND_DOCKER_TARGET='prebuilt-runner'
& 'C:\Program Files\Git\bin\bash.exe' scripts/deployment/build-all.sh
```

Fast update deploy to an already-provisioned remote Compose host:

```powershell
& 'C:\Program Files\Git\bin\bash.exe' scripts/deployment/refresh-remote-compose.sh --target ubuntu@152.136.43.194 --remote-dir /home/ubuntu/blog-platform-live --identity-file /c/Users/Sisyphus/.ssh/zhengbi_prod_ed25519
```

### Direct Rust commands

```powershell
cd backend
cargo run -p blog-migrator
cargo run -p blog-api --bin api
cargo run -p blog-worker --bin worker
```

## Known Gaps

- the full frontend test suite still has pre-existing failures outside the new
  Windows workstream
- many old secondary docs still mention outdated backend commands and need a
  broader cleanup pass
- the repository still carries both root and `backend/` environment files, which
  is workable now but should eventually be simplified
- development still shows some framework-level warnings unrelated to the core
  blog flow, mainly the current Sentry App Router setup warnings and the Next.js
  `allowedDevOrigins` heads-up
- on low-memory hosts (for example 4GB RAM), stale parallel compose projects
  can still cause avoidable instability unless they are cleaned regularly; use
  `refresh-remote-compose.sh --cleanup-stale-projects` during maintenance

## Recommended Next Steps

1. Continue cleaning outdated docs that still mention `sqlx migrate run`,
   `cargo run`, or legacy backend env variable names.
2. Add a lightweight frontend smoke assertion for `/`, `/search`, and `/admin`
   so CI catches route regressions after the Windows startup path succeeds.
3. Prefer the fast remote update path for day-2 changes:
   `C:\Program Files\Git\bin\bash.exe scripts/deployment/refresh-remote-compose.sh --target ubuntu@152.136.43.194 --remote-dir /home/ubuntu/blog-platform-live --identity-file /c/Users/Sisyphus/.ssh/zhengbi_prod_ed25519`
4. Use `--build-local-images` for one-command local-build + remote-update
   refreshes, and `--image blog-frontend:local` for frontend-only updates.
5. For resource-constrained servers, include stale stack cleanup during refresh:
   `C:\Program Files\Git\bin\bash.exe scripts/deployment/refresh-remote-compose.sh --target ubuntu@152.136.43.194 --remote-dir /home/ubuntu/blog-platform-live --identity-file /c/Users/Sisyphus/.ssh/zhengbi_prod_ed25519 --cleanup-stale-projects`
6. Keep system nginx aligned with the active compose edge after major env/port
   changes:
   `C:\Program Files\Git\bin\bash.exe scripts/deployment/cutover-system-nginx.sh --target ubuntu@152.136.43.194 --remote-dir /home/ubuntu/blog-platform-live --identity-file /c/Users/Sisyphus/.ssh/zhengbi_prod_ed25519`
7. Add worker startup smoke coverage to any non-Windows validation path if the
   team wants parity across platforms.
8. Decide whether to keep both root `.env` and `backend/.env` long-term, or
   consolidate around one canonical local runtime env file.
9. Triage the existing frontend test failures so native Windows CI can grow from
   smoke coverage to broader test coverage.
10. Clean up the remaining Sentry and `allowedDevOrigins` development warnings so
   the console stays focused on real regressions during manual QA.

## Change Hotspots

If you continue this work, the most relevant files are:

- [frontend/package.json](frontend/package.json)
- [frontend/src/app/page.tsx](frontend/src/app/page.tsx)
- [frontend/src/app/Main.tsx](frontend/src/app/Main.tsx)
- [frontend/src/app/api/v1/[...path]/route.ts](frontend/src/app/api/v1/[...path]/route.ts)
- [frontend/src/app/blog/category/[category]/page.tsx](frontend/src/app/blog/category/[category]/page.tsx)
- [frontend/src/app/blog/category/[category]/ApiCategoryPage.tsx](frontend/src/app/blog/category/[category]/ApiCategoryPage.tsx)
- [frontend/src/components/layouts/PostLayout.tsx](frontend/src/components/layouts/PostLayout.tsx)
- [frontend/src/components/layouts/postLayoutContent.ts](frontend/src/components/layouts/postLayoutContent.ts)
- [frontend/src/components/RecentArticles.tsx](frontend/src/components/RecentArticles.tsx)
- [frontend/src/components/chemistry/runtimeProps.ts](frontend/src/components/chemistry/runtimeProps.ts)
- [frontend/src/components/chemistry/threeDmol.ts](frontend/src/components/chemistry/threeDmol.ts)
- [frontend/src/lib/mdx-runtime.tsx](frontend/src/lib/mdx-runtime.tsx)
- [frontend/src/lib/mdx-runtime-normalize.ts](frontend/src/lib/mdx-runtime-normalize.ts)
- [frontend/src/lib/adapters/backend-posts.ts](frontend/src/lib/adapters/backend-posts.ts)
- [frontend/scripts/generate/generate-api-types.js](frontend/scripts/generate/generate-api-types.js)
- [frontend/scripts/build/run-next-build.js](frontend/scripts/build/run-next-build.js)
- [backend/crates/migrator/src/lib.rs](backend/crates/migrator/src/lib.rs)
- [backend/crates/api/src/runtime.rs](backend/crates/api/src/runtime.rs)
- [backend/crates/api/src/storage.rs](backend/crates/api/src/storage.rs)
- [backend/Dockerfile](backend/Dockerfile)
- [backend/scripts/load-env.ps1](backend/scripts/load-env.ps1)
- [backend/scripts/smoke-backend-start.ps1](backend/scripts/smoke-backend-start.ps1)
- [backend/scripts/smoke-worker-start.ps1](backend/scripts/smoke-worker-start.ps1)
- [start-dev.ps1](start-dev.ps1)
- [start-worker.ps1](start-worker.ps1)
- [check-dev-stack.ps1](check-dev-stack.ps1)
- [scripts/deployment/build-all.sh](scripts/deployment/build-all.sh)
- [scripts/deployment/stream-local-images.sh](scripts/deployment/stream-local-images.sh)
- [scripts/deployment/deploy-remote-compose.sh](scripts/deployment/deploy-remote-compose.sh)
- [scripts/deployment/deploy-compose-stack.sh](scripts/deployment/deploy-compose-stack.sh)
- [scripts/deployment/refresh-remote-compose.sh](scripts/deployment/refresh-remote-compose.sh)
- [.github/workflows/windows-native-ci.yml](.github/workflows/windows-native-ci.yml)

## Complete New Server Deployment Guide

This section provides a complete, end-to-end guide for deploying the blog platform to a new server. Follow these steps to ensure a successful deployment with all content accessible.

### Prerequisites

**Local Machine:**
- Git repository cloned
- SSH access to target server
- Docker and Docker Compose installed (for building images locally)

**Target Server:**
- Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- SSH key access configured
- Minimum 2GB RAM, 10GB disk space
- Ports 80, 443 available (for web traffic)

### Step-by-Step Deployment Process

#### Step 1: Prepare Local Environment

```bash
# Navigate to project directory
cd C:/Users/Sisyphus/Documents/private/zhengbi-yong.github.io

# Ensure you're on the correct branch
git checkout main
git pull origin main

# Verify deployments/docker/compose-files/prod/docker-compose.yml has FRONTEND_BLOG_DIR configured
grep -q "FRONTEND_BLOG_DIR" deployments/docker/compose-files/prod/docker-compose.yml && echo "✓ Configured" || echo "✗ Missing FRONTEND_BLOG_DIR"
```

#### Step 2: Build Docker Images Locally

**Option A: Using Build Script (Recommended)**

```bash
# On Windows, use Git Bash
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/build-all.sh

# This will:
# - Build backend with production target
# - Build frontend with prebuilt-runner target
# - Tag images as blog-backend:local and blog-frontend:local
```

**Option B: Manual Build**

```bash
# Build backend
docker build --target production -t blog-backend:local -f backend/Dockerfile backend

# Build frontend (first build the Next.js app)
cd frontend
pnpm build

# Then build the Docker image
cd ..
docker build --target prebuilt-runner -t blog-frontend:local -f frontend/Dockerfile frontend
```

#### Step 3: Bootstrap Remote Server

```bash
# Run the bootstrap script
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/bootstrap-remote-host.sh \
  --target ubuntu@<SERVER_IP> \
  --remote-dir /home/ubuntu/blog-platform-live

# For production server:
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/bootstrap-remote-host.sh \
  --target ubuntu@152.136.43.194 \
  --remote-dir /home/ubuntu/blog-platform-live

# This will:
# - Create directory structure
# - Set up environment files
# - Configure SSH access
# - Prepare Docker Compose configuration
```

#### Step 4: Stream Images to Remote Server

```bash
# Stream all local images to remote
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/stream-local-images.sh \
  --target ubuntu@<SERVER_IP>

# For production server:
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/stream-local-images.sh \
  --target ubuntu@152.136.43.194

# This will:
# - Transfer blog-backend:local and blog-frontend:local
# - Load images into remote Docker daemon
# - Verify image integrity
```

#### Step 5: Deploy Stack to Remote Server

```bash
# Deploy the complete stack
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/deploy-remote-compose.sh \
  --target ubuntu@<SERVER_IP> \
  --use-existing-env

# For production server:
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/deploy-remote-compose.sh \
  --target ubuntu@152.136.43.194 \
  --use-existing-env

# This will:
# - Start all services (postgres, redis, api, worker, frontend, etc.)
# - Run database migrations
# - Wait for health checks
# - Verify deployment success
```

#### Step 6: Sync Blog Content to Database

**CRITICAL STEP**: Without this, your blog will have no posts!

```bash
# Run the automated blog sync script
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/sync-remote-blog.sh \
  --target ubuntu@<SERVER_IP> \
  --force

# For production server:
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/sync-remote-blog.sh \
  --target ubuntu@152.136.43.194 \
  --force

# This will:
# - Copy blog files from frontend/data/blog to remote server
# - Copy files into API container at /app/data/blog
# - Trigger MDX sync API to import posts into database
# - Verify posts are imported successfully
# - Clean up temporary files
```

**Manual Sync Alternative** (if script fails):

```bash
# 1. Copy blog files to remote
cd frontend
scp -i ~/.ssh/zhengbi_prod_ed25519 -r data/blog ubuntu@<SERVER_IP>:/tmp/blog-sync/

# 2. Copy into API container
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@<SERVER_IP> \
  "docker cp /tmp/blog-sync/blog blog-platform-live-api-1:/app/data/"

# 3. Trigger sync
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@<SERVER_IP> \
  'docker exec blog-platform-live-api-1 curl -s -X POST http://localhost:3000/api/v1/sync/mdx/public \
  -H "Content-Type: application/json" -d "{\"force\": true}"'

# 4. Verify posts
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@<SERVER_IP> \
  "docker exec blog-platform-live-api-1 curl -s http://localhost:3000/api/v1/posts | \
  python3 -c 'import sys, json; data=json.load(sys.stdin); print(f\"Posts: {data.get(\"total\", 0)}\")'"

# 5. Clean up
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@<SERVER_IP> "rm -rf /tmp/blog-sync"
```

#### Step 7: Configure Nginx Reverse Proxy (Optional but Recommended)

If you want Nginx as the front-end reverse proxy:

```bash
# Run the Nginx cutover script
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/cutover-system-nginx.sh \
  --target ubuntu@<SERVER_IP> \
  --edge-port 18082

# For production server:
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/cutover-system-nginx.sh \
  --target ubuntu@152.136.43.194 \
  --edge-port 18082

# This will:
# - Configure Nginx as reverse proxy
# - Set up SSL certificates (if certbot is available)
# - Configure proper routing
# - Restart Nginx service
```

#### Step 8: Verify Deployment

```bash
# Check all containers are running
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@<SERVER_IP> \
  "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Check backend health
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@<SERVER_IP> \
  "docker exec blog-platform-live-api-1 curl -s http://localhost:3000/livez"

# Check frontend is serving
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@<SERVER_IP> \
  "curl -s -I http://localhost:3001/ | head -5"

# Verify posts in database
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@<SERVER_IP> \
  "docker exec blog-platform-live-api-1 curl -s http://localhost:3000/api/v1/posts | \
  python3 -c 'import sys, json; data=json.load(sys.stdin); print(f\"Total posts: {data.get(\"total\", 0)}\")'"

# Test from local machine
curl -I http://<SERVER_IP>/
```

### Quick Reference: One-Command Deployment

For experienced users, here's the complete deployment in one go:

```bash
# Set your server IP
export SERVER_IP="152.136.43.194"

# Complete deployment pipeline
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/build-all.sh && \
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/bootstrap-remote-host.sh --target ubuntu@${SERVER_IP} && \
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/stream-local-images.sh --target ubuntu@${SERVER_IP} && \
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/deploy-remote-compose.sh --target ubuntu@${SERVER_IP} --use-existing-env && \
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/sync-remote-blog.sh --target ubuntu@${SERVER_IP} --force && \
echo "✓ Deployment complete! Verify at http://${SERVER_IP}/"
```

### Troubleshooting New Server Deployment

**Issue: Containers fail to start**
```bash
# Check logs
ssh ubuntu@<SERVER_IP> "cd /home/ubuntu/blog-platform-live/current && docker compose logs"

# Verify images exist
ssh ubuntu@<SERVER_IP> "docker images | grep blog-"

# Check environment variables
ssh ubuntu@<SERVER_IP> "cat /home/ubuntu/blog-platform-live/shared/.env.production"
```

**Issue: Database migrations fail**
```bash
# Re-run migrations manually
ssh ubuntu@<SERVER_IP> \
  "cd /home/ubuntu/blog-platform-live/current && \
  docker compose --env-file /home/ubuntu/blog-platform-live/shared/.env.production \
  run --rm migrate"
```

**Issue: Blog sync fails with "Directory not found"**
```bash
# Verify FRONTEND_BLOG_DIR is set
ssh ubuntu@<SERVER_IP> \
  "docker exec blog-platform-live-api-1 env | grep FRONTEND_BLOG_DIR"

# Should output: FRONTEND_BLOG_DIR=/app/data/blog

# If not set, add to deployments/docker/compose-files/prod/docker-compose.yml and restart API
```

**Issue: Frontend shows "Loading..." but no posts**
```bash
# Check if posts exist in database
ssh ubuntu@<SERVER_IP> \
  "docker exec blog-platform-live-postgres-1 psql -U blog_user -d blog_db -c 'SELECT COUNT(*) FROM posts;'"

# If count is 0, re-run blog sync (Step 6)
```

### Post-Deployment Checklist

- [ ] All 9 containers running (postgres, redis, api, worker, frontend, meilisearch, minio, mailpit, edge)
- [ ] All health checks passing
- [ ] Backend API responding: `curl http://<SERVER_IP>:14100/healthz`
- [ ] Frontend serving: `curl -I http://<SERVER_IP>:14101/`
- [ ] Posts in database: Check count > 0
- [ ] Blog page accessible: http://<SERVER_IP>/blog
- [ ] Individual posts load without errors
- [ ] No chunk load errors in browser console
- [ ] Nginx reverse proxy configured (if applicable)
- [ ] SSL certificates valid (if applicable)

### Rolling Back

If deployment fails, you can quickly rollback:

```bash
# Stop all services
ssh ubuntu@<SERVER_IP> \
  "cd /home/ubuntu/blog-platform-live/current && \
  docker compose --env-file /home/ubuntu/blog-platform-live/shared/.env.production down"

# Remove containers and volumes (CAUTION: This deletes data!)
ssh ubuntu@<SERVER_IP> \
  "cd /home/ubuntu/blog-platform-live/current && \
  docker compose --env-file /home/ubuntu/blog-platform-live/shared/.env.production down -v"

# Re-deploy previous version
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/deploy-remote-compose.sh \
  --target ubuntu@<SERVER_IP> \
  --use-existing-env
```

## Remote Deployment Verification

### Prerequisites
- SSH access configured (key: `~/.ssh/zhengbi_prod_ed25519`)
- Target server: `ubuntu@152.136.43.194`
- Remote directory: `/home/ubuntu/blog-platform-live`

### Quick Service Status Check

```bash
# Check all container statuses
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Check system resources
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 "free -h && df -h / | tail -1"

# Check service health endpoints
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 "curl -s http://localhost:14100/healthz && echo 'Backend: OK'"
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 "curl -s http://localhost:14101/ | head -5 && echo 'Frontend: OK'"
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 "curl -s http://localhost:18082/ | head -5 && echo 'Edge: OK'"
```

### Blog Content Synchronization

**Important**: After deploying to a new server or after database reset, you must sync blog content from `frontend/data/blog` to the database.

#### Manual Sync Process (Recommended for Production)

```bash
# 1. Copy blog files to remote server
cd frontend
scp -i ~/.ssh/zhengbi_prod_ed25519 -r -o StrictHostKeyChecking=no \
  data/blog ubuntu@152.136.43.194:/tmp/blog-sync/

# 2. Copy files into API container
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 \
  "docker cp /tmp/blog-sync/blog blog-platform-live-api-1:/app/data/"

# 3. Trigger MDX sync API
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 \
  'docker exec blog-platform-live-api-1 curl -s -X POST http://localhost:3000/api/v1/sync/mdx/public \
  -H "Content-Type: application/json" -d "{\"force\": true}"'

# 4. Verify posts in database
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 \
  "docker exec blog-platform-live-api-1 curl -s http://localhost:3000/api/v1/posts | \
  python3 -c 'import sys, json; data=json.load(sys.stdin); print(f\"Posts: {data.get(\"total\", 0)}\")'"

# 5. Clean up temporary files
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 "rm -rf /tmp/blog-sync"
```

#### Automated Sync Script

```bash
# Run the automated sync script
cd C:/Users/Sisyphus/Documents/private/zhengbi-yong.github.io
"C:\Program Files\Git\bin\bash.exe" scripts/deployment/sync-remote-blog.sh
```

### Required Configuration for Blog Sync

**1. Environment Variable (deployments/docker/compose-files/prod/docker-compose.yml)**
```yaml
x-backend-environment: &backend-environment
  # ... other variables ...
  FRONTEND_BLOG_DIR: ${FRONTEND_BLOG_DIR:-/app/data/blog}
```

**2. Container Volume Mount**
The blog files must be copied into the container at `/app/data/blog` since the production deployment does not mount this directory by default.

**3. API Permissions**
The sync endpoint `/api/v1/sync/mdx/public` must be accessible without authentication for initial setup.

### Deployment Verification Checklist

After deployment, verify all services:

```bash
# Container Status
- [ ] All containers running (9 services)
- [ ] All health checks passing
- [ ] No containers restarting frequently

# Backend API
- [ ] Health check: `curl http://localhost:14100/healthz`
- [ ] Posts API: `curl http://localhost:14100/api/v1/posts` returns posts
- [ ] No errors in backend logs: `docker logs blog-platform-live-api-1 --tail 50`

# Frontend
- [ ] Home page loads: `curl -I http://localhost:14101/`
- [ ] Blog page loads: `curl -I http://localhost:14101/blog`
- [ ] No chunk load errors in browser console
- [ ] All static assets accessible

# Database
- [ ] PostgreSQL healthy: `docker exec blog-platform-live-postgres-1 pg_isready -U blog_user`
- [ ] Posts table populated: `docker exec blog-platform-live-postgres-1 psql -U blog_user -d blog_db -c 'SELECT COUNT(*) FROM posts'`
- [ ] All migrations applied: Check backend logs for "Database migrations verified successfully"

# Infrastructure
- [ ] Nginx running: `sudo systemctl status nginx`
- [ ] System resources adequate: Free memory > 1GB, disk < 80%
- [ ] No error logs in `/var/log/nginx/error.log`

### Common Issues and Solutions

**1. Chunk Load Error (Frontend)**
- **Symptom**: Browser console shows `Failed to load chunk ...js` 404 errors
- **Cause**: Frontend build is outdated or mismatched
- **Solution**: Rebuild frontend locally and redeploy
  ```bash
  cd frontend
  pnpm build
  # Then redeploy using refresh-remote-compose.sh
  ```

**2. No Posts in Database**
- **Symptom**: Blog list page is empty or shows "Loading..."
- **Cause**: Blog content not synced to database
- **Solution**: Run the blog sync process (see above)

**3. API Returns 500/502 Errors**
- **Symptom**: Backend API returns errors
- **Cause**: Database connection issues or missing migrations
- **Solution**:
  - Check database connectivity: `docker exec blog-platform-live-postgres-1 pg_isready -U blog_user`
  - Restart API container: `docker restart blog-platform-live-api-1`
  - Check logs: `docker logs blog-platform-live-api-1 --tail 100`

**4. Environment Variable Not Set**
- **Symptom**: Sync API returns "Directory not found: ../frontend/data/blog"
- **Cause**: `FRONTEND_BLOG_DIR` not set in environment
- **Solution**:
  - Add to `deployments/docker/compose-files/prod/docker-compose.yml`: `FRONTEND_BLOG_DIR: ${FRONTEND_BLOG_DIR:-/app/data/blog}`
  - Restart API container

### Monitoring Commands

```bash
# Real-time container monitoring
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 \
  "docker stats --no-stream"

# Container resource usage
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 \
  "docker ps --format '{{.Names}}: {{.Status}}'"

# Recent logs from all services
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 \
  "docker ps -q | xargs -I {} sh -c 'echo {} && docker logs --tail 20 {}'"

# System load average
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 "uptime"

# Disk usage
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 "df -h / | tail -1"
```

### Emergency Procedures

**Restart All Services**
```bash
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 \
  "cd /home/ubuntu/blog-platform-live/current && \
  docker compose --env-file /home/ubuntu/blog-platform-live/shared/.env.production restart"
```

**View Container Logs**
```bash
# All services
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 \
  "cd /home/ubuntu/blog-platform-live/current && \
  docker compose --env-file /home/ubuntu/blog-platform-live/shared/.env.production logs --tail=100"

# Specific service
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 \
  "docker logs blog-platform-live-api-1 --tail 100 -f"
```

**Rollback to Previous Deployment**
```bash
# List available releases
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 \
  "ls -lht /home/ubuntu/blog-platform-live/releases/ | head -5"

# Switch to previous release
ssh -i ~/.ssh/zhengbi_prod_ed25519 ubuntu@152.136.43.194 \
  "cd /home/ubuntu/blog-platform-live && \
  ln -sfn releases/<PREVIOUS_RELEASE> current && \
  cd current && \
  docker compose --env-file /home/ubuntu/blog-platform-live/shared/.env.production up -d"
```

### Service URLs

**Local (development):**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Meilisearch: http://localhost:7700
- MinIO Console: http://localhost:9001

**Production (remote):**
- Frontend: http://152.136.43.194 (via Nginx)
- Backend API: http://152.136.43.194:14100
- Frontend Direct: http://152.136.43.194:14101
- Edge Proxy: http://152.136.43.194:18082
