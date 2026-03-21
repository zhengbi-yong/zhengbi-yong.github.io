# 顶级文章编辑器实现文档

## 项目概述

基于 Next.js 16 和 Axum 的现代富文本编辑器，采用 Tiptap 作为核心引擎，实现 Notion 风格的极简 UI 和强大的编辑功能。

## 技术栈

### 核心框架
- **Tiptap**: 基于 ProseMirror 的无头编辑器框架
- **Next.js 16**: React 服务端渲染框架
- **Axum**: Rust 异步 Web 框架（后端）
- **PostgreSQL**: 关系型数据库

### UI 和样式
- **Tailwind CSS**: 原子化 CSS 框架
- **Shadcn UI**: 高质量 React 组件库
- **KaTeX**: 数学公式渲染引擎
- **Lowlight**: 代码高亮引擎

## 功能特性

### ✅ 已实现功能

#### 1. 富文本编辑
- ✅ 标题（H1, H2, H3）
- ✅ 文本格式（粗体、斜体、下划线、删除线）
- ✅ 列表（有序、无序、任务列表）
- ✅ 引用块
- ✅ 代码块（支持语法高亮）
- ✅ 图片插入
- ✅ 链接插入
- ✅ 文本对齐（左、中、右）
- ✅ 水平线

#### 2. Markdown 支持
- ✅ 实时 Markdown 转换（所见即所得）
- ✅ 输入规则（# 标题，- 列表，``` 代码块）
- ✅ 浮动菜单（/ 命令面板）

#### 3. 代码高亮
- ✅ 支持多种编程语言
- ✅ 按需加载语言包（性能优化）
- ✅ One Dark / GitHub Light 主题

#### 4. 数学公式
- ✅ 行内公式（$...$）
- ✅ 块级公式（$$...$$）
- ✅ KaTeX 渲染引擎
- ✅ 错误容错（throwOnError: false）

#### 5. 元数据管理
- ✅ 文章标题（大标题编辑区）
- ✅ 文章摘要（多行文本框）
- ✅ 分类选择（下拉菜单）
- ✅ 标签多选（搜索 + 创建）

#### 6. SSR 防护
- ✅ 动态导入（dynamic import）
- ✅ 客户端渲染（ssr: false）
- ✅ 加载状态处理

#### 7. 发布功能
- ✅ 表单验证
- ✅ 状态锁定（防止重复提交）
- ✅ 成功/错误提示
- ✅ 自动跳转到文章页

## 组件结构

```
src/components/editor/
├── TiptapEditor.tsx          # 核心编辑器组件
├── EditorToolbar.tsx         # 工具栏组件
├── FloatingMenu.tsx          # 浮动菜单（/ 命令）
└── ArticleMetadata.tsx       # 元数据管理组件

src/app/admin/posts/new/
└── page.tsx                  # 新建文章页面
```

## 使用方法

### 1. 访问编辑器

```bash
# 启动前端
cd frontend
pnpm dev

# 访问编辑器页面
http://localhost:3001/admin/posts/new
```

### 2. 撰写文章

#### 编辑元数据
1. **标题**: 在顶部大标题区域输入文章标题
2. **摘要**: 在标题下方输入简短摘要
3. **分类**: 从下拉菜单选择分类
4. **标签**: 搜索并选择标签（支持多选）

#### 编辑正文
1. **输入标题**: 输入 `# ` + 空格 创建一级标题
2. **创建列表**: 输入 `- ` + 空格 创建列表项
3. **插入代码**: 输入 ``` 创建代码块
4. **插入公式**: 输入 `$E=mc^2$` 插入行内公式
5. **快速命令**: 输入 `/` 打开浮动菜单

### 3. 发布文章

- **保存草稿**: 点击"保存草稿"按钮
- **发布文章**: 点击"发布文章"按钮
- **预览**: 点击"预览"按钮在新窗口查看效果

## 技术亮点

### 1. 性能优化

#### 代码分割
```typescript
const TiptapEditor = dynamic(
  () => import('@/components/editor/TiptapEditor'),
  { ssr: false }
)
```

#### 按需加载
```typescript
const lowlight = createLowlight(common)
// 只加载常用语言，避免包体积膨胀
```

### 2. SSR 防护

#### 编辑器层面
```typescript
useEditor({
  immediatelyRender: false, // 阻止服务端渲染
})
```

#### 组件层面
```typescript
dynamic(() => import(...), {
  ssr: false, // 完全禁用 SSR
  loading: () => <Skeleton />
})
```

### 3. 错误处理

#### 数学公式
```typescript
Mathematics.configure({
  katexOptions: {
    throwOnError: false, // 不会因语法错误崩溃
  },
})
```

#### 数据验证
```typescript
const validateForm = (): boolean => {
  if (!title.trim()) return false
  if (!category) return false
  // ...
}
```

### 4. 用户体验

#### 视觉反馈
- 加载动画（骨架屏）
- 成功/错误提示
- 按钮状态（禁用/加载中）

#### 键盘支持
- `Ctrl+B`: 粗体
- `Ctrl+I`: 斜体
- `Ctrl+Z`: 撤销
- `Ctrl+Shift+Z`: 重做
- `/`: 快捷命令
- `Enter`: 确认输入
- `Esc`: 取消输入

## 数据流

```
用户输入（编辑器）
    ↓
