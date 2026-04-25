# 具身智能富文本编辑器技术规范

> 本附录定义编辑器系统的核心架构标准，包括前端选型、数学公式渲染、内容持久化、实时协作与质量保障。

---

## 1. 前端架构与 UI 视图层标准

### 1.1 技术栈确立

强制采用 **Reactjs Tiptap Editor (hunghg255)**。利用其内置的 Shadcn UI 和 Tailwind CSS 体系，快速实现功能全面且响应式的现代编辑界面。

**核心依赖**：
- `@tiptap/react` + `@tiptap/starter-kit`
- `@tiptap/extension-mathematics` — KaTeX 数学公式
- `@tiptap/extension-code-block-lowlight` — 代码高亮
- `@tiptap/extension-task-list` + `@tiptap/extension-task-item` — 任务列表
- `@tiptap/extension-underline` / `@tiptap/extension-text-align` / `@tiptap/extension-link` / `@tiptap/extension-image`
- `lowlight` — 代码高亮引擎（common 语言包）
- `turndown` — HTML → Markdown 转换

### 1.2 客户端渲染隔离（SSR 防御）

**所有包含编辑器的组件必须在顶部声明 `'use client'`**。

使用 Next.js 的 `next/dynamic` 配合 `{ ssr: false }` 强制进行异步动态加载，避免庞大的编辑器引擎阻塞首屏关键渲染路径：

```tsx
const TiptapEditor = dynamic(
  () => import('@/components/editor/TiptapEditor').then(mod => ({ default: mod.TiptapEditor })),
  { ssr: false, loading: () => <EditorSkeleton /> }
)
```

### 1.3 阻断水合冲突（Hydration Mismatch）

在初始化 TipTap 的 `useEditor` 钩子时，必须显式注入 `immediatelyRender: false` 配置。强制将内部状态和 DOM 的构建延迟到客户端 `useEffect` 生命周期之后，保证 Next.js 输出纯净的初始 HTML 占位符：

```tsx
const editor = useEditor({
  immediatelyRender: false, // 禁用 SSR 渲染，防止水合错误
  extensions: [ /* ... */ ],
  content,
  editable,
  onUpdate: ({ editor }) => { /* ... */ },
})
```

---

## 2. 高阶内容与数学/化学公式渲染标准

### 2.1 AST 节点映射与输入规则

引入 `@tiptap/extension-mathematics` 扩展。通过正则输入规则（`$` 或 `$$`），实时拦截用户输入，将其在底层 JSON 树中转化为结构化的 `inlineMath` 或 `blockMath` 节点。

**Tiptap 内部数据模型**：

```typescript
// 块级公式节点
{
  "type": "blockMath",
  "attrs": { "latex": "a^2 + b^2 = c^2" }
}

// 行内公式节点
{
  "type": "inlineMath",
  "attrs": { "latex": "E=mc^2" }
}
```

### 2.2 NodeView 渲染机制

在视图层，利用 NodeView 机制拦截默认渲染，通过 **KaTeX 引擎**将源码实时编译为可视化 HTML 注入 DOM：

```typescript
// BlockMath NodeView 核心逻辑
addNodeView() {
  return ({ node }) => {
    const wrapper = document.createElement('div')
    wrapper.dataset.type = 'block-math'
    wrapper.setAttribute('data-latex', node.attrs.latex)

    const inner = document.createElement('div')
    wrapper.appendChild(inner)

    // KaTeX 实时渲染
    katex.render(node.attrs.latex, inner, katexOptions)

    return { dom: wrapper }
  }
}
```

### 2.3 渲染输出格式

Tiptap Mathematics 扩展输出的 HTML 结构：

```html
<!-- 块级公式 -->
<div data-type="block-math" data-latex="a^2 + b^2 = c^2">
  <div class="block-math-inner"><!-- KaTeX 渲染结果 --></div>
</div>

<!-- 行内公式 -->
<span data-type="inline-math" data-latex="E=mc^2"><!-- KaTeX 渲染结果 --></span>
```

### 2.4 读写分离渲染管线

