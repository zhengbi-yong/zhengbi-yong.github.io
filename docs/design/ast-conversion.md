# AST 转换管线

> 当前实现：Rust 后端 `blog-core` crate 的纯递归 JSON 遍历，位于 `backend/crates/core/src/mdx_convert.rs`。

## 转换方向

```text
TipTap JSON (ProseMirror AST)
        │
        ▼
  递归 JSON 遍历 (纯 Rust)
        │
        ▼
  MDX 纯文本 (字符串拼接)
```

- **不是** remark-prosemirror 转换器
- **不是** MDAST 中间表示
- 直接 JSON → Markdown 字符串拼接

## 核心实现

```rust
// 入口函数 (pub)
pub fn tiptap_json_to_mdx(json: &Value) -> String

// 内部递归
fn render_node(node: &Value) -> String     // 根据 type 派发
fn render_inline_node(node: &Value) -> String  // 内联节点
fn render_marks(text: &str, marks: &[Value], node: &Value) -> String
```

### 调用位置
- `backend/crates/api/src/routes/posts.rs` — `get_post` 中 fallback 转换，写入时转换
- `backend/crates/api/src/routes/mdx_sync.rs` — MDX 同步管线
- `backend/crates/api/src/routes/articles.rs` — 文章写入/更新时转换
- `backend/crates/api/src/routes/mdx_convert.rs` — MDX→JSON 转换路由的后端校验

## 节点类型映射

| TipTap 节点 | MDX 输出 |
|------------|---------|
| `doc` | 根节点，无输出 |
| `paragraph` | 文本 + 换行 |
| `heading` (level) | `#` × level |
| `bulletList` | `- `（递归子节点） |
| `orderedList` | `1. `（递归子节点） |
| `taskList` / `taskItem` | `- [x] ` / `- [ ] ` |
| `codeBlock` | `` ```language \n code \n ``` `` |
| `blockquote` | `> ` |
| `image` | `![alt](src)` |
| `video` | `<video src="..." />`（自闭合） |
| `inlineMath` (latex) | `$latex$` |
| `blockMath` (latex) | `$$\nlatex\n$$` |
| `table` / `tableRow` / `tableCell` | Markdown 表格 |
| `horizontalRule` | `---` |
| `hardBreak` | 两个空格 + 换行 |
| `mention` | `@username` |
| `details` / `summary` | `<details>` / `<summary>` |
| `callout` | `::: callout-type` |

### Mark 映射

| Mark | MDX |
|------|-----|
| `bold` | `**text**` |
| `italic` | `*text*` |
| `code` | `` `text` `` |
| `link` | `[text](href)` |
| `strike` | `~~text~~` |

## 双向转换

### 正向：TipTap JSON → MDX

```text
写入: editor.getJSON() → 发往后端 → Rust tiptap_json_to_mdx() → 保存双轨
读取: content_mdx 直供 SSR，content_json 供编辑器加载
```

- 编辑器 JSON 通过 API `POST /admin/posts` 发送到后端
- 后端调用 `blog_core::tiptap_json_to_mdx()` 转换
- 同时保存 `content_json`（原始 AST）和 `content_mdx`（转换后的 MDX）

### 反向：MDX → TipTap JSON

反向转换在 `backend/crates/core/src/mdx_to_json.rs`（844 行）中实现，使用 `pulldown-cmark` 将 MDX 文本解析为事件流，然后映射为 TipTap 3.x JSONContent 格式的 JSON AST。

**核心函数**：
- `mdx_to_tiptap_json(mdx: &str) -> Value` — 单篇转换
- `mdx_to_tiptap_json_with_stats(mdx: &str) -> (Value, ConversionStats)` — 带统计的转换

**调用 API**：
- `POST /admin/mdx/convert` — 单篇 MDX → TipTap JSON 转换
- `POST /admin/mdx/batch-convert` — 批量转换（可更新数据库）
- `POST /admin/mdx/migrate-all` — 迁移数据库中所有 `content_json` 为空的文章

**导入路径**：`use blog_core::mdx_to_tiptap_json`

## 双轨存储

| 列 | 类型 | 用途 |
|----|------|------|
| `content_json` | JSONB | TipTap 真相源（写入侧） |
| `content_mdx` | TEXT | MDX 缓存（读取侧） |

- 写入时：同时保存两者
- 读取时：优先使用 `content_mdx`，若为 NULL 则实时从 `content_json` 转换
- 脏数据处理：若 `content_mdx` 已是 TipTap JSON 格式（脏数据），实时转换为真正 MDX

## 已知不对称

### 任务列表往返不对称

- **JSON→MDX**：`taskList` / `taskItem` 节点正确映射为 `- [x]` / `- [ ]` 格式
- **MDX→JSON（反向）**：`pulldown-cmark` 不原生支持任务列表语法；`mdx_to_json.rs` 需要额外启发式检测来识别 `[x]` / `[ ]` 前缀，前端编辑器也不完全支持 task item 的往返渲染
- **影响**：通过前端编辑器创建/编辑任务列表是可靠的，但将外部 MDX（含任务列表）导入编辑器可能丢失该语义

## 测试覆盖

`mdx_convert.rs` 包含 **16 个单元测试**，覆盖：
- 空文档
- 嵌套列表（bullet + ordered）
- 代码块（含语言标注）
- 数学公式（inline + block）
- HTML 转义
- 表格
- 任务列表
- 引用块 + 嵌套
- 多级标题

运行: `cargo test -p blog-core`
