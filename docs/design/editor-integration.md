# 前端编辑器集成

> 来源：EDITOR_SYSTEM_DESIGN.md P2

## 目标

在 Next.js 16 中集成 TipTap 编辑器，解决 SSR 水合冲突，实现基础富文本编辑闭环。

## 水合冲突 (Hydration Mismatch) 四层隔离

```
第一层: 'use client' 指令
  └─ 声明编辑器组件为客户端组件

第二层: immediatelyRender: false
  └─ 强制 TipTap 延迟初始化到 useEffect 之后

第三层: next/dynamic + { ssr: false }
  └─ 从路由层面切断 SSR，实现代码分割

第四层: shouldRerenderOnTransaction: false
  └─ 阻止 TipTap 在每次事务时重新渲染 React 组件树
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

## 编辑器扩展列表

| 扩展 | TipTap 包 | 状态 |
|------|----------|------|
| 段落/标题/粗体/斜体/列表/引用/代码块 | StarterKit | ✅ |
| 下划线 | Underline | ✅ |
| 占位符提示 | Placeholder | ✅ |
| 块级数学公式 | BlockMath (Mathematics) | ✅ |
| 行内数学公式 | InlineMath (Mathematics) | ✅ |
| 图片 | Image | ✅ |
| 链接 | Link | ✅ |
| 文本对齐 | TextAlign | ✅ |
| 任务列表 | TaskList + TaskItem | ✅ |
| 排版改善 | Typography | ✅ |
| 代码高亮 | ShikiCodeBlock (取代 CodeBlockLowlight) | ✅ |
| 表格 | Table | ✅ |
| @提及 | Mention | ✅ |
| 缩进 | Indent | ✅ |
| 文字颜色 | Color | ✅ |
| 字号 | FontSize | ✅ |
| 行高 | LineHeight | ✅ |
| 文字方向 | TextDirection | ✅ |
| 更多 Mark | MoreMark | ✅ |
| 搜索替换 | SearchAndReplace | ✅ |
| KaTeX 数学渲染 | KatexExtension | ✅ |
| 视频嵌入 | VideoExtension | ✅ |
| Twitter 嵌入 | TwitterExtension | ✅ |
| 标注/提示框 | CalloutExtension | ✅ |

## 保存/加载闭环

```typescript
// 编辑器中提取 JSON 或 MDX
const json = editor.getJSON()

// 保存到后端 (需认证)
await fetch('/v1/admin/posts', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ content: json })
})

// 或提交 MDX 作为替代输入格式
await fetch('/v1/admin/posts', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ content_mdx: mdxString, format: 'mdx' })
})

// 从后端加载
const { content_json } = await fetch(`/v1/admin/posts/${slug}`)
editor.commands.setContent(content_json)
```
