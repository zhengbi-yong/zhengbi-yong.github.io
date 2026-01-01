# 前端架构

本文档介绍 Next.js 前端项目的架构和组织结构。

## 项目结构

```
frontend/
├── app/                    # Next.js App Router 页面
│   ├── blog/[...slug]/    # 动态博客路由
│   ├── tags/[...slug]/    # 标签过滤页面
│   ├── page.tsx           # 首页
│   ├── layout.tsx         # 根布局
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── MDXComponents/     # MDX 自定义组件
│   ├── analytics/         # 分析集成
│   ├── comments/          # 评论系统
│   ├── search/            # 搜索功能
│   ├── 3d/                # Three.js 可视化
│   ├── chemistry/         # 化学组件
│   ├── charts/            # 图表组件
│   └── music/             # 音乐组件
├── data/                  # 静态内容
│   ├── blog/[category]/   # 博客文章（按分类）
│   ├── authors/           # 作者信息
│   └── siteMetadata.ts    # 站点配置
├── layouts/               # 页面布局
│   ├── PostLayout.tsx     # 完整文章布局
│   ├── PostSimple.tsx     # 简洁布局
│   └── PostBanner.tsx     # 横幅布局
├── lib/                   # 工具库
│   ├── contentlayer.ts    # MDX 处理配置
│   └── utils.ts           # 工具函数
├── public/                # 静态资源
├── styles/                # 额外样式
└── middleware.ts          # Next.js 中间件
```

## 核心技术

### Next.js 16

**App Router**:
- 基于 React Server Components
- 文件系统路由
- 嵌套布局
- 数据流优化

**Turbopack**:
- 更快的开发服务器
- 增量构建
- HMR 优化

### TypeScript

**严格模式配置**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### Tailwind CSS 4

**配置**:
- 自定义主题变量
- 深色模式支持
- 响应式设计
- 插件扩展

### Contentlayer2

**MDX 处理管道**:
1. 读取 MDX 文件
2. 解析 frontmatter
3. 应用 remark/rehype 插件
4. 生成类型定义
5. 输出 JSON 数据

## 路由系统

### 文件路由

```
app/
├── page.tsx                    → /
├── about/
│   └── page.tsx               → /about
├── blog/
│   └── [...slug]/
│       └── page.tsx           → /blog/*  (Catch-all)
├── tags/
│   └── [...slug]/
│       └── page.tsx           → /tags/*  (Catch-all)
└── admin/
    └── page.tsx               → /admin
```

### 动态路由

**博客文章**:
```typescript
// app/blog/[...slug]/page.tsx
export default function BlogPost({ params }) {
  const { slug } = params
  // slug 是数组，如 ['computer', 'my-post']
}
```

**标签页面**:
```typescript
// app/tags/[...slug]/page.tsx
export default function TagPage({ params }) {
  const { slug } = params
}
```

## 数据流

### MDX 内容

```
data/blog/[category]/post.mdx
    ↓
contentlayer.ts (处理)
    ↓
生成所有文章的数据和类型
    ↓
页面组件使用 (getStaticProps / generateStaticParams)
    ↓
构建时生成静态 HTML
```

### 客户端数据

```typescript
// 使用 TanStack Query (SWR)
import useSWR from 'swr'

const { data, error } = useSWR('/api/posts', fetcher)
```

## 组件架构

### MDX 组件

自定义 MDX 组件映射：

```typescript
// components/MDXComponents/index.ts
export const mdxComponents = {
  h1: ({ children }) => <h1 className="text-4xl">{children}</h1>,
  h2: ({ children }) => <h2 className="text-3xl">{children}</h2>,
  // ... 其他映射
  ThreeViewer,  // 自定义组件
  MoleculeViewer,
  LineChart,
  // ...
}
```

### 布局组件

**PostLayout**:
```typescript
<PostLayout
  content={mdxContent}
  author={author}
  date={date}
  tags={tags}
/>
```

## 性能优化

### 静态生成

所有博客文章在构建时生成：

```typescript
export async function generateStaticParams() {
  const posts = allPosts.map((post) => ({
    slug: post._raw.flattenedPath.split('/'),
  }))
  return posts
}
```

### 图片优化

```typescript
import Image from 'next/image'

<Image
  src="/image.png"
  width={800}
  height={600}
  placeholder="blur"
/>
```

### 代码分割

```typescript
// 动态导入重型组件
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <div>Loading...</div>,
})
```

## 配置文件

### next.config.js

```javascript
module.exports = {
  // SWC 压缩
  swcMinify: true,

  // 图片域名
  images: {
    domains: ['example.com'],
  },

  // 导出模式（GitHub Pages）
  output: 'export',
  basePath: process.env.BASE_PATH || '',
}
```

### tailwind.config.js

```javascript
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { /* ... */ },
      },
    },
  },
}
```

### contentlayer.ts

```typescript
export default makeSource({
  contentDirPath: 'data/blog',
  documentTypes: [Blog, Author, Tag],
  mdx: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex, rehypePrismPlus],
  },
})
```

## 开发流程

### 1. 启动开发服务器

```bash
cd frontend
pnpm dev
```

### 2. 编辑组件

组件支持 HMR（热模块替换）。

### 3. 添加新页面

在 `app/` 目录下创建 `page.tsx`。

### 4. 构建生产版本

```bash
pnpm build
```

### 5. 预览构建

```bash
pnpm start
```

## 关键特性

### 服务端组件

```typescript
// 默认服务端组件
async function BlogList() {
  const posts = await getPosts()
  return <div>{posts.map(/* ... */)}</div>
}
```

### 客户端组件

```typescript
'use client'

export function InteractiveChart() {
  const [data, setData] = useState([])
  // ... 交互逻辑
}
```

### 中间件

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // 重定向逻辑
  // 响应头设置
}
```

## 相关文档

- [组件文档](./components.md) - 组件列表和用法
- [样式系统](./styling.md) - Tailwind CSS 配置
- [Refine 集成](./refine-integration.md) - 管理后台
- [后端架构](./backend/overview.md) - API 对接

---

**最后更新**: 2025-12-27
