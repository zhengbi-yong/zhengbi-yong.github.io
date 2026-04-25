# 附录：先进富文本编辑与 MDX 数学公式存储架构

> **来源**：《2026年前端先进富文本编辑技术与富数学公式内容 MDX 兼容存储深度研究报告》
>
> 本附录提炼该报告的核心架构思想，用于指导本博客编辑器的改造方向。

---

## 1. 核心问题

在使用 TipTap 作为前端编辑器的场景下，如何最佳地保存包含复杂数学公式的文章并深度兼容 MDX 格式？

---

## 2. TipTap + 数学公式的技术原理

### 2.1 为什么选择 TipTap

| 框架 | 核心优势 | 主要局限 |
|------|---------|---------|
| **TipTap (ProseMirror)** | 不可变状态、成熟插件生态、官方数学公式支持、AST 绝对掌控 | 完整引入打包体积较大 |
| Lexical | Meta 维护、极高性能、React 19 深度整合 | 学习曲线陡峭、节点扩展复杂 |
| Slate.js | 极致自由度 | 缺乏开箱即用组件、开发周期长 |
| BlockSuite | 块级复用、AFFiNE 同款 | 不适合简单输入场景 |

**结论**：TipTap 在"开发者自由度"与"开箱即用功能性"之间取得最佳平衡，官方 `@tiptap/extension-mathematics` 直接支持数学公式。

### 2.2 数学公式的读写分离架构

TipTap 将数学公式处理为"一等公民"：

```
数据层（存储）          视图层（渲染）
┌─────────────────┐    ┌─────────────────┐
│ LaTeX 纯文本字符串 │ ──→ │ KaTeX HTML DOM  │
│ JSON: {         │    │ <span class=    │
│   type: "inlineMath", │  │   "katex">...  │
│   attrs: { latex: "E=mc^2" } │   </span>    │
│ }               │    └─────────────────┘
└─────────────────┘
```

**关键设计**：
- **存储的永远是 LaTeX 源码**（`attrs.latex`），而非渲染后的图片或 HTML
- KaTeX 在视图层按需编译，60fps 实时更新
- 编辑器中显示的是 KaTeX 渲染结果，底层是纯净的文本指令

---

## 3. 三种存储格式的比较

### 3.1 纯 HTML 序列化（不推荐）

直接存储 `editor.getHTML()` 输出。

```
优点：读取后直接 innerHTML 渲染，TTFB 极短，SEO 友好
缺点：
  - 数学公式退化为带 class 的死标签，丧失语义
  - 重新加载回编辑器需要反向解析，极易损坏
  - 面临 XSS 攻击风险，需严格 Sanitization
  - 存储臃肿
```

### 3.2 JSON (ProseMirror AST)（当前部分使用）

存储 `editor.getJSON()` 输出。

```
优点：
  - 完整保留所有语义关系与节点属性
  - 支持 JSONB 原生查询（如"查找所有含 LaTeX 公式的文章"）
  - 天然支持 Yjs CRDT 实时协作
缺点：
  - 与 TipTap/ProseMirror Schema 强耦合
  - 迁移至其他框架成本极高
  - 无法直接被静态站点生成器消费
```

### 3.3 MDX 纯文本（目标格式）

存储为纯文本 MDX 字符串。

```
优点：
  - 与任何 UI 框架完全解耦，具有终极便携性
  - 可在任何 Unified.js 解析器间无损流转
  - 天然契合 Git-based CMS 工作流
  - 适合 SSG 静态站点生成
缺点：
  - 需要严密的双向 AST 转换工程栈
  - 解析稍有漏洞即导致数据损坏
```

---

## 4. 推荐架构：CQRS 双轨存储

### 4.1 架构图

