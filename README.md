# Zhengbi Yong's Personal Blog

![tailwind-nextjs-banner](/public/static/images/twitter-card.png)

基于 [Next.js](https://nextjs.org/) 和 [Tailwind CSS](https://tailwindcss.com/) 构建的个人博客系统，使用 [Contentlayer](https://www.contentlayer.dev/) 管理 Markdown 内容。

## 关于作者

**雍征彼 (Zhengbi Yong)**

- 本科：清华大学自动化系
- 硕士：北京理工大学自动化学院，导师：史大威教授
- 研究方向：Robotics 及其相关的多模态感知
- 邮箱：zhengbi.yong@outlook.com
- GitHub：[@zhengbi-yong](https://github.com/zhengbi-yong)

## 技术栈

- **框架**: Next.js 15.1.4 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4.0.5
- **内容管理**: Contentlayer2 0.5.4
- **UI 组件**: Headless UI, Radix UI, Shadcn UI
- **动画**: Framer Motion 12.23.24, Tailwind CSS Animate
- **3D 渲染**: Three.js, URDF Loader
- **其他**: Pliny (分析、评论、搜索), MDX, KaTeX, Prism

## 功能特性

- ✅ Next.js 15 与 TypeScript
- ✅ Contentlayer 内容管理
- ✅ MDX 支持（可在 Markdown 中使用 JSX）
- ✅ 代码高亮（带行号和行高亮）
- ✅ 数学公式支持（KaTeX）
- ✅ 引用和参考文献支持
- ✅ GitHub 风格的警告框
- ✅ 自动图片优化
- ✅ 标签系统（每个标签自动生成独立页面）
- ✅ 多作者支持
- ✅ 3 种博客布局（PostLayout, PostSimple, PostBanner）
- ✅ 2 种博客列表布局
- ✅ 支持嵌套路由的博客文章
- ✅ 项目展示页面
- ✅ 3D 模型可视化（Three.js + URDF）
- ✅ 预配置的安全头
- ✅ SEO 友好（RSS 订阅、站点地图等）
- ✅ 深色/浅色主题切换
- ✅ 移动端友好
- ✅ 搜索功能（Kbar 命令面板）
- ✅ 评论系统（Giscus）
- ✅ 分析统计（Umami）
- ✅ 滚动触发动画（基于 Intersection Observer）
- ✅ Framer Motion 高级动画支持
- ✅ MDX 动画组件（FadeIn、SlideIn、ScaleIn）
- ✅ Shadcn UI 组件库集成

## 环境要求

- Node.js >= 18.0.0
- Yarn >= 3.6.1 (使用 Corepack 管理)
- Git

### Windows 用户额外要求

- PowerShell 7+
- Cygwin (用于 rsync 同步，可选)

## 快速开始

### 1. 克隆仓库

```bash
git clone <your-repo-url>
cd blog
```

### 2. 安装依赖

```bash
yarn
```

**Windows 用户注意**：如果遇到 `$PWD` 未定义错误，请先运行：

```powershell
$env:PWD = $(Get-Location).Path
```

或者直接使用提供的 PowerShell 脚本：

```powershell
.\dev.ps1
```

### 3. 配置站点信息

编辑以下文件以个性化您的博客：

- `data/siteMetadata.js` - 站点基本信息、社交媒体链接、分析配置等
- `data/authors/default.mdx` - 作者信息
- `data/projectsData.ts` - 项目数据
- `data/headerNavLinks.ts` - 导航链接
- `data/logo.svg` - 网站 Logo

### 4. 配置环境变量（可选）

创建 `.env.local` 文件（如果需要）：

```env
# Giscus 评论系统
NEXT_PUBLIC_GISCUS_REPO=your-username/your-repo
NEXT_PUBLIC_GISCUS_REPOSITORY_ID=your-repo-id
NEXT_PUBLIC_GISCUS_CATEGORY=General
NEXT_PUBLIC_GISCUS_CATEGORY_ID=your-category-id

# Umami 分析
NEXT_UMAMI_ID=your-umami-id
```

### 5. 启动开发服务器

**Windows (推荐)**:
```powershell
.\dev.ps1
```

**Linux/Mac**:
```bash
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看效果。

## 开发指南

### 项目结构

```
blog/
├── app/                    # Next.js App Router 页面
│   ├── blog/              # 博客相关路由
│   │   ├── [...slug]/     # 动态博客文章路由
│   │   └── page.tsx       # 博客列表页
│   ├── projects/          # 项目展示页
│   ├── experiment/        # 实验功能页（3D 模型等）
│   ├── api/               # API 路由
│   └── layout.tsx         # 根布局
├── components/            # React 组件
│   ├── Header.tsx         # 导航栏
│   ├── Footer.tsx         # 页脚
│   ├── MDXComponents.tsx  # MDX 自定义组件
│   └── ...
├── layouts/               # 页面布局模板
│   ├── PostLayout.tsx     # 默认博客文章布局
│   ├── PostSimple.tsx      # 简化布局
│   ├── PostBanner.tsx     # 带横幅图片的布局
│   └── ListLayout.tsx     # 博客列表布局
├── data/                  # 内容数据
│   ├── blog/             # MDX 博客文章
│   ├── authors/          # 作者信息
│   ├── siteMetadata.js   # 站点配置
│   ├── projectsData.ts   # 项目数据
│   └── headerNavLinks.ts # 导航链接
├── public/               # 静态资源
│   ├── static/           # 图片、图标等
│   └── models/          # 3D 模型文件（URDF）
├── scripts/              # 构建脚本
│   ├── postbuild.mjs     # 构建后处理（生成 RSS）
│   └── rss.mjs           # RSS 生成逻辑
├── contentlayer.config.ts # Contentlayer 配置
├── next.config.js        # Next.js 配置
├── tailwind.config.js    # Tailwind CSS 配置
├── tsconfig.json         # TypeScript 配置
├── dev.ps1               # Windows 开发脚本
└── sync.ps1              # Windows 部署同步脚本
```

### 添加博客文章

1. 在 `data/blog/` 目录下创建 `.mdx` 文件
2. 使用以下 frontmatter 格式：

```yaml
---
title: '文章标题'
date: '2025-01-01'
lastmod: '2025-01-02'  # 可选
tags: ['标签1', '标签2']
draft: false  # 设置为 true 可在开发环境查看，生产环境隐藏
summary: '文章摘要'
images: ['/static/images/example.jpg']  # 可选
authors: ['default']  # 可选，默认为 default
layout: PostLayout  # 可选，默认为 PostLayout
canonicalUrl: https://example.com/blog/post  # 可选，用于 SEO
---
```

3. 文章支持完整的 Markdown 语法，以及 MDX（可在 Markdown 中使用 React 组件）

### 在 MDX 文件中使用动画和组件

本博客系统支持在 MDX 文件中直接使用动画组件和 UI 组件，让您的文章更加生动有趣。

#### 可用的动画组件

##### 第一阶段：基础动画组件（基于 CSS）

**AnimatedSection** - 滚动触发动画组件

```mdx
<AnimatedSection direction="up" delay={100}>
  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
    <h3>这是一个会淡入并上滑的内容块</h3>
    <p>当用户滚动到这个区域时，内容会以动画形式出现。</p>
  </div>
</AnimatedSection>
```

**参数说明**：
- `direction`: `'up' | 'down' | 'left' | 'right'` - 动画方向，默认 `'up'`
- `delay`: `number` - 延迟时间（毫秒），默认 `0`
- `className`: `string` - 自定义 CSS 类名

**AnimatedList** - 交错动画列表组件

```mdx
<AnimatedList staggerDelay={100}>
  <div>第一个项目</div>
  <div>第二个项目</div>
  <div>第三个项目</div>
</AnimatedList>
```

**参数说明**：
- `staggerDelay`: `number` - 每个子元素之间的延迟（毫秒），默认 `100`
- `className`: `string` - 自定义 CSS 类名

##### 第二阶段：Framer Motion 动画组件（更流畅）

**FadeIn** - 淡入动画

```mdx
<FadeIn delay={0.2} duration={0.5} whileInView={true}>
  <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
    <h3>淡入效果</h3>
    <p>这个内容会在滚动到视口时淡入显示。</p>
  </div>
</FadeIn>
```

**参数说明**：
- `delay`: `number` - 延迟时间（秒），默认 `0`
- `duration`: `number` - 动画时长（秒），默认 `0.5`
- `whileInView`: `boolean` - 是否在进入视口时触发，默认 `false`
- `className`: `string` - 自定义 CSS 类名

**SlideIn** - 滑入动画

```mdx
<SlideIn direction="up" delay={0.1} whileInView={true}>
  <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
    <h3>向上滑入</h3>
    <p>内容会从下方滑入并淡入显示。</p>
  </div>
</SlideIn>

<SlideIn direction="left" delay={0.2} whileInView={true}>
  <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
    <h3>向左滑入</h3>
    <p>内容会从右侧滑入。</p>
  </div>
</SlideIn>
```

**参数说明**：
- `direction`: `'up' | 'down' | 'left' | 'right'` - 滑动方向，默认 `'up'`
- `delay`: `number` - 延迟时间（秒），默认 `0`
- `duration`: `number` - 动画时长（秒），默认 `0.5`
- `distance`: `number` - 滑动距离（像素），默认 `20`
- `whileInView`: `boolean` - 是否在进入视口时触发，默认 `false`
- `className`: `string` - 自定义 CSS 类名

**ScaleIn** - 缩放进入动画

```mdx
<ScaleIn scale={0.8} delay={0.2} whileInView={true}>
  <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-lg">
    <h3>缩放进入</h3>
    <p>内容会从 0.8 倍缩放并淡入显示。</p>
  </div>
</ScaleIn>
```

**参数说明**：
- `scale`: `number` - 初始缩放比例，默认 `0.8`
- `delay`: `number` - 延迟时间（秒），默认 `0`
- `duration`: `number` - 动画时长（秒），默认 `0.5`
- `whileInView`: `boolean` - 是否在进入视口时触发，默认 `false`
- `className`: `string` - 自定义 CSS 类名

#### 组合使用示例

您可以将多个动画组件组合使用，创建更丰富的视觉效果：

```mdx
<SlideIn direction="up" delay={0} whileInView={true}>
  <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white">
    <h2>组合动画示例</h2>
    <p className="mb-4">外层使用滑入动画</p>
    
    <ScaleIn delay={0.3} whileInView={true}>
      <button className="px-4 py-2 bg-white text-blue-500 rounded hover:bg-gray-100">
        内部按钮使用缩放动画
      </button>
    </ScaleIn>
  </div>
</SlideIn>
```

#### 使用场景建议

1. **AnimatedSection / SlideIn** - 适合用于：
   - 突出显示重要内容块
   - 代码示例或演示
   - 图片说明
   - 引用块

2. **FadeIn** - 适合用于：
   - 文章段落
   - 列表项
   - 需要柔和出现的内容

3. **ScaleIn** - 适合用于：
   - 按钮和交互元素
   - 卡片式内容
   - 需要强调的元素

4. **AnimatedList** - 适合用于：
   - 步骤列表
   - 功能特性列表
   - 多个相关内容的展示

#### 注意事项

1. **性能考虑**：
   - 不要过度使用动画，避免影响页面性能
   - 建议每个页面使用 3-5 个动画组件
   - 使用 `whileInView={true}` 可以确保动画只在元素进入视口时触发

2. **可访问性**：
   - 动画应该增强用户体验，而不是干扰阅读
   - 如果用户设置了 `prefers-reduced-motion`，动画会自动降级

3. **向后兼容**：
   - 第一阶段的组件（AnimatedSection、AnimatedList）仍然可用
   - 建议新文章使用 Framer Motion 组件（FadeIn、SlideIn、ScaleIn）以获得更好的性能

#### 完整示例

以下是一个完整的 MDX 文章示例，展示了如何使用动画组件：

```mdx
---
title: '使用动画组件增强文章'
date: '2025-01-15'
tags: ['Tutorial']
draft: false
summary: '学习如何在 MDX 文章中使用动画组件'
---

## 介绍

这篇文章展示了如何在 MDX 中使用动画组件。

<FadeIn delay={0.2} whileInView={true}>
  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
    <h3>重要提示</h3>
    <p>这个提示框使用了淡入动画。</p>
  </div>
</FadeIn>

## 步骤说明

<AnimatedList staggerDelay={150}>
  <div className="p-4 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <h4>步骤 1：准备</h4>
    <p>准备所需材料...</p>
  </div>
  <div className="p-4 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <h4>步骤 2：实施</h4>
    <p>按照计划实施...</p>
  </div>
  <div className="p-4 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <h4>步骤 3：验证</h4>
    <p>验证结果...</p>
  </div>
</AnimatedList>

## 代码示例

<SlideIn direction="up" delay={0.1} whileInView={true}>
  <div className="p-4 bg-gray-900 rounded-lg">
    <pre className="text-green-400">
      <code>{`// 这是一个代码示例
function example() {
  return "Hello, World!";
}`}</code>
    </pre>
  </div>
</SlideIn>
```

#### 查看更多示例

访问 `/experiment` 页面可以查看所有动画组件的交互式示例和演示效果。

#### 使用其他组件

除了动画组件，您还可以在 MDX 文件中使用其他 React 组件。如果组件已经在 `components/MDXComponents.tsx` 中注册，可以直接使用组件名；如果需要使用未注册的组件，可以在 MDX 文件顶部导入：

```mdx
---
title: '使用自定义组件'
date: '2025-01-15'
tags: ['Tutorial']
---

import { Button } from '@/components/components/ui/button'
import { Badge } from '@/components/components/ui/badge'

## 使用 Shadcn UI 组件

<Button onClick={() => alert('按钮被点击！')}>
  点击我
</Button>

<Badge variant="secondary">标签</Badge>
```

**注意**：在 MDX 文件中导入组件时，确保路径正确，并且组件支持客户端渲染（使用 `'use client'` 指令）。

### 可用的脚本命令

```bash
# 开发模式（Windows 用户使用 .\dev.ps1）
yarn dev

# 构建生产版本
yarn build

# 启动生产服务器
yarn serve

# 代码检查和自动修复
yarn lint

# 分析打包大小
yarn analyze
```

### 自定义配置

#### 修改主题颜色

编辑 `tailwind.config.js` 和 `css/tailwind.css`

#### 添加自定义 MDX 组件

在 `components/MDXComponents.tsx` 中添加组件映射

#### 修改内容安全策略

编辑 `next.config.js` 中的 `ContentSecurityPolicy`

## 部署指南

### 方式一：静态导出（推荐用于传统服务器）

#### 1. 构建静态文件

**Windows**:
```powershell
$env:PWD = $(Get-Location).Path
$env:EXPORT = 1
$env:UNOPTIMIZED = 1
yarn build
```

**Linux/Mac**:
```bash
EXPORT=1 UNOPTIMIZED=1 yarn build
```

构建完成后，静态文件将生成在 `out/` 目录。

#### 2. 部署到服务器

**使用 rsync (Windows)**:
```powershell
.\sync.ps1
```

该脚本会：
1. 运行代码检查
2. 构建项目
3. 使用 rsync 同步到远程服务器

**手动部署**:
将 `out/` 目录上传到您的 Web 服务器（Nginx、Apache 等）

#### 3. Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/out;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ =404;
    }
}
```

### 方式二：Vercel 部署

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量（如需要）
4. 自动部署完成

### 方式三：Netlify 部署

1. 将代码推送到 GitHub
2. 在 [Netlify](https://www.netlify.com) 导入项目
3. 构建命令：`yarn build`
4. 发布目录：`.next`

### 方式四：GitHub Pages

1. 构建静态文件（参考方式一）
2. 将 `out/` 目录内容推送到 `gh-pages` 分支
3. 在 GitHub 仓库设置中启用 Pages

> **注意**：静态导出时，以下功能将不可用：
> - API 路由（如 Newsletter API）
> - 动态路由（需要服务器端支持）
> - 自定义 HTTP 头（需要在服务器配置）

## 常见问题

### Windows 开发环境问题

**问题**: `Unbound variable "PWD"` 错误

**解决**: 使用提供的 `dev.ps1` 脚本，或手动设置环境变量：
```powershell
$env:PWD = $(Get-Location).Path
```

**问题**: `Module not found: Can't resolve 'contentlayer/generated'`

**解决**: 已在 `next.config.js` 中添加 webpack 别名配置，确保重启开发服务器。

**问题**: Contentlayer 在 Windows 上警告

**解决**: 这是已知问题，不影响功能。Contentlayer 在 Windows 上可能有一些限制，但基本功能正常。

### 构建问题

**问题**: 构建时出现路径错误

**解决**: 确保在项目根目录运行构建命令，并正确设置 `PWD` 环境变量。

**问题**: 静态导出后图片不显示

**解决**: 确保使用 `UNOPTIMIZED=1` 环境变量，或配置图片优化服务（如 Imgix、Cloudinary）。

### 内容问题

**问题**: 博客文章不显示

**解决**: 
1. 检查 `draft` 字段是否为 `false`
2. 检查文件路径是否正确（应在 `data/blog/` 下）
3. 检查 frontmatter 格式是否正确

**问题**: 标签页面不显示

**解决**: 运行构建命令后，Contentlayer 会自动生成 `app/tag-data.json`，确保该文件存在。

## 开发技巧

### 本地预览生产构建

```bash
yarn build
yarn serve
```

### 分析打包大小

```bash
yarn analyze
```

### 调试 Contentlayer

Contentlayer 生成的文件在 `.contentlayer/generated/` 目录，可以查看生成的内容和类型定义。

### 自定义 RSS 订阅

RSS 文件在构建时自动生成，位于 `out/feed.xml`（静态导出）或 `public/feed.xml`（开发模式）。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 致谢

本项目基于 [tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) 模板构建。

---

**最后更新**: 2025-01-XX

如有问题，请提交 Issue 或联系作者。
