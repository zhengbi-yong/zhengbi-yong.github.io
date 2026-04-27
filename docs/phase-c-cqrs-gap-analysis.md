# Phase C 差距分析：双轨制存储（CQRS）

## 现状总览

| 组件 | 状态 | 说明 |
|------|------|------|
| DB Schema | ✅ 完成 | `content_json` (JSONB) + `content_mdx` (TEXT)，GIN 索引 |
| `tiptap_json_to_mdx` | ✅ 完成 | 857行，39测试，支持22节点+8marks |
| `create_post` 写入 | ✅ 完成 | 存储 `content_json` + 派生 `content_mdx` |
| `update_post` 写入 | ✅ 完成 | 同上 |
| `get_post` 读取 | ✅ 完成 | `content` 从 `content_mdx` 解析，TipTap JSON→MDX 回退 |
| 前端博客页渲染 | ✅ 完成 | `source={post.content_mdx \|\| post.content \|\| ''}` |
| Admin 编辑器→后端 | ✅ 完成 | 发送 `content_json` (TipTap JSON) |
| `sanitize_post_content` | ✅ 完成 | Ammonia 白名单 sanitizer |

---

## 已发现 Gap

### Gap C1: `content_html` 字段空置 ✅ 已完成（2026-04-27）

**现状**：`content_html`（预渲染 HTML）在 API 返回中始终为 `null`。没有任何写入路径填充它。

**影响**：
- Admin UI 的 `PostDetail` 类型包含 `content_html: string | null`
- 未来可能有需要预渲染 HTML 的场景（如纯 HTML 邮件摘要）
- API 始终返回 `content_html: null` 是数据污染

**选项**：
- **选项 A（推荐）**：在 `create_post` / `update_post` 时，同步派生 `content_html`。在后端用 `ammonia` 将 `content_mdx` 转 HTML，存入 `content_html`。这样 admin 预览就有纯 HTML 可以用。
- **选项 B**：从 API 响应中彻底移除 `content_html` 字段（breaking change，需前端配合）

**推荐方案 A**，因为：
1. 不破坏现有 API 契约
2. 为 admin 预览提供 HTML 来源
3. 与 `sanitize_post_content` 的白名单兼容

---

### Gap C2: 无 Admin 预览 API ✅ 已完成（2026-04-27）

**现状**：Admin 后台没有实时预览接口。用户保存后才能看到最终效果。

**现状**：`new/page.tsx` 第 245 行有 `window.open('/admin/posts/preview/temp?...')` 的预览调用，但 `frontend/src/app` 下**不存在对应的路由文件**。预览功能实际上是不可用的。

**影响**：Admin 编辑器无法在不发布文章的情况下预览渲染效果。

**修复方案**：
1. 创建 `POST /api/v1/admin/posts/preview` API 端点，接受 TipTap JSON 或 MDX，返回 `{ html, source_type }`（经 `sanitize_post_content` 净化）
2. 前端预览改为调用此 API，在编辑区下方或 modal 中渲染

**验收**：
```bash
curl -X POST http://localhost:3000/api/v1/admin/posts/preview \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content_json":{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Test"}]}]}}'
# → {"html":"<h1>Test</h1>","source_type":"tiptap_json"}
```

---

### Gap C3: 前端 `content` 字段语义不清 ⚠️ LOW

**现状**：`get_post` 返回的 `content` 字段不是原始 markdown，而是经过 CQRS 解析后的"最终可用内容"（可能是 MDX）。

**规范意图 vs 现实**：

| 字段 | 规范意图 | 实际情况 |
|------|---------|---------|
| `content` | 原始 markdown（未来废弃） | 已解析的 MDX 或 TipTap JSON 转换结果 |
| `content_json` | TipTap JSON AST（Source of Truth） | ✅ 正确 |
| `content_mdx` | 预编译 MDX（SSR 直读缓存） | ✅ 正确 |

**影响**：前端某些地方用 `post.content`，某些地方用 `post.content_mdx`，语义混乱。

**修复方案**：
1. API 层面：`get_post` 返回的 `content` 改为"真相源兼容内容"（`content_mdx` 存在时为 MDX，不存在时为 `content_json` 转换结果）
2. 前端统一：`blog/post/[id]/page.tsx` 已使用 `content_mdx`，无需改动
3. Admin 端：考虑让 `content` 字段明确标注为"已废弃，请用 `content_mdx`"

