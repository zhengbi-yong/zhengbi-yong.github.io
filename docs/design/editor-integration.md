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
| 代码块 | ShikiCodeBlock (自定义 Shiki 高亮扩展，替代 CodeBlockLowlight) | ❌ 已删除（文件已从仓库移除） |
| 引用 | Blockquote | ✅ |
| 表格 | Table (来自 reactjs-tiptap-editor) | ❌ 注释待修复 |
| 图片 | Image | ✅ |
| 数学公式 (行内) | InlineMath (imported from `reactjs-tiptap-editor/katex`) | ✅ |
| 数学公式 (块级) | BlockMath (imported from `reactjs-tiptap-editor/katex`) | ✅ |
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

## 保存/发布数据流 (Save/Publish Data Flow)

不同于自动保存（本地 `sessionStorage`），实际的发布/保存操作通过后端 API 写入数据库。

### API 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/v1/admin/posts` | 创建新文章 |
| `PATCH` | `/v1/admin/posts/{slug}` | 更新已有文章 |
| `GET` | `/v1/admin/posts` | 文章列表（管理后台） |
| `DELETE` | `/v1/admin/posts/{slug}` | 删除文章 |

### 双轨存储模式 (Dual-track Pattern)

编辑器中点击"保存"时，前端仅发送 `content_json` 字段，后端根据 `content_json` 自动派生 `content_mdx`：

```json
{
  "title": "文章标题",
  "content_json": { "type": "doc", "content": [...] },
  "status": "draft"
}
```

- **`content_json`**: TipTap `editor.getJSON()` 输出的 ProseMirror AST（JSONB 列，单一事实来源）
- **`content_mdx`**: 后端通过 `tiptap_json_to_mdx()` 自动派生（TEXT 列，SSR/SSG 优化）

后端行为：
- 如果请求体包含 `content_mdx`（兼容旧客户端），直接存入
- 如果 `content_mdx` 缺失但提供了 `content_json`，后端通过 `tiptap_json_to_mdx()` 自动派生
- 三级降级策略：`content_mdx` → 从 `content_json` 实时转换 → 旧 `content` 列

### Post 版本控制

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/v1/admin/posts/{post_id}/versions` | 创建版本快照 |
| `GET` | `/v1/admin/posts/{post_id}/versions` | 列出所有版本 |
| `GET` | `/v1/admin/posts/{post_id}/versions/{version_number}` | 获取特定版本 |
| `POST` | `/v1/admin/posts/{post_id}/versions/{version_number}/restore` | 回滚到某版本 |
| `DELETE` | `/v1/admin/posts/{post_id}/versions/{version_number}` | 删除版本 |
| `GET` | `/v1/admin/posts/{post_id}/versions/compare` | 比较两个版本 |

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

## 认证方式 (Authentication)

与常见的 `Authorization: Bearer <token>` 模式不同，本系统的认证使用 **HttpOnly Cookie** 方式：

### 认证流程

1. **登录**：`POST /v1/auth/login` 成功后，后端在响应中设置两个 HttpOnly cookie：
   - `access_token` — 短期 token（15 分钟有效期，HttpOnly，Secure）
   - `refresh_token` — 长期 token（7 天有效期，HttpOnly，Secure，SameSite=Lax）
   - `XSRF-TOKEN` — CSRF 保护 token（HttpOnly=false，前端可读）

2. **前端发送请求**：使用 `credentials: 'include'` 自动携带 cookies，无需手动设置 `Authorization` header
   ```typescript
   fetch('/v1/admin/posts', {
     method: 'POST',
     credentials: 'include',  // 自动发送 HttpOnly cookies
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(data),
   })
   ```

3. **CSRF 保护**：对于所有写请求（POST/PATCH/DELETE），前端需从 `XSRF-TOKEN` cookie 读取 token，并设置为 `X-CSRF-Token` 请求头（注意：实际代码使用 `X-CSRF-Token` 而非文档中常见的 `X-XSRF-TOKEN`）
   ```typescript
   const xsrfToken = document.cookie
     .split('; ')
     .find(row => row.startsWith('XSRF-TOKEN='))
     ?.split('=')[1]
   ```

4. **CORS 配置**：后端 `CorsLayer` 已配置 `allow_credentials(true)`，开发环境允许所有来源，生产环境严格验证

### 为什么不用 Bearer Token？

| 对比项 | HttpOnly Cookie | Bearer Token |
|--------|----------------|--------------|
| XSS 防护 | ✅ Token 对 JS 不可见 | ❌ Token 暴露于 JS 内存 |
| CSRF 防护 | 需额外 CSRF token | ✅ 需额外配置 |
| 移动端兼容 | 需额外适配 | ✅ 原生友好 |
| 实现复杂度 | 较低（浏览器自动管理） | 较高（需手动刷新） |

## 图片上传流程 (Image Upload)

编辑器插入图片时，支持通过 XHR 上传到后端媒体存储：

### API 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/v1/admin/media/upload` | 上传媒体文件 (multipart/form-data) |

### 上传流程

1. 用户通过工具栏"图片"按钮或斜杠命令选择上传
2. 前端构造 `multipart/form-data` 请求，包含文件数据和 CSRF token
3. 后端接收并处理，返回 `MediaListItem`（含 `url`、`media_type`、`alt_text` 等）
4. 前端将返回的 URL 插入编辑器内容

```typescript
const formData = new FormData()
formData.append('file', file)

const xsrfToken = document.cookie
  .match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)?.[1] || ''

const response = await fetch('/api/v1/admin/media/upload', {
  method: 'POST',
  credentials: 'include',
  headers: { 'X-CSRF-Token': xsrfToken },
  body: formData,
})
```

其他媒体管理端点：
- `GET /v1/admin/media` — 媒体库列表
- `GET /v1/admin/media/{id}` — 获取媒体详情
- `PATCH /v1/admin/media/{id}` — 更新媒体信息
- `DELETE /v1/admin/media/{id}` — 删除媒体

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
