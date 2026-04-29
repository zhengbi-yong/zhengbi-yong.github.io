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
| 代码块 | ShikiCodeBlock (自定义 Shiki 高亮扩展，替代 CodeBlockLowlight) | ✅ |
| 引用 | Blockquote | ✅ |
| 表格 | Table (来自 reactjs-tiptap-editor) | ✅ |
| 图片 | Image | ✅ |
| 数学公式 (行内) | InlineMath (imported from `./extensions/mathematics-extended`) | ✅ |
| 数学公式 (块级) | BlockMath (imported from `./extensions/mathematics-extended`) | ✅ |
| 下划线 | Underline | ✅ |
| 文本对齐 | TextAlign | ✅ |
| 任务列表 | TaskList + TaskItem | ✅ |
| 排版优化 | Typography | ✅ |
| 占位符 | Placeholder | ✅ |
| 提及 (@) | Mention (来自 reactjs-tiptap-editor) | ✅ |
| 缩进 | Indent (来自 reactjs-tiptap-editor) | ✅ |
| 文字颜色 | Color (来自 reactjs-tiptap-editor) | ✅ |
| 字号 | FontSize (来自 reactjs-tiptap-editor) | ✅ |
| 行高 | LineHeight (来自 reactjs-tiptap-editor) | ✅ |
| 文字方向 | TextDirection (来自 reactjs-tiptap-editor) | ✅ |
| 额外标记 | MoreMark (来自 reactjs-tiptap-editor) | ✅ |
| 搜索替换 | SearchAndReplace (来自 reactjs-tiptap-editor) | ✅ |
| KaTeX 工具栏 | KatexExtension (来自 reactjs-tiptap-editor) | ✅ |
| 视频 | VideoExtension (来自 reactjs-tiptap-editor) | ✅ |
| Twitter 嵌入 | TwitterExtension (来自 reactjs-tiptap-editor) | ✅ |
| 标注块 | CalloutExtension (来自 reactjs-tiptap-editor) | ✅ |
| 历史撤销 | StarterKit 内置 (UndoHistory 是 StarterKit 的一部分) | ✅ |

## 自动保存 (Auto-save via useDraft)

自动保存使用客户端 `sessionStorage` 草稿机制，通过 `useDraft` hook 实现，不涉及 API 请求。

```typescript
// frontend/src/lib/hooks/useDraft.ts
// 自动保存行为：内容变化后 2 秒防抖写入 sessionStorage
export function useDraft(existingDraftId?: string) {
  const [drafts, setDrafts] = useState<Draft[]>([])

  const saveDraft = useCallback((draft: Draft) => {
    // 更新或新增草稿，持久化到 sessionStorage
    setDrafts(prev => {
      const idx = prev.findIndex(d => d.id === draft.id)
      let updated: Draft[]
      if (idx >= 0) {
        updated = [...prev]
        updated[idx] = draft
      } else {
        updated = [draft, ...prev]
      }
      saveDraftsToStorage(updated)
      return updated
    })
  }, [])
  // ...
}
```

**行为**：
- 草稿存储在 `sessionStorage`（浏览器关闭即清除）
- 2 秒防抖自动保存（由调用方在组件中通过 `useEffect` + `setTimeout` 实现）
- 支持草稿列表查看、恢复、删除
- 自动恢复上次编辑内容
- **不涉及任何 API/后端调用**（后端无对应接口）

对比旧方案（已废弃）：
- ~~`GET /api/v1/drafts/latest` — 查询最新草稿~~
- ~~`POST /api/v1/drafts` — 保存草稿到后端~~

## 版本历史字段名不一致

`PostVersionsPage`（`frontend/src/app/(admin)/admin/posts/versions/[...slug]/page.tsx`）中使用 `created_by_username`：

```typescript
{version.created_by_username || version.created_by}
```

但后端 API 返回的字段为 `created_by_name`（见 `backend/crates/api/src/routes/versions.rs`）：

```sql
u.username as "created_by_name?"
```

这是一个已知的字段名不匹配（**前端需改为 `created_by_name`**），当前代码使用 `||` 回退来避免显示空白。