- **底层仅存储**：原生纯文本源码（JSON `attrs.latex`）
- **视图层渲染**：NodeView + KaTeX 引擎实时编译
- **持久化格式**：MDX 文本（`$$...$$` / `$...$`）
- **加载流程**：MDX → `loadToEditor` → math HTML → Tiptap 渲染
- **保存流程**：Tiptap HTML → 正则提取 → Markdown → `saveToMdx` → MDX

这种机制不仅适用于数学公式，未来扩展化学方程式等复杂排版时，也能保持底层数据的纯净与高可扩展性。

---

## 3. MDX 数学公式存储架构（CQRS 双轨模型）

### 3.1 MDXContentBridge 双向转换

数学公式在 MDX 与编辑器之间通过 `MDXContentBridge.ts` 进行双向转换：

**加载流程（MDX → 编辑器）**：

```
MDX 原文
  ↓
[1] 正则提取 $$...$$ / $...$ → Base64 占位符
  ↓
[2] markdown-it 解析剩余 Markdown → HTML
  ↓
[3] 占位符 → <div data-type="block-math"> / <span data-type="inline-math">
  ↓
Tiptap 可渲染的 HTML（含 math 标签）
```

**保存流程（编辑器 → MDX）**：

```
Tiptap HTML
  ↓
[1] 正则从 data-latex 提取 LaTeX → $$...$$ / $...$
  ↓
[2] turndown → Markdown
  ↓
[3] saveToMdx 还原 Base64 占位符 → 原始 MDX 语法
  ↓
MDX 原文（保留完整格式）
```

### 3.2 关键实现细节

**正则为 `[\s\S]*?` 而非 `[\s\S]+?`**：空的 math div 在 `>` 和 `<` 之间有 0 个字符，`+`（1+）无法匹配，必须用 `*`（0+）：

```typescript
// 块级公式提取
/<div[^>]*data-type="block-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/div>/g

// 行内公式提取
/<span[^>]*data-type="inline-math"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/g
```

**HTML 实体编解码**：LaTeX 中的 `&` `<` `>` 在存入 `data-latex` 属性时会被 HTML 实体编码，提取时必须解码：

```typescript
// 编码：latex → data-latex 属性值
function latexEncode(latex: string): string {
  return latex.replace(/&/g, '&amp;')
              .replace(/"/g, '&quot;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
}

// 解码：data-latex 属性值 → latex
function latexDecodeHtmlEntities(encoded: string): string {
  return encoded.replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
}
```

### 3.3 往返一致性验证

所有数学公式必须通过以下往返测试：

| 用例 | 输入 MDX | 预期输出 MDX | 状态 |
|------|----------|--------------|------|
| 块级公式（勾股定理） | `$$\na^2 + b^2 = c^2\n$$` | `$$\na^2 + b^2 = c^2\n$$` | ✅ |
| 行内公式（E=mc²） | `The formula $E=mc^2$ is famous.` | `The formula $E=mc^2$ is famous.` | ✅ |
| 混合内容 | `Text $x^2$ and $$\na+b=c\n$$ end.` | `Text $x^2$ and $$\na+b=c\n$$ end.` | ✅ |
| 复杂 LaTeX（矩阵） | `$$\n\begin{bmatrix}a & b \\\\ c & d\end{bmatrix}\n$$` | `$$\n\begin{bmatrix}a & b \\\\ c & d\end{bmatrix}\n$$` | ✅ |

---

## 4. 后端数据持久化与双向转换标准（Rust Axum + PostgreSQL）

### 4.1 双轨存储模型（CQRS）

```
写入侧（Single Source of Truth）：
  PostgreSQL content_json (JSONB) — 完整 AST 属性，支撑高频保存与未来 CRDT 协作

读取侧（分发优化）：
  PostgreSQL content_mdx (TEXT) — 仅读取此字段，彻底规避反序列化深层 JSON 开销
```

### 4.2 AST 无损转换微服务

在后端整合 **Unified.js 生态**（remark-parse、remark-math、remark-rehype 等），建立专用映射字典（Node Handlers）。通过后台异步任务，将前端提交的 JSONB 数据精确编译为包含 JSX 组件和 LaTeX 语法的 MDX 文本。