```
写入侧（Command Side）          读取侧（Query Side）
┌──────────────────┐           ┌──────────────────┐
│ TipTap editor    │           │ Next.js SSG       │
│ editor.getJSON() │           │ MDX → HTML        │
└────────┬─────────┘           └────────▲─────────┘
         │                              │
         ▼                              │
┌──────────────────┐           ┌────────┴─────────┐
│ content_json     │  异步转换  │ content_mdx      │
│ (JSONB)          │ ────────→ │ (TEXT)           │
│ 单一事实来源       │           │ 高效读取/分发     │
└──────────────────┘           └──────────────────┘
         │
         ▼
┌──────────────────┐
│ content_mdx_sync │
│ (TEXT, 同步副本)  │
└──────────────────┘
```

### 4.2 数据库 Schema 设计（PostgreSQL）

```sql
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  author_id       UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  -- 双轨存储
  content_json    JSONB NOT NULL,  -- 写入侧单一事实来源
  content_mdx     TEXT NOT NULL,   -- 读取侧优化视图
  content_mdx_sync TEXT NOT NULL,  -- MDX 同步副本（防丢失）
  -- 版本管理
  version_num     INTEGER DEFAULT 1
);

CREATE INDEX idx_articles_content_json ON articles USING GIN (content_json);
CREATE INDEX idx_articles_content_mdx ON articles USING GIN (to_tsvector('english', content_mdx));
```

### 4.3 核心优势

- **写入绝对安全**：`content_json` 作为单一事实来源，任何格式转换都不会丢失数据
- **读取高效分发**：`content_mdx` 可直接被 Next.js SSG 消费
- **全文检索**：`content_mdx` 可直接构建倒排索引，无需解析 JSON 树
- **未来可迁移**：即使放弃 TipTap，`content_mdx` 依然是Portable 的标准格式

---

## 5. MDX 数学公式的编译管线

### 5.1 标准 MDX 编译链

```
MDX 文本
  │
  ▼ remark-parse
MDAST (Markdown AST)
  │
  ▼ remark-math 插件
识别 $...$ (inlineMath) 和 $$...$$ (math) 节点
  │
  ▼ remark-rehype
HAST (HTML AST)
  │
  ▼ rehype-katex
最终 HTML + KaTeX 渲染结果
```

### 5.2 TipTap JSON → MDX 的 AST 映射

关键映射规则：

| TipTap Node Type | remark-math Node Type | MDX 输出格式 |
|-----------------|---------------------|-------------|
| `inlineMath` (attrs.latex: "E=mc^2") | `inlineMath` (value: "E=mc^2") | `$E=mc^2$` |
| `mathematics` (attrs.latex: "\\begin{bmatrix}...") | `math` (value: "\\begin{bmatrix}...") | `$$\n\\begin{bmatrix}...\n$$` |

### 5.3 推荐的 AST 双向转换方案

**路线二（推荐）**：使用 `remark-prosemirror` 进行深层 AST 转换。

```javascript
// ProseMirror → MDAST 处理器
const prosemirrorToMdastHandlers = {
  mathematics_block: (pmNode) => ({
    type: "math",
    value: pmNode.attrs.latex,
  }),
  inline_math: (pmNode) => ({
    type: "inlineMath",
    value: pmNode.attrs.latex,
  }),
}

// MDAST → MDX 序列化
const mdastStringifier = new RemarkStringify({
  emphasis: '_',    // 统一使用 * 而非 _
  bullet: '-',
  rules: { ... }
})
```

**优势**：
- 双向完美对称，语法层面零误差
- 可运行在 Node.js 服务端
- 不依赖 TipTap 自身的 Markdown 扩展

---

## 6. 工程实施中的边界情况

### 6.1 普通美元符号的转义

用户输入 `$100`（普通美元符号）时，系统必须转义为 `\$100`，否则会被误判为数学公式。

**防护策略**：
- 前端 TipTap 输入规则：检测 `$` 后是否紧跟合法 LaTeX 模式
- 后端序列化：所有不参与闭合公式的 `$` 必须反斜杠转义

### 6.2 多行矩阵的对齐处理

```latex
$$
\begin{aligned}
a &= b + c \\
d &= e + f
\end{aligned}
$$
```

