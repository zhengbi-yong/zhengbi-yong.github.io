# 项目架构文档

## 概述

Zhengbi Yong's Blog 是一个基于 Next.js 16 构建的现代博客平台，采用最新的 Web 技术栈，提供高性能、可访问性良好的用户体验。

## 技术栈

### 核心框架
- **Next.js 16** - React 全栈框架，使用 App Router 和 Turbopack
- **React 19.2.1** - UI 库
- **TypeScript** - 类型安全的 JavaScript

### 样式与 UI
- **Tailwind CSS 4** - 原子化 CSS 框架
- **Framer Motion** - 动画库
- **Radix UI** - 无样式组件库
- **Lucide React** - 图标库

### 内容管理
- **Contentlayer2** - MDX/Markdown 处理
- **MDX** - Markdown 扩展
- **Gray Matter** - Frontmatter 解析
- **Remark/Rehype** - Markdown 插件

### 开发工具
- **Vitest** - 测试框架
- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **Husky** - Git hooks
- **Storybook** - 组件文档

### 监控与分析
- **Sentry** - 错误监控
- **Umami** - 网站分析
- **Vercel Analytics** - 性能分析

## 目录结构

```
zhengbi-yong.github.io/
├── app/                     # Next.js App Router
│   ├── blog/              # 博客相关页面
│   │   ├── category/      # 分类页面
│   │   └── [...slug]/     # 文章页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx          # 首页
│   └── globals.css       # 全局样式
├── components/             # React 组件
│   ├── ui/               # UI 基础组件
│   ├── seo/              # SEO 组件
│   ├── hooks/            # 自定义 Hooks
│   ├── animations/       # 动画组件
│   └── layouts/          # 页面布局
├── data/                  # 数据文件
│   ├── blog/             # 博客文章
│   └── siteMetadata.ts   # 站点配置
├── layouts/               # 布局组件
├── lib/                   # 工具库
│   ├── cache/           # 缓存管理
│   ├── store/           # 状态管理
│   └── utils/           # 工具函数
├── public/               # 静态资源
├── scripts/              # 构建脚本
└── styles/               # 样式文件
```

## 核心功能模块

### 1. 内容管理系统

#### 数据流程
```
MDX Files → Contentlayer → Type Definitions → React Components
```

#### 关键文件
- `lib/contentlayer.config.js` - Contentlayer 配置
- `data/blog/` - 文章数据
- `scripts/generate-search.mjs` - 搜索索引生成

### 2. 搜索系统

#### 实现方式
- 使用 KBar 作为搜索 UI
- 本地搜索索引（JSON）
- 支持文章和页面搜索

#### 关键组件
- `components/SearchButton.tsx` - 搜索按钮
- `public/search.json` - 搜索索引文件

### 3. 缓存策略

#### 多层缓存
1. **内存缓存** - 客户端临时缓存
2. **浏览器缓存** - Service Worker
3. **CDN 缓存** - 静态资源

#### 实现
- `lib/cache/` - 缓存管理
- `public/sw.js` - Service Worker

### 4. 性能优化

#### 图片优化
- `components/OptimizedImage.tsx` - 优化图片组件
- `components/ProgressiveImage.tsx` - 渐进式加载
- Next.js Image 组件集成

#### 代码分割
- 动态导入重载组件
- 路由级别代码分割
- 组件级别懒加载

### 5. 错误监控

#### Sentry 集成
- `sentry.client.config.ts` - 客户端配置
- `sentry.server.config.ts` - 服务端配置
- `components/ErrorBoundary.tsx` - 错误边界

### 6. SEO 优化

#### 结构化数据
- JSON-LD Schema.org 标记
- 面包屑导航
- 文章元数据

#### 实现
- `components/seo/JsonLd.tsx` - 结构化数据组件

## 开发工作流

### 1. 开发环境
```bash
pnpm dev           # 启动开发服务器
pnpm storybook     # 查看 Storybook
pnpm test:watch    # 监听模式测试
```

### 2. 构建流程
```bash
pnpm contentlayer  # 生成内容
pnpm build         # 构建生产版本
pnpm analyze       # 分析构建包
```

### 3. 质量保证
```bash
pnpm lint          # 代码检查
pnpm test          # 运行测试
pnpm test:coverage # 测试覆盖率
```

## 设计决策

### 1. 为什么选择 Next.js 16？
- App Router 提供更好的性能
- Turbopack 加速开发构建
- 内置 SEO 优化
- 优秀的开发体验

### 2. 为什么使用 Contentlayer？
- 类型安全的内容处理
- 自动生成 TypeScript 类型
- 支持复杂的内容转换
- 构建时处理，运行时性能好

### 3. 为什么使用 Tailwind CSS 4？
- 原子化 CSS，避免 CSS bloat
- 响应式设计开箱即用
- 暗色模式支持
- 优秀的可定制性

### 4. 为什么选择 Sentry？
- 全面的错误监控
- 性能监控
- 用户反馈收集
- 良好的 Next.js 集成

## 性能指标

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### 优化措施
- 图片懒加载和优化
- 代码分割和懒加载
- Service Worker 缓存
- 预加载关键资源

## 部署架构

### 静态生成
- 使用 Next.js Static Export
- 生成纯静态文件
- 可部署到任何静态托管服务

### CI/CD 流程
```yaml
GitHub Actions
├── 安装依赖
├── 运行测试
├── 代码检查
├── 依赖安全扫描
└── 构建项目
```

## 未来规划

见 [IMPROVEMENT_GUIDE.md](./IMPROVEMENT_GUIDE.md) 了解详细的改进计划。

---

最后更新：2025-01-15
版本：1.0