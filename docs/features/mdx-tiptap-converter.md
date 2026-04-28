# MDX ↔ TipTap JSON 双向转换器

> **状态**: 设计中
> **版本**: 1.0
> **关联代码**: `backend/crates/core/src/mdx_to_json.rs`, `backend/crates/core/src/mdx_convert.rs`

## 背景

博客系统采用双轨存储策略：
- `content_json` (JSONB): TipTap ProseMirror AST — **写入侧 Single Source of Truth**
- `content_mdx` (TEXT): 预编译 MDX 文本 — **读取侧 SSR 直读缓存**

`content_json` 是编辑器唯一可加载的内容格式。历史遗留的 156 篇文章只有原始 MDX 文本（`content_mdx`），`content_json` 为空对象 `{}`，导致编辑器无法加载。

**需求**: 实现健壮的 MDX → TipTap JSON 转换器，作为基础设施级服务，供批量迁移、用户上传 MDX 文件、编辑器回退等场景使用。

## 技术选型

| 组件 | 版本 | 用途 |
|------|------|------|
| `pulldown-cmark` | 0.12 | Markdown AST 解析（已存在 workspace 依赖） |
| `serde_json` | 1.0 | TipTap JSON 序列化（已存在） |
| `blog-core` crate | — | 转换器逻辑归属（与 `mdx_convert.rs` 同 crate） |

### 为什么选 pulldown-cmark

- **社区标准**：Rust 生态最流行的 Markdown 解析器，支持 GFM
- **成熟度**：v0.12，长期维护，低 bug 率
- **功能完整**：表格、围栏代码块、任务列表、Strikethrough 等 GFM 扩展全支持
- **零新增依赖**：已在 workspace 依赖中

## 架构

### 转换流程

```
MDX 原始文本
  │
  ▼
pulldown-cmark Parser (token 流)
  │
  ▼
Tag → TipTap 节点映射器 (mdx_to_json.rs)
  ├── 块级映射 (Heading, Paragraph, CodeBlock, List, Table, Blockquote...)
  ├── 内联映射 (Emphasis, Strong, Code, Link, Strikethrough → marks)
  └── 特殊语法处理 (Math, TaskList, MDX组件)
  │
  ▼
serde_json::Value (TipTap ProseMirror JSON)
  │
  ▼
{ "type": "doc", "content": [...] }
```

### 节点映射表

#### 块级节点

| pulldown-cmark Tag | TipTap JSON 节点类型 | attrs |
|---|---|---|
| `Heading(level,..)` | `heading` | `{"level": level}` |
| `Paragraph` | `paragraph` | — |
| `CodeBlock(CodeBlockKind::Fenced(lang))` | `codeBlock` | `{"language": lang}` |
| `CodeBlock(CodeBlockKind::Indented)` | `codeBlock` | `{"language": ""}` |
| `List(Some(1))` (start=1) | `orderedList` | `{"start": start}` |
| `List(None)` | `bulletList` | — |
| `Item` | `listItem` | — |
| `Table(..)` | `table` | — |
| `TableHead` | （头部行，用 tableRow + 语义标记） | — |
| `TableRow` | `tableRow` | — |
| `TableCell` | `tableCell` | `{"header": true/false}` |
| `Blockquote(..)` | `blockquote` | — |
| `Rule` | `horizontalRule` | — |
| `Html` (块级) | 尝试解析为 math/permalinks，否则作为 raw 块保留 | — |

#### 内联节点 / Marks

| pulldown-cmark 内联 | TipTap 表达方式 |
|---|---|
| `Text(text)` | `{"type": "text", "text": text}` |
| `Code(text)` | `{"type": "text", "text": text, "marks": [{"type": "code"}]}` |
| `Emphasis(text)` | marks: `[{"type": "italic"}]` |
| `Strong(text)` | marks: `[{"type": "bold"}]` |
| `Link(href, title)` | marks: `[{"type": "link", "attrs": {"href": href}}]` |
| `Strikethrough(text)` | marks: `[{"type": "strike"}]` |
| `Image(..)` | `{"type": "image", "attrs": {"src": ..., "alt": ..., "title": ...}}` |
| `SoftBreak` / `HardBreak` | `{"type": "hardBreak"}` |

#### 特殊语法（需自定义处理）

| MDX 语法 | TipTap 节点 | 处理方式 |
|---|---|---|
| `$...$` (行内公式) | `inlineMath` | 作为 `InlineHtml` 或自定义解析器捕获 |
| `$$...$$` (块级公式) | `blockMath` | 作为 `Html` 块捕获（块级 `$$` 在 Markdown 中通常被解析为 HTML 块） |
| `<RDKitStructure .../>` | 保留为 raw inline/block | 检测 JSX 模式，保留原文本 |
| `- [x]` / `- [ ]` (任务列表) | `taskList` + `taskItem` | pulldown-cmark 不支持原生任务列表，需特殊处理：检测 listItem 文本首字符 `[x]`/`[ ]`，重组节点结构 |

### 标记（marks）的处理规则

Tiptap 的内联格式化采用 **marks 数组** 而非嵌套节点。一个文本节点可以有多个 marks 叠加：

```json
{
  "type": "text",
  "text": "bold and italic",
  "marks": [
    {"type": "bold"},
    {"type": "italic"}
  ]
}
```

**合并策略**：当 pulldown-cmark 产生嵌套内联（如 `**bold and *italic***`），需将外层 Strong 和内层 Emphasis 合并到同一个文本节点的 marks 数组中。

**跨节点处理**：当同一个标记贯穿多个 inline 元素（如一段 `**加粗**文本` 中的 "加粗" 和 "文本" 各占一个 Event），每个 Event 独立携带 marks，不跨节点合并。

## API 设计