**关键要求**：
- 开闭 `$$` 必须独占首尾所在行（不能有内联文本同行）
- 保留所有 `\n` 换行符

### 6.3 粘贴内容的清洗

从 Word 或旧富文本编辑器粘贴时，可能带入：
- 零宽不可见字符（Zero-width characters）
- 非标准回车符
- Base64 废弃图片数据

**必须**在业务逻辑层前置 Paste Handler，拦截并剔除所有非纯文本节点。

---

## 7. 本博客编辑器的改造方向

### 7.1 当前状态

本博客已实现：
- ✅ TipTap 编辑器 + `@tiptap/extension-mathematics`
- ✅ `MDXContentBridge.ts`：MDX ↔ Tiptap HTML 双向转换
- ✅ 数学公式的加载（`loadToEditor`）和保存（`saveToMdx`）
- ✅ 占位符机制保留原始 MDX 片段

### 7.2 待改造项

| 优先级 | 改造项 | 说明 |
|-------|--------|------|
| **P0** | **正则量词修复** | `[\s\S]+` → `[\s\S]*`，支持空 math div |
| **P1** | **saveToMdx 参与数学还原** | 让 `saveToMdx` 在 turndown 后处理数学公式 |
| **P1** | **loadToEditor HTML 实体解码** | `data-latex="a&amp;b"` 需解码为 `a&b` |
| **P2** | **Remark-prosemirror 集成** | 用深层 AST 转换替代字符串拼接 |
| **P2** | **双轨存储 Schema** | 添加 `content_mdx_sync` 字段 |
| **P3** | **JSX 组件往返** | `<FadeIn>`, `<Callout>` 等组件的双向映射 |

### 7.3 核心修复说明

#### P0 修复：正则量词

```typescript
// 错误：[\s\S]+ 要求至少 1 个字符，但空 math div 有 0 个字符
/<div[^>]*data-type="block-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]+<\/div>/g

// 正确：[\s\S]* 匹配 0 或多个字符
/<div[^>]*data-type="block-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*<\/div>/g
```

#### P1 修复：saveToMdx 调用链

```typescript
// TiptapEditor onUpdate 修复后的流程：
onUpdate: ({ editor }) => {
  const html = editor.getHTML()

  // Step 1: 正则提取 math HTML → $$...$$
  let processed = html
    .replace(/<div[^>]*data-type="block-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*<\/div>/g,
      (_m, l) => `\n$$\n${latexDecodeHtmlEntities(l)}\n$$\n`)
    .replace(/<span[^>]*data-type="inline-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*<\/span>/g,
      (_m, l) => `$${latexDecodeHtmlEntities(l)}$`)

  // Step 2: turndown 处理剩余 HTML
  const markdown = turndownService.turndown(processed)

  // Step 3: saveToMdx 还原 MDX（数学公式 + JSX 组件）
  const { content: mdxContent } = saveToMdx(markdown, originalMdxContent)

  onChange?.(mdxContent)
}
```

---

## 8. 结论

该架构在极致的数据结构化控制与现代开发体验之间取得黄金分割：

1. **数据层**：JSONB 作为写入侧单一事实来源，MDX TEXT 作为读取侧优化视图（CQRS）
2. **转换层**：采用 remark-prosemirror 深层 AST 双向转换，替代脆弱的字符串拼接
3. **存储层**：数学公式存储为 LaTeX 纯文本（而非 HTML 渲染结果），确保跨平台永久可读

这套架构为构建面向未来的技术知识库奠定了坚如磐石的技术底座。

---

**参考文献**
- [TipTap Mathematics Extension](https://github.com/ueberdosis/tiptap-extensions)
- [remark-math / rehype-katex](https://github.com/remarkjs/remark-math)
- [remark-prosemirror](https://github.com/remarkjs/remark-prosemirror)
- [KaTeX](https://katex.org/)
- [ProseMirror](https://prosemirror.net/)
