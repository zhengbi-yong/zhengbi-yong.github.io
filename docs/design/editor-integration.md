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

## 编辑器核心功能

| 功能 | TipTap 扩展 | 状态 |
|------|------------|------|
| 段落/标题 | StarterKit | ✅ |
| 粗体/斜体 | StarterKit | ✅ |
| 列表 (有序/无序) | StarterKit | ✅ |
| 链接 | Link | ✅ |
| 代码块 | ShikiCodeBlock | ✅ 自定义 shiki 扩展（替代 CodeBlockLowlight） |
| 引用 | Blockquote | ✅ |
| 表格 | Table | ✅ |
| 图片 | Image | ✅ |
| 视频 | VideoExtension (reactjs-tiptap-editor) | ✅ |
| 数学公式 | Mathematics (BlockMath/InlineMath) + KatexExtension | ✅ |
| 历史撤销 | UndoHistory | ✅ |
| Twitter 嵌入 | TwitterExtension (reactjs-tiptap-editor) | ✅ |

## 保存/加载闭环

```typescript
// 编辑器中提取 JSON
const json = editor.getJSON()

// 保存到后端（管理员端点）
await fetch('/api/v1/admin/posts', {
  method: 'POST',
  body: JSON.stringify({ content: json })
})

// 从后端加载（管理员端点）
const post = await fetch(`/api/v1/admin/posts/${slug}`)
const { content_json } = await post.json()
editor.commands.setContent(content_json)
```
