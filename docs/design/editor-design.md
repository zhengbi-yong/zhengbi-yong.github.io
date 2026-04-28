# 编辑器设计原则

> 来源：ultradesign_appendix.md、前端实践

## 选型理由

| 框架 | 核心优势 | 主要局限 |
|------|---------|---------|
| **TipTap (ProseMirror)** | 不可变状态、成熟插件生态、官方数学公式支持、AST 绝对掌控 | 打包体积较大 |
| Lexical | Meta 维护、React 19 深度整合 | 学习曲线陡峭 |
| Slate.js | 极致自由度 | 开发周期长 |

**采用 TipTap**：在"开发者自由度"与"开箱即用功能性"之间取得最佳平衡。

## CQRS 双轨存储

```
| 写入侧（Command Side）          读取侧（Query Side）
|┌──────────────────┐           ┌──────────────────┐
|│ TipTap editor    │           │ Next.js SSG       │
|│ editor.getJSON() │           │ MDX → HTML        │
|└────────┬─────────┘           └────────▲─────────┘
|         │                              │
|         ▼                              │
|┌──────────────────┐           ┌────────┴─────────┐
|│ content_json     │  前端同时   │ content_mdx      │
|│ (JSONB, NULLABLE)│ ──发送──→  │ (TEXT, NULLABLE) │
|│ 单一事实来源       │           │ 高效读取/分发     │
|└──────────────────┘           └──────────────────┘
```

- **`content_json` (JSONB)** — 写入侧单一事实来源（Single Source of Truth）。可为 `NULL`。
- **`content_mdx` (TEXT)** — 读取侧优化视图，供 SSR/SSG 直读。可为 `NULL`。
- 前端**客户端驱动双写模式**：前端计算 MDX（通过 `saveToMdx()`）并同时发送 `content_json`（TipTap JSON AST）和 `content_mdx`（MDX 文本）到后端。后端同时保存两者。
- 写入绝对安全，格式转换永不丢数据
- 未来可迁移：即使放弃 TipTap，MDX 依然是 Portable 标准格式
- **三级降级策略（读取侧 `get_post`）：** 优先使用 `content_json`（JSON AST）供编辑器加载，其次从 `content`（MDX）通过 `loadToEditor()` 转换为编辑器可识别格式。`content_mdx` 主要用于后端 SSG 渲染和迁移管线。

## 数学公式节点名

实际 TipTap 扩展注册的节点名为 `"blockMath"` 和 `"inlineMath"`（来自 `@tiptap/extension-mathematics`），而非旧文档中的 `"math"`。

```json
{
  "type": "blockMath",
  "attrs": { "latex": "E=mc^2" }
}
```

```json
{
  "type": "inlineMath",
  "attrs": { "latex": "E=mc^2" }
}
```

- 存储的永远是 **LaTeX 源码**（`attrs.latex`），不是渲染后图片或 HTML
- KaTeX 在视图层按需编译，60fps 实时更新
- 编辑器中显示 KaTeX 渲染结果，底层是纯净文本指令
- 双向 AST 转换：TipTap JSON ↔ markdown MDX 数学公式节点

## 三种存储格式比较

| 方案 | 优点 | 缺点 |
|------|------|------|
| 纯 HTML 序列化 | TTFB 短、SEO 友好 | 数学退化、重新加载损坏、XSS 风险 |
| JSON (ProseMirror AST) | 完整语义、JSONB 查询、Yjs 协作 | 与 TipTap 耦合、SSG 不能直接消费 |
| **MDX 纯文本** (推荐) | 框架解耦、Git 兼容、SSG 友好 | 需严密的三向转换工程 |

## TipTap → MDX 映射规则

| TipTap Node Type | MDX 输出格式 |
|-----------------|-------------|
| `inlineMath` (latex: "E=mc^2") | `$E=mc^2$` |
| `blockMath` (latex: "\begin{bmatrix}...") | `$$\n\begin{bmatrix}...\n$$` |

## 边界情况防护

1. **普通美元转义**：`$100` → `\$100`，避免误判为数学公式
2. **多行矩阵对齐**：`$$` 必须独占首尾行，保留所有 `\n`
3. **粘贴清洗**：前置 Paste Handler，剔除零宽字符、Base64 等非纯文本节点

## 待改造项

| 优先级 | 改造项 | 说明 |
|-------|--------|------|
| P0 | 正则量词修复 | `[\\s\\S]+` → `[\\s\\S]*`，支持空 math div |
| ✅ P1 | saveToMdx 参与数学还原 | 让 saveToMdx 在 turndown 后处理数学公式 — 已实现 |
| ✅ P1 | loadToEditor HTML 实体解码 | `data-latex="a&amp;b"` → `a&b` — 已实现 |
| P2 | Remark-prosemirror 集成 | 深层 AST 转换替代字符串拼接 |
|| ~~P2 | 双轨存储 Schema | 添加 content_mdx_sync 字段 — 已通过三级降级策略解决~~ |
| P3 | JSX 组件往返 | `<FadeIn>`, `<Callout>` 等双向映射 — 前端 MDXContentBridge 已部分处理占位符 |
|| 已解决 ✅ | 删除废弃 `articles`/`article_versions` 表 | 双轨存储已迁移到 `posts`/`post_versions`，旧表残留待清理 |
| 🐛 已知 Bug | InsertMathModal 使用 `'math'` 而非 `'blockMath'` | `InsertMathModal` 第 384 行 `node.type` 传的是 `'math'`，但后端 AST 转换期望 `'blockMath'`。后端映射表已用 `blockMath`，但前端模态框仍传旧名称，导致块级公式前端预览可能不匹配 |