### 4.3 Rust Axum 安全验证

- 利用 `validator` 和 `axum_valid` 宏，在路由 Extractor 层面强制进行强类型反序列化校验。防范超大或恶意嵌套的 JSON Payload 导致服务器 OOM
- 图片及多媒体文件上传采用流式处理与分块校验，验证 MIME 和病毒签名后直接无阻塞存入 S3 兼容的对象存储

---

## 5. 实时协作与高并发扩展标准

### 5.1 WebSocket 协同层

预留协同编辑架构设计。利用 Axum 原生的 WebSocket 支持或独立的 Hocuspocus 服务，结合 TipTap 的 Yjs 扩展实现 **CRDT 算法同步**。

### 5.2 高速缓存集成

在处理高频的并发文档状态广播时，可深度结合 **Redis** 作为内存级中间件，管理 WebSocket 会话状态与高频次的热点文档读取，减轻 PostgreSQL 写入压力。

---

## 6. 质量保障与企业级安全合规标准

### 6.1 高级视觉回归测试（Playwright）

针对公式渲染、排版破损等微小缺陷，在 CI/CD 中引入 Playwright。测试执行时必须冻结 CSS 动画与光标状态（`animations: 'disabled'`），利用屏蔽掩码忽略动态时间戳，精准截取特定渲染节点的快照进行像素级比对（统一在 Linux Docker 镜像中执行以消除字体渲染差异）。

### 6.2 纵深安全防御（Defense in Depth）

**XSS 过滤**：Axum 后端在输出任何 MDX HTML 结构前，必须经过严格配置白名单的 **DOMPurify** 清洗。

**权限与合规**：
- 遵循"最小权限"原则（RBAC）管理草稿与历史版本访问
- 为满足高阶信息安全政策，数据库持久化及传输链路需启用 **AES-256 加密**
- 应对监管要求，需部署定期轮询的清理任务与强加密的"抑制名单"，并维护不可篡改带有身份签名的 AST 变更审计日志

---

## 7. 测试覆盖矩阵

| 测试类型 | 测试内容 | 覆盖状态 |
|----------|----------|----------|
| 单元测试 | `loadToEditor` MDX → HTML 转换 | ✅ |
| 单元测试 | `saveToMdx` HTML → MDX 转换 | ✅ |
| 单元测试 | 空 math div 正则匹配（`[\s\S]*?`） | ✅ |
| 单元测试 | HTML 实体编解码 | ✅ |
| 集成测试 | 块级公式完整往返 | ✅ |
| 集成测试 | 行内公式完整往返 | ✅ |
| 集成测试 | 混合内容往返 | ✅ |
| 集成测试 | 复杂 LaTeX（矩阵）往返 | ✅ |
| E2E 测试 | 编辑器内输入数学公式 → 保存 → 刷新验证 | ⏳ 待手动验证 |

---

## 8. 已知限制与未来改进方向

### 8.1 当前架构局限

1. **块级/行内判定**：在已有内容的段落中输入 `$$` 时触发行内规则而非块级规则。在空段落中输入才会触发块级
2. **正则方案**：当前使用正则提取 `data-latex`，长期建议升级为 unified.js AST 双向转换管线（`remark-prosemirror`）以获得更健壮的解析能力
3. **Turndown 空格处理**：turndown 输出的块级公式格式为 `$$ formula $$`（有空格），这在大多数 Markdown 解析器中可正常识别，但非标准格式

### 8.2 未来改造路线图

1. **Remark-prosemirror 深层 AST 集成**：将正则方案升级为专业 AST 转换管线，彻底消除边界情况
2. **化学方程式支持**：利用相同的 NodeView 机制，扩展支持化学式（chemformula / mhchem）
3. **实时协作**：集成 Yjs + Hocuspocus 实现多人协同编辑
4. **视觉回归测试**：引入 Playwright 快照测试，覆盖数学公式渲染

---

*本文档为技术规范，最终实现请以代码为准。*
*更新于 2025-04-26*
