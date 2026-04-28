# 前端编辑器集成

> 来源：EDITOR_SYSTEM_DESIGN.md P2

## 目标

在 Next.js 16 中集成 TipTap 编辑器，解决 SSR 水合冲突，实现基础富文本编辑闭环。

## 水合冲突 (Hydration Mismatch) 三层隔离

```
第一层: 'use client' 指令
  └─ 声明编辑器组件为客户端组件

第二层: immediatelyRender: false
  └─ 强制 TipTap 延迟初始化到 useEffect 之后

第三层: next/dynamic + { ssr: false }
  └─ 从路由层面切断 SSR，实现代码分割
```

## 实现模式

```typescript
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import dynamic from 'next/dynamic'

// SSR 禁用
const TiptapEditor = dynamic(
  () => import('@/components/editor/TiptapEditor'),
  { ssr: false }
)

export default function EditorPage({ params }: { params: { id: string } }) {
  return (
    <div suppressHydrationWarning>
      <TiptapEditor articleId={params.id} />
    </div>
  )
}
```

## 编辑器扩展列表（~25+ 扩展）

实际编辑器（`frontend/src/components/editor/TiptapEditor.tsx`）使用的扩展：

| 功能 | 扩展来源 | 说明 |
|------|---------|------|
| 段落/标题/粗体/斜体/代码/引用/列表 | `StarterKit` | 禁用 `link`, `underline`，保留 `codeBlock` 命令 |
| 下划线 | `@tiptap/extension-underline` | 独立扩展 |
| 链接 | `@tiptap/extension-link` | 禁用 `openOnClick` |
| 代码块（语法高亮） | `ShikiCodeBlock` | 自定义扩展，priority:100，替换 StarterKit 的 codeBlock 渲染 |
| 块级/行内公式 | `BlockMath`, `InlineMath` | 自定义扩展，带 React NodeView 实时 KaTeX 渲染 |
| 表格 | `reactjs-tiptap-editor/table` | 可调整大小 |
| 任务列表 | `@tiptap/extension-task-list` + `@tiptap/extension-task-item` | 嵌套支持 |
| 图片 | `@tiptap/extension-image` | 内联禁用 |
| 视频 | `reactjs-tiptap-editor/video` | |
| 提及 | `reactjs-tiptap-editor/mention` | |
| 文本对齐 | `@tiptap/extension-text-align` | 左/中/右 |
| 缩进 | `reactjs-tiptap-editor/indent` | |
| 颜色/字号/行高 | `reactjs-tiptap-editor/color`, `fontsize`, `lineheight` | |
| 文字方向 | `reactjs-tiptap-editor/textdirection` | |
| 更多 Mark | `reactjs-tiptap-editor/moremark` | |
| 搜索替换 | `reactjs-tiptap-editor/searchandreplace` | |
| 排版 | `@tiptap/extension-typography` | 智能引号、em-dash 等 |
| KaTeX 工具栏 | `reactjs-tiptap-editor/katex` | 工具栏命令 |
| Twitter 嵌入 | `reactjs-tiptap-editor/twitter` | |
| Callout 提示框 | `reactjs-tiptap-editor/callout` | |
| 占位提示 | `@tiptap/extension-placeholder` | "开始写作..." |

> 注：`ShikiCodeBlock` 为自定义扩展，替换了 StarterKit 的 codeBlock 渲染（而非命令），实现 Shiki 语法高亮。

## 保存/加载闭环

```typescript
// 编辑器中提取 JSON
const json = editor.getJSON()

// 保存到后端 (实际 API 路径)
await fetch('/api/v1/admin/posts', {
  method: 'POST',
  body: JSON.stringify({ content: json })
})

// 从后端加载
const { content_json } = await fetch(`/api/v1/posts/${slug}`)
editor.commands.setContent(content_json)
```

> 注意：写 API 路径为 `/api/v1/admin/posts`（带 `admin`），读 API 路径为 `/api/v1/posts/{slug}`（公开）。
