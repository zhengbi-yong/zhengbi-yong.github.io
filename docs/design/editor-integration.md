# 前端编辑器集成

> 来源：架构设计文档 P2

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
  () => Promise.resolve(RichTextEditorInner),
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

## 编辑器核心功能

|| 功能 | TipTap 扩展 | 来源包 | 状态 |
||------|------------|--------|------|
|| 段落/标题 | StarterKit | `@tiptap/starter-kit` | ✅ |
|| 粗体/斜体 | StarterKit | `@tiptap/starter-kit` | ✅ |
|| 下划线 | Underline | `@tiptap/extension-underline` | ✅ |
|| 列表 (有序/无序) | StarterKit | `@tiptap/starter-kit` | ✅ |
|| 任务列表 | TaskList + TaskItem | `@tiptap/extension-task-list` + `@tiptap/extension-task-item` | ✅ |
|| 链接 | Link | `@tiptap/extension-link` | ✅ |
|| 代码块 (语法高亮) | ShikiCodeBlock | 自定义扩展 (替代 CodeBlockLowlight) | ✅ |
|| 引用 | Blockquote (StarterKit) | `@tiptap/starter-kit` | ✅ |
|| 表格 | Table | `reactjs-tiptap-editor/table` | ✅ |
|| 图片 | Image | `@tiptap/extension-image` | ✅ |
|| 数学公式 | BlockMath + InlineMath | 自定义扩展 (基于 `@tiptap/extension-mathematics`) | ✅ |
|| 历史撤销 | UndoHistory (StarterKit) | `@tiptap/starter-kit` | ✅ |
|| 排版增强 | Typography | `@tiptap/extension-typography` | ✅ |
|| 文本对齐 | TextAlign | `@tiptap/extension-text-align` | ✅ |
|| 占位符 | Placeholder | `@tiptap/extension-placeholder` | ✅ |
|| 提及 | Mention | `reactjs-tiptap-editor/mention` | ✅ |
|| 缩进 | Indent | `reactjs-tiptap-editor/indent` | ✅ |
|| 颜色 | Color | `reactjs-tiptap-editor/color` | ✅ |
|| 字号 | FontSize | `reactjs-tiptap-editor/fontsize` | ✅ |
|| 行高 | LineHeight | `reactjs-tiptap-editor/lineheight` | ✅ |
|| 文字方向 | TextDirection | `reactjs-tiptap-editor/textdirection` | ✅ |
|| 更多标记 | MoreMark | `reactjs-tiptap-editor/moremark` | ✅ |
|| 搜索替换 | SearchAndReplace | `reactjs-tiptap-editor/searchandreplace` | ✅ |
|| KaTeX 工具栏 | KatexExtension | `reactjs-tiptap-editor/katex` | ✅ |
|| 视频 | VideoExtension | `reactjs-tiptap-editor/video` | ✅ |
|| Twitter 嵌入 | TwitterExtension | `reactjs-tiptap-editor/twitter` | ✅ |
|| 标注框 | CalloutExtension | `reactjs-tiptap-editor/callout` | ✅ |

## 保存/加载闭环

```typescript
// 编辑器中提取 JSON
const json = editor.getJSON()

// 保存到后端
await fetch('/api/v1/admin/posts', {
  method: 'POST',
  body: JSON.stringify({ content: json })
})

// 从后端加载
const { content_json } = await fetch(`/api/v1/admin/posts/${slug}`)
editor.commands.setContent(content_json)
```