### 1. 单篇转换

```
POST /api/v1/admin/mdx/convert
Authorization: Bearer <token>
Content-Type: application/json

{
  "mdx_text": "# Hello\n\nThis is **bold** text."
}

Response 200:
{
  "content_json": {
    "type": "doc",
    "content": [
      { "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Hello" }] },
      { "type": "paragraph", "content": [
        { "type": "text", "text": "This is " },
        { "type": "text", "text": "bold", "marks": [{ "type": "bold" }] },
        { "type": "text", "text": " text." }
      ]}
    ]
  },
  "mdx_compiled": "# Hello\n\nThis is **bold** text.",
  "stats": {
    "blocks": 2,
    "text_nodes": 4,
    "marks_used": ["bold"]
  }
}
```

### 2. 批量转换（用于迁移）

```
POST /api/v1/admin/mdx/batch-convert
Authorization: Bearer <token>
Content-Type: application/json

{
  "articles": [
    { "slug": "my-article", "mdx_text": "# Article ..." },
    { "slug": "another", "mdx_text": "## Another ..." }
  ],
  "update_database": true
}

Response 200:
{
  "results": [
    { "slug": "my-article", "success": true, "content_json": { ... } },
    { "slug": "another", "success": true, "content_json": { ... } }
  ],
  "summary": {
    "total": 2,
    "success": 2,
    "failed": 0
  }
}
```

### 3. 一次性迁移端点

```
POST /api/v1/admin/mdx/migrate-all
Authorization: Bearer <token>

Response 200:
{
  "total": 156,
  "updated": 153,
  "skipped": 3,
  "failed": [],
  "duration_ms": 4520
}
```

## Rust 核心函数签名

```rust
/// 将 MDX/Markdown 文本转换为 TipTap ProseMirror JSON AST
///
/// # Arguments
/// * `mdx_text` - MDX 原始文本字符串
///
/// # Returns
/// TipTap JSON AST (`{ "type": "doc", "content": [...] }`)
///
/// # 设计原则
/// - 纯同步转换，无 IO，无外部副作用
/// - 空输入返回 `{ "type": "doc", "content": [] }`
/// - 所有节点严格遵循 Tiptap 3.x JSONContent 格式
/// - 与 `tiptap_json_to_mdx()` 互为逆操作（roundtrip 保真度 > 95%）
pub fn mdx_to_tiptap_json(mdx_text: &str) -> Value {
    // ...
}

/// 将 MDX 文本转换为 TipTap JSON 并返回统计信息
pub fn mdx_to_tiptap_json_with_stats(mdx_text: &str) -> (Value, ConversionStats) {
    // ...
}
```

## 测试策略

### 单元测试（与 mdx_convert.rs 同文件）

1. **标准 Markdown**：标题、段落、代码块、列表、引用、图片、链接
2. **GFM 扩展**：表格、任务列表、Strikethrough
3. **数学公式**：`$...$` inline、`$$...$$` display
4. **MDX 组件**：JSX 标签保留
5. **Roundtrip 测试**：mdx_to_tiptap_json → tiptap_json_to_mdx → 原始 MDX（验证循环转换保真度）
6. **Edge Cases**：空字符串、纯 HTML、极长文本、复杂嵌套列表
7. **Unicode**：中文、日文、数学符号、表情符号

### 集成测试

1. 调用 `POST /admin/mdx/convert` API，验证返回的 JSON 结构完整
2. 用转换后的 JSON 通过 `tiptap_json_to_mdx` 反向转换，验证一致
3. 批量转换 156 篇现有文章，全部成功

## 文件清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `backend/crates/core/src/mdx_to_json.rs` | 🔧 核心 | MDX → TipTap JSON 转换器（500-800 行） |
| `backend/crates/core/src/lib.rs` | 🔧 修改 | 导出 `mdx_to_tiptap_json` |
| `backend/crates/api/src/routes/mdx_convert.rs` | 🔧 新路由 | API 端点：convert / batch-convert / migrate-all |
| `backend/crates/api/src/routes/mod.rs` | 🔧 修改 | 注册 mdx_convert 模块 |
| `backend/crates/api/src/main.rs` | 🔧 修改 | 注册路由到 `admin_routes` 组 |
| `docs/features/mdx-tiptap-converter.md` | 📝 本文档 | 设计文档 |
| `backend/crates/core/tests/mdx_roundtrip.rs` | 🔧 测试 | Roundtrip 集成测试 |

## 注意事项

### 已知限制

1. **TaskList 原生不支持**：pulldown-cmark 不将 `- [x] text` 解析为独立事件，需在 listItem 解析后二次遍历文本内容检测 `[x]`/`[ ]` 模式，然后重组为 `taskList` + `taskItem` 结构
2. **数学公式检测**：`$...$` 在 Markdown 中可能被解析为普通文本中的 raw inline，`$$...$$` 可能被解析为 HTML 块；需要引入简单的启发式检测或在预处理阶段替换为占位符
3. **MDX JSX 组件**：`<Component {...props}>children</Component>` 在 pulldown-cmark 中被解析为 HTML 块或内联 HTML，只需原样保留文本
4. **Roundtrip 非完美**：Markdown 有多种等价的语法表达（如有序列表 `1.` 和 `1)`），不同解析器的 AST 结构可能有差异；roundtrip 保真度目标 > 95%，但不追求 100%

### 与现有 mdx_convert.rs 的关系

- `mdx_to_json.rs` 是 `mdx_convert.rs` 的**逆操作**，两者共享同一套 TipTap JSON 节点规范
- 共同构成完整双向转换：`MDX ⇆ TipTap JSON`
- 建议将两文件的公共类型（节点名常量、Attrs 结构体）抽取到共享子模块 `mdx_common.rs`
