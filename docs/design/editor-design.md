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
│ TipTap editor    │           │ Next.js SSG       │
│ editor.getJSON() │           │ MDX → HTML        │
└────────┬─────────┘           └────────▲─────────┘
         │                              │
         ▼                              │
┌──────────────────┐           ┌────────┴─────────┐
│ content_json     │  自动派生  │ content_mdx      │
│ (JSONB, NULLABLE)│ ────────→ │ (TEXT, NULLABLE) │
│ 单一事实来源       │           │ 高效读取/分发     │
└──────────────────┘           └──────────────────┘
```

- **`content_json` (JSONB)** — 写入侧单一事实来源（Single Source of Truth）。可为 `NULL`，后端三级降级策略：`content_mdx` → 从 `content_json` 实时转换 → 旧 `content` 列
- **`content_mdx` (TEXT)** — 读取侧优化视图，供 SSR/SSG 直读。可为 `NULL`，后端根据 `content_json` 自动派生
- 写入绝对安全，格式转换永不丢数据
- 未来可迁移：即使放弃 TipTap，MDX 依然是 Portable 标准格式

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

## 快捷键 (Keyboard Shortcuts)

编辑器工具栏存在两套实现，均定义了快捷键映射，使用 `Ctrl` (Windows/Linux) / `Cmd` (macOS) 组合键：

1. **内联工具栏** — 在 `TiptapEditor.tsx` 内定义的 `Toolbar` 组件，直接在按钮的 `title` 属性中嵌入快捷键提示（如 `title="粗体 (Ctrl+B)"`）
2. **独立工具栏组件** — `EditorToolbar.tsx`，使用 `getFullTitle()` 函数将 `SHORTCUTS` 映射表附加到按钮 `title` 属性

两套工具栏均提供相同的快捷键映射：

| 功能 | 快捷键 |
|------|--------|
| 粗体 (Bold) | `Ctrl+B` |
| 斜体 (Italic) | `Ctrl+I` |
| 下划线 (Underline) | `Ctrl+U` |
| 删除线 (Strikethrough) | `Ctrl+Shift+X` |
| 行内代码 (Inline Code) | `Ctrl+E` |
| 一级标题 (Heading 1) | `Ctrl+Alt+1` |
| 二级标题 (Heading 2) | `Ctrl+Alt+2` |
| 三级标题 (Heading 3) | `Ctrl+Alt+3` |
| 无序列表 (Bullet List) | `Ctrl+Shift+8` |
| 有序列表 (Ordered List) | `Ctrl+Shift+7` |
| 任务列表 (Task List) | `Ctrl+Shift+9` |
| 引用 (Blockquote) | `Ctrl+Shift+B` |
| 撤销 (Undo) | `Ctrl+Z` |
| 重做 (Redo) | `Ctrl+Shift+Z` |

这些快捷键由 TipTap 内置键盘处理器支持，工具栏按钮的 `title` 属性中会显示对应快捷键提示。

|## 斜杠命令 (Slash Commands) ⚠️ 未实现

浮动菜单 (`FloatingMenu.tsx`) 计划实现完整的斜杠命令系统：在段落开头键入 `/` 时触发，弹出浮动菜单供用户快速插入块级元素。**当前未实际实现。**

### 触发条件

- 光标位于**段落开头**（`$from.parentOffset === 0`）
- 当前输入为纯文本 `/`（`isTextSelection && textBefore === '/'`）
- 菜单显示在光标正下方，点击外部或按 Esc 关闭

### 菜单项 (6 项)

| # | 图标 | 功能 | TipTap 命令 |
|---|------|------|------------|
| 1 | Heading1 | 一级标题 | `toggleHeading({ level: 1 })` |
| 2 | Heading2 | 二级标题 | `toggleHeading({ level: 2 })` |
| 3 | List | 无序列表 | `toggleBulletList()` |
| 4 | Quote | 引用 | `toggleBlockquote()` |
| 5 | Code | 代码块 | `toggleCodeBlock()` |
| 6 | ImageIcon | 图片 | `setImage()` (通过 prompt 输入 URL) |

选择任一菜单项后，自动删除已键入的 `/` 字符（`deleteRange`），确保内容干净。

## ~~ShikiCodeBlock~~ 扩展（已删除）

| 属性 | 值 |
|------|-----|
| 扩展名 (`name`) | `codeBlock` |
| 优先级 (`priority`) | 100 |
| 组 | `block` |
| 内容 | `text*` |
| `language` 属性默认值 | `typescript` |
| 解析方式 | 从 `data-language` 属性或 `class` 提取 |
| 渲染方式 | ~~ReactNodeViewRenderer + ShikiCodeBlockComponent~~ |

> **已于 2026-04-29 删除。** 该扩展未注册到编辑器，且其定义文件和 NodeView 组件均已从仓库中删除。Shiki 现在仅用于 MDX 静态渲染，编辑器中的代码块使用 StarterKit 内置的 codeBlock。

## CollaborationEditor

`CollaborationEditor.tsx` 是一个透传（passthrough）包装组件，渲染 `TiptapEditor` 但不包含实际的 Yjs/Hocuspocus 同步逻辑。它是一个未来协作功能的占位符。

```tsx
// CollaborationEditor.tsx — 仅传递 props 到 TiptapEditor，无实际协作同步
export default function CollaborationEditor({ roomId, ...props }) {
  return (
    <div data-collab-room={roomId}>
      <TiptapEditor {...props} />
    </div>
  )
}
```

### 协作状态说明

| 组件 | 状态 | 路径 |
|------|------|------|
| Hocuspocus WebSocket 服务器 | ❌ 未实现，依赖未安装 | `frontend/scripts/hocuspocus-server.js` (34 行，独立 Node.js 进程，端口 3002) |
| npm 依赖 (`@hocuspocus/provider`, `@hocuspocus/server`, `yjs`) | ❌ 未实现，依赖未安装 | 作为 reactjs-tiptap-editor 的 transitive 依赖存在于 `pnpm-lock.yaml` |
| 前端集成 (`CollaborationEditor.tsx`) | ⏳ 占位符 | 仅透传 props 到 `TiptapEditor`，无 Yjs 同步逻辑 |

Hocuspocus 服务器及协作功能目前未实现，相关依赖未安装。前端 `CollaborationEditor.tsx` 仅为未来协作功能的占位符包装组件。

## 待改造项

| 优先级 | 改造项 | 说明 |
|-------|--------|------|
| P0 | 正则量词修复 | `[\\s\\S]+` → `[\\s\\S]*`，支持空 math div |
| P1 | ~~saveToMdx~~ 已废弃；MDX 转换由后端完成 | 让 saveToMdx 在 turndown 后处理数学公式 |
| P1 | loadToEditor HTML 实体解码 | `data-latex="a&amp;b"` → `a&b` |
| P2 | Remark-prosemirror 集成 | 深层 AST 转换替代字符串拼接 |
|| ~~P2 | 双轨存储 Schema | 添加 content_mdx_sync 字段 — 已通过三级降级策略解决~~ |
|| P3 | JSX 组件往返 | `<FadeIn>`, `<Callout>` 等双向映射 |
|| 遗留/待清理 | 删除废弃 `articles`/`article_versions` 表 | 双轨存储已迁移到 `posts`/`post_versions`，旧表残留待清理。迁移文件 `2026042701_create_articles.sql` 仍存在，`articles.rs` 路由未接入 `main.rs` |