---

### Gap C4: 前端 TypeScript 类型缺少 `content_mdx` ✅ 已完成（2026-04-27）

**现状**：`backend.ts` 中 `PostDetail` 已包含 `content_mdx` 和 `content_json` 字段，无需修改。

**现状**：`frontend/src/lib/types/backend.ts` 的 `PostDetail` 接口**缺少 `content_mdx` 字段**。前端使用 `post.content_mdx` 是类型安全的，但 TypeScript 不知道这个字段存在。

**影响**：TypeScript 类型不完整，可能在重构时引入错误。

**修复方案**：在 `PostDetail` 接口添加 `content_mdx?: string | null`。

---

### Gap C5: `tiptap_json_to_mdx` 覆盖度验证 ⚠️ LOW

**现状**：`tiptap_json_to_mdx` 有 39 个单元测试，但未覆盖的节点类型（如 `image`, `mention`, `video`, `callout`）的渲染质量未验证。

**影响**：特定节点类型保存→读取可能出现格式偏差。

**修复方案**：用 admin 编辑器发布一篇含所有节点类型的测试文章，通过 `get_post` API 读取，对比前后差异。

---

### Gap C6: 前端 `content_json` 类型定义不完整 ⚠️ LOW

**现状**：后端 `content_json` 是 `serde_json::Value`（任意 JSON），前端定义为 `Record<string, unknown> | null`。这个类型太宽泛。

**影响**：前端 `JSON.parse(content)` 假设 `content` 是字符串，但 `content_json` 传回时已是对象。

**说明**：这是前后端 JSON 序列化差异，不影响功能（前端实际接收时已经是对象）。

---

## 推荐执行顺序

```
Step 1: 修复 TypeScript 类型（Gap C4）
         → frontend/src/lib/types/backend.ts PostDetail 加 content_mdx

Step 2: 实现 Admin 预览 API（Gap C2）
         → POST /api/v1/admin/posts/preview
         → 接受 { content_json, content_mdx } → 返回净化后的 HTML 片段
         → Admin 编辑页面调用此 API

Step 3: 同步派生 content_html（Gap C1）
         → create_post / update_post 时用 ammonia 将 content_mdx 转 HTML
         → 存入 content_html 字段

Step 4: 前端 content 语义澄清（Gap C3，低优先级）
         → 可延后

Step 5: 全量验证
         → Vitest + Rust tests + pnpm build
         → Admin 编辑器发布测试文章（所有节点类型）
         → 验证 `content_mdx` 字段正确填充
         → 验证博客页渲染正常
```

---

## 技术细节

### Admin Preview API 设计

```
POST /api/v1/admin/posts/preview
Body: { content_json: TipTapJSON, content_mdx?: string }
Response: { html: string }  // 净化后的 HTML 片段

实现：
1. 如果有 content_mdx → 直接用
2. 否则 content_json → tiptap_json_to_mdx → MDX
3. 用 ammonia 净化 HTML 输出
4. 返回 { html }
```

### content_html 派生

```
在 create_post / update_post 事务中：
1. content_mdx 已派生完毕
2. 调用 remark → rehype 管道（或直接用 ammonia 从 content_mdx 生成）
3. sanitize_post_content(html) → content_html
4. 存入数据库

注意：这不是 MDX→HTML 的完整渲染（缺 Shiki 数学），
但对于纯文本预览足够用。
如需完整渲染，使用前端 compile API。
```

---

## 依赖关系

- Gap C2（Preview API）需要 Gap C1（content_html 派生）提供的 HTML 生成能力
- Gap C4（TypeScript）可以独立做
- 所有修改完成后需要全量测试

---

## 风险评估

| Gap | 风险 | 缓解 |
|-----|------|------|
| C1 content_html 派生 | 低 — 只在写入路径加一步 | 用现有 ammonia sanitizer |
| C2 Preview API | 中 — 新端点需鉴权 | 复用现有 BearerAuth 中间件 |
| C3 content 语义 | 低 — 只是文档澄清 | 延后处理 |
| C4 TypeScript | 极低 — 类型补全 | 直接加字段 |
