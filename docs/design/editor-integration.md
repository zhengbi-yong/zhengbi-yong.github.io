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

| 功能 | TipTap 扩展 | 来源 | 状态 |
|------|------------|------|------|
| 段落/标题 | StarterKit 内置 | `@tiptap/starter-kit` | ✅ |
| 粗体/斜体 | StarterKit 内置 | `@tiptap/starter-kit` | ✅ |
| 下划线 | Underline | `@tiptap/extension-underline` | ✅ |
| 删除线 | StarterKit 内置 | `@tiptap/starter-kit` | ✅ |
| 列表 (有序/无序) | StarterKit 内置 | `@tiptap/starter-kit` | ✅ |
| 任务列表 | TaskList + TaskItem | `@tiptap/extension-task-list` + `@tiptap/extension-task-item` | ✅ |
| 链接 | Link | `@tiptap/extension-link` | ✅ |
| 代码块 (Shiki 高亮) | ShikiCodeBlock (自定义) | `./extensions/ShikiCodeBlock` | ✅ |
| 行内代码 | StarterKit 内置 | `@tiptap/starter-kit` | ✅ |
| 引用 | StarterKit 内置 (Blockquote) | `@tiptap/starter-kit` | ✅ |
| 表格 (可调整列宽) | Table | `reactjs-tiptap-editor/table` | ✅ |
| 图片 | Image | `@tiptap/extension-image` | ✅ |
| 视频 | VideoExtension | `reactjs-tiptap-editor/video` | ✅ |
| 数学公式 | BlockMath + InlineMath (自定义 React NodeView) | `./extensions/mathematics-extended` | ✅ |
| Katex 公式 | KatexExtension (工具栏命令) | `reactjs-tiptap-editor/katex` | ✅ |
| 文本对齐 | TextAlign | `@tiptap/extension-text-align` | ✅ |
| 文本颜色 | Color | `reactjs-tiptap-editor/color` | ✅ |
| 字号 | FontSize | `reactjs-tiptap-editor/fontsize` | ✅ |
| 行高 | LineHeight | `reactjs-tiptap-editor/lineheight` | ✅ |
| 文字方向 | TextDirection | `reactjs-tiptap-editor/textdirection` | ✅ |
| 缩进 | Indent | `reactjs-tiptap-editor/indent` | ✅ |
| 提及 (@用户) | Mention | `reactjs-tiptap-editor/mention` | ✅ |
| 嵌入式推文 | TwitterExtension | `reactjs-tiptap-editor/twitter` | ✅ |
| 标注块 | CalloutExtension | `reactjs-tiptap-editor/callout` | ✅ |
| 额外标记 | MoreMark | `reactjs-tiptap-editor/moremark` | ✅ |
| 搜索替换 | SearchAndReplace | `reactjs-tiptap-editor/searchandreplace` | ✅ |
| 排版美化 | Typography | `@tiptap/extension-typography` | ✅ |
| 占位符 | Placeholder | `@tiptap/extension-placeholder` | ✅ |
| 历史撤销 | StarterKit 内置 (UndoHistory) | `@tiptap/starter-kit` | ✅ |

## 保存/加载闭环

```typescript
// 编辑器中提取 JSON
const json = editor.getJSON()
const mdxContent = await saveToMdx(json)  // TipTap JSON → MDX

// 通过 PATCH 请求同时保存 JSON AST 和 MDX（双轨存储）
// POST /api/v1/admin/posts/{slug} 使用 PATCH 语义
await adminService.updatePost(postId, {
  content_json: json,           // TipTap JSON AST（写入侧单一事实来源）
  content_mdx: mdxContent,      // MDX 纯文本（读取侧优化视图）
  content_format: 'mdx',        // 标记内容格式为 mdx
})

// 从后端加载（优先使用 content_json 直接注入编辑器）
const { content_json, content_mdx } = await postService.getPost(slug)
if (content_json) {
  // 优先使用 content_json 注入编辑器（无信息丢失）
  editor.commands.setContent(content_json)
} else if (content_mdx) {
  // 降级：MDX → TipTap JSON（通过 loadToEditor 桥接）
  const tiptapJson = loadToEditor(content_mdx)
  editor.commands.setContent(tiptapJson)
}
```

> **注意**：当前未实现自动保存（autosave）。用户必须手动点击"保存草稿"或"更新并发布"按钮。编辑器修改后需主动触发保存操作，未保存更改在页面刷新后丢失。