Tiptap 状态管理
    ↓
HTML / Markdown 序列化
    ↓
前端状态（React State）
    ↓
API 请求（POST /api/v1/posts）
    ↓
Axum 后端处理
    ↓
PostgreSQL 存储
    ↓
前端展示（/blog/[slug]）
```

## 后端集成

### API 端点

```typescript
POST http://localhost:3000/api/v1/posts
Content-Type: application/json

{
  "title": "文章标题",
  "slug": "article-slug",
  "summary": "文章摘要",
  "content": "<p>文章内容（HTML）</p>",
  "status": "Published",
  "category_id": "uuid",
  "tag_ids": ["uuid1", "uuid2"]
}
```

### 数据库 Schema

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  summary TEXT,
  content TEXT, -- 或 content_markdown TEXT
  status post_status NOT NULL,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 样式定制

### Tailwind CSS 类

编辑器使用了 `@tailwindcss/typography` 插件的 `prose` 类：

```typescript
className="prose prose-lg dark:prose-invert max-w-none"
```

### 自定义样式

```typescript
prose-h1:text-3xl        // 一级标题大小
prose-p:leading-relaxed  // 段落行高
prose-a:text-blue-600    // 链接颜色
prose-pre:bg-gray-900    // 代码块背景
```

## 未来增强

### 计划功能

- [ ] AI 辅助写作（集成 Vercel AI SDK）
- [ ] 协作编辑（CRDT）
- [ ] 版本历史（Post 版本控制）
- [ ] 图片上传（本地存储）
- [ ] 文章模板
- [ ] 自动保存（防丢失）
- [ ] 导出功能（PDF/Markdown）
- [ ] 字数统计
- [ ] 阅读时间估算

### 性能优化

- [ ] 虚拟滚动（超大文档）
- [ ] Web Worker（代码高亮）
- [ ] IndexedDB（离线缓存）
- [ ] Service Worker（PWA）

## 故障排除

### 问题 1: 编辑器无法加载

**症状**: 页面显示加载动画，编辑器不显示

**解决方案**:
```typescript
// 检查是否正确使用 dynamic import
const TiptapEditor = dynamic(
  () => import('@/components/editor/TiptapEditor'),
  { ssr: false }
)
```

### 问题 2: 水合错误

**症状**: 控制台报错 "Hydration failed"

**解决方案**:
```typescript
// 确保 immediatelyRender: false
useEditor({
  immediatelyRender: false,
})
```

### 问题 3: 数学公式不渲染

**症状**: 显示原始 LaTeX 代码

**解决方案**:
```typescript
// 检查是否导入了 KaTeX 样式
import 'katex/dist/katex.min.css'
```

### 问题 4: 代码高亮不工作

**症状**: 代码块没有颜色

**解决方案**:
```typescript
// 检查是否注册了语言包
import { common } from 'lowlight'
const lowlight = createLowlight(common)
```

## 参考资源

- [Tiptap 官方文档](https://tiptap.dev/docs)
- [Novel.sh](https://novel.sh) - Notion 风格编辑器示例
- [Shadcn UI](https://ui.shadcn.com) - React 组件库
- [ProseMirror](https://prosemirror.net/) - 底层编辑器框架
- [KaTeX 文档](https://katex.org/docs) - 数学公式引擎
- [Lowlight](https://github.com/shikijs/lowlight) - 代码高亮

## 许可证

MIT License - 与项目整体许可证一致

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 配置
- 添加注释和文档
- 编写单元测试

---

**创建时间**: 2026-03-21
**版本**: 1.0.0
**作者**: 基于 Claude Code 生成
