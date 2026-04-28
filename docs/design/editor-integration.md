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

// SSR 禁用 — 使用 Promise.resolve 模式直接引用组件
const TiptapEditor = dynamic(
  () => Promise.resolve(RichTextEditorInner),
  { ssr: false }
)

export default function EditorPage({ params }: { params: { id: string } }) {
  return (
    <div>
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
| 下划线 | Underline | ✅ |
| 列表 (有序/无序) | StarterKit | ✅ |
| 任务列表 | TaskList + TaskItem | ✅ |
| 链接 | Link | ✅ |
| 代码块 | ShikiCodeBlock (高亮) | ✅ |
| 引用 | Blockquote | ✅ |
| 表格 | Table (reactjs-tiptap-editor) | ✅ |
| 图片 | Image | ✅ |
| 视频 | VideoExtension (reactjs-tiptap-editor) | ✅ |
| 数学公式 | BlockMath + InlineMath (扩展自 @tiptap/extension-mathematics) | ✅ |
| 历史撤销 | UndoHistory (StarterKit) | ✅ |
| 文本对齐 | TextAlign | ✅ |
| 占位符 | Placeholder | ✅ |
| 排版优化 | Typography | ✅ |
| 缩进 | Indent | ✅ |
| 文字颜色 | Color | ✅ |
| 字号 | FontSize | ✅ |
| 行高 | LineHeight | ✅ |
| 文本方向 | TextDirection | ✅ |
| 更多标记 | MoreMark | ✅ |
| 搜索替换 | SearchAndReplace | ✅ |
| Twitter 嵌入 | TwitterExtension | ✅ |
| 标注 | CalloutExtension | ✅ |
| 提及 | Mention | ✅ |

## 保存/加载闭环

```typescript
// 编辑器中提取 JSON
const json = editor.getJSON()

// 保存到后端
await fetch('/api/v1/admin/posts', {
  method: 'POST',
  body: JSON.stringify({
    content_json: json,
    content_mdx: saveToMdx(editor.getHTML())
  })
})

// 从后端加载
const { content_json } = await fetch(`/api/v1/admin/posts/${slug}`)
editor.commands.setContent(content_json)
```
