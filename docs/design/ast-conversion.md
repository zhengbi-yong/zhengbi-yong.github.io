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
- `backend/crates/api/src/routes/posts.rs` — `get_post` 中 fallback 转换
- `backend/crates/api/src/routes/mdx_sync.rs` — MDX 同步管线
- `backend/crates/api/src/routes/auth.rs` — 文章写入时转换
- `backend/crates/api/src/routes/articles.rs` — articles 双轨存储写入

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

```text
写入: editor.getJSON() → 发往后端 → Rust tiptap_json_to_mdx() → 保存双轨
读取: content_mdx 直供 SSR，content_json 供编辑器加载
```

- 编辑器 JSON 通过 API `POST /admin/posts` 发送到后端
- 后端调用 `blog_core::tiptap_json_to_mdx()` 转换
- 同时保存 `content_json`（原始 AST）和 `content_mdx`（转换后的 MDX）

## 双轨存储

| 列 | 类型 | 用途 |
|----|------|------|
| `content_json` | JSONB | TipTap 真相源（写入侧） |
| `content_mdx` | TEXT | MDX 缓存（读取侧） |

- 写入时：同时保存两者
- 读取时实际三级降级逻辑（`posts.rs:612-646`）：
  1. **content_mdx 非空** → 检查是否为 TipTap JSON 格式（脏数据），是则实时转换为真正 MDX
  2. **content_mdx 为空** → 从 `content_json` 实时转换（fallback 1）
  3. **content_json 无数据** → 直接从旧 `content` 字段读取（fallback 2，旧数据导入路径）

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

`mdx_to_json.rs` 包含 **27 个单元测试**，覆盖反向转换：
- 空/空白输入
- 标题、段落
- 粗体/斜体/行内代码/链接/删除线
- 有序/无序/任务列表
- 代码块、引用、图片
- 表格
- 水平线、硬换行
- 转义字符
- 数学公式（inline + block）
- 转换统计收集

运行: `cargo test -p blog-core`

## 反向转换：MDX → TipTap JSON

`backend/crates/core/src/mdx_to_json.rs` (844 行) 提供逆向转换，使用 `pulldown-cmark` 解析 MDX 并映射为 TipTap 3.x JSONContent 格式。

### 入口函数

```rust
/// 将 MDX/Markdown 文本转换为 TipTap ProseMirror JSON AST
pub fn mdx_to_tiptap_json(mdx_text: &str) -> Value

/// 带统计信息的转换
pub fn mdx_to_tiptap_json_with_stats(mdx_text: &str) -> (Value, ConversionStats)
```

### 设计原则
- 纯同步转换，无 IO，无外部副作用
- 空输入返回 `{"type":"doc","content":[]}`
- 所有节点严格遵循 TipTap 3.x JSONContent 格式
- 内联标记 (marks) 通过栈上下文自动应用到文本节点

### 调用位置
- `backend/crates/api/src/routes/mdx_sync.rs` — MDX 文件同步管线
- `backend/crates/api/src/routes/mdx_convert.rs` — 批量转换流程
