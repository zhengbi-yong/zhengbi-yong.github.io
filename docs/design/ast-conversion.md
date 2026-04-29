# AST 转换管线

> 当前实现：Rust 后端 `blog-core` crate 的双向转换器，位于两个文件中：
> - `backend/crates/core/src/mdx_convert.rs` — TipTap JSON → MDX（正向转换）
> - `backend/crates/core/src/mdx_to_json.rs` — MDX → TipTap JSON（反向转换）

## 正向转换：TipTap JSON → MDX

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

### 核心实现

```rust
// 入口函数 (pub)
pub fn tiptap_json_to_mdx(json: &Value) -> String

// 内部递归
fn render_node(node: &Value) -> String     // 根据 type 派发
fn render_inline_node(node: &Value) -> String  // 内联节点
fn render_marks(text: &str, marks: &[Value], node: &Value) -> String
```

### 调用位置
- `backend/crates/api/src/routes/posts.rs` — post CRUD 中 fallback 转换（content_json → content_mdx）
- `backend/crates/api/src/routes/articles.rs` — 文章写入时转换
- `backend/crates/api/src/routes/mdx_convert.rs` — MDX 同步管线
- `backend/crates/api/src/routes/mdx_sync.rs` — 另一个调用站点（手动触发的 MDX 同步）

## 反向转换：MDX → TipTap JSON

```text
MDX 纯文本
        │
        ▼
  pulldown-cmark 解析器（解析 Markdown 事件）
        │
        ▼
  事件 → TipTap JSON 节点转换
        │
        ▼
  TipTap JSON (ProseMirror AST)
```

- 使用 `pulldown-cmark` crate 解析 Markdown 为事件流，再转换为 TipTap JSON AST
- **不同于**正向转换（纯字符串拼接），反向转换基于解析器事件

### 核心实现

位于 `backend/crates/core/src/mdx_to_json.rs`：

```rust
// 入口函数 (pub)
pub fn mdx_to_tiptap_json(mdx: &str) -> Value
pub fn mdx_to_tiptap_json_with_stats(mdx: &str) -> (Value, ConversionStats)

// 转换统计结构
pub struct ConversionStats {
    pub blocks: usize,           // 总块级节点数
    pub text_nodes: usize,       // 总文本节点数
    pub marks_used: Vec<String>, // 使用到的 Mark 类型列表
}
```

`mdx_to_tiptap_json()` 返回纯 `Value`，适用于简单转换。
`mdx_to_tiptap_json_with_stats()` 返回 `(Value, ConversionStats)` 元组，适用于需要监控和调试的场景。

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
| `video` | `<video src="...">` |
| `inlineMath` (latex) | `$latex$` |
| `blockMath` (latex) | `$$\nlatex\n$$` |
| `table` / `tableRow` / `tableCell` | Markdown 表格 |
| `horizontalRule` | `---` |
| `hardBreak` | `\n`（单纯换行） |
| `mention` | `@username` |
| `details` / `detailsSummary` / `detailsContent` | 自定义 blockquote 格式：`> **📖 标题**`  + `> 内容` |
| `callout` | `> ℹ️ text`（blockquote + emoji 前缀） |

### Mark 映射

| Mark | MDX |
|------|-----|
| `bold` | `**text**` |
| `italic` | `*text*` |
| `code` | `` `text` `` |
| `link` | `[text](href)` |
| `strike` | `~~text~~` |

## 双向转换

```text
写入: editor.getJSON() → 发往后端 → Rust tiptap_json_to_mdx() → 保存双轨
读取: content_mdx 直供 SSR，content_json 供编辑器加载
```

- 编辑器 JSON 通过 API `POST /admin/posts` 发送到后端
- 后端调用 `blog_core::tiptap_json_to_mdx()` 转换
- 同时保存 `content_json`（原始 AST）和 `content_mdx`（转换后的 MDX）

## 双轨存储

`posts` 表和 `articles` 表均采用 dual-track 模式：

| 列 | 类型 | 用途 |
|----|------|------|
| `content_json` | JSONB | TipTap 真相源（写入侧） |
| `content_mdx` | TEXT | MDX 缓存（读取侧） |

- 写入时：同时保存两者
- 读取时：优先使用 `content_mdx`，若为 NULL 则实时从 `content_json` 转换
- 脏数据处理：若 `content_mdx` 已是 TipTap JSON 格式（脏数据），实时转换为真正 MDX

## 测试覆盖

`mdx_convert.rs` 包含 **~16 个测试函数**，`mdx_to_json.rs` 包含 **~27 个测试函数**，总计 **~43 个测试函数**。覆盖：

正向转换（`mdx_convert.rs`）：
- 空文档
- 嵌套列表（bullet + ordered）
- 代码块（含语言标注）
- 数学公式（inline + block）
- HTML 转义
- 表格
- 任务列表
- 引用块 + 嵌套
- 多级标题

反向转换（`mdx_to_json.rs`）：
- 空字符串
- 纯文本段落
- 多级标题
- 无序/有序列表
- 代码块（含语言标注）
- 引用块
- 链接、图片
- 加粗、斜体、行内代码标记
- 复杂嵌套场景

运行: `cargo test -p blog-core`
