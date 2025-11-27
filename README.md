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

#### 3. 服务器端配置（Nginx）

##### 3.1 安装 Nginx（如果未安装）

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

##### 3.2 创建 Nginx 配置文件

```bash
# 创建配置文件
sudo nano /etc/nginx/sites-available/blog
```

将以下配置内容复制到文件中（**重要：请根据实际情况修改 `server_name` 和 `root` 路径**）：

```nginx
server {
    listen 80;
    server_name your-domain.com 152.136.43.194;  # 替换为您的域名或 IP

    # 静态资源根目录（必须指向 out 目录的完整路径）
    root /home/ubuntu/PersonalBlog/out;  # 替换为您的实际路径
    
    # 默认首页配置
    index index.html;

    # 启用 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # 处理博客文章路由（必须在通用 location 之前）
    # Next.js 静态导出会生成 /blog/robotics/dexmani.html
    # 但链接是 /blog/robotics/dexmani（没有 .html）
    location ~ ^/blog/ {
        # 关键：必须包含 $uri.html 来处理 Next.js 静态导出
        try_files $uri $uri.html $uri/ /index.html;
    }

    # 处理所有其他请求
    location / {
        # 关键：必须包含 $uri.html 来处理 Next.js 静态导出
        # 顺序：先尝试文件 -> 再尝试 .html 文件 -> 再尝试目录 -> 最后回退到 index.html
        try_files $uri $uri.html $uri/ /index.html;
    }

    # 处理 _next 静态资源（长期缓存）
    location /_next/static {
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # 静态资源缓存配置
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # 错误页面配置
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

**配置说明**：
- `server_name`: 替换为您的域名或 IP 地址（多个用空格分隔）
- `root`: 替换为 `out` 目录在服务器上的完整路径
- `try_files $uri.html`: **这是关键配置**，必须包含，用于处理 Next.js 静态导出的 `.html` 文件

##### 3.3 启用站点配置

```bash
# 创建符号链接启用站点
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/

# 如果存在默认配置，可以禁用它（可选）
sudo rm /etc/nginx/sites-enabled/default
```

##### 3.4 测试 Nginx 配置

```bash
# 检查配置语法
sudo nginx -t
```

如果显示 `syntax is ok` 和 `test is successful`，说明配置正确。

##### 3.5 设置文件权限

```bash
# 确保 Nginx 可以访问文件
sudo chown -R www-data:www-data /home/ubuntu/PersonalBlog/out
sudo chmod -R 755 /home/ubuntu/PersonalBlog/out
```

**注意**：将路径替换为您的实际 `out` 目录路径。

##### 3.6 重新加载 Nginx

```bash
# 重新加载 Nginx 配置（不中断服务）
sudo systemctl reload nginx

# 或者重启 Nginx（会短暂中断服务）
sudo systemctl restart nginx
```

##### 3.7 验证部署

1. 访问网站首页：`http://your-domain.com` 或 `http://152.136.43.194`
2. 访问博客列表：`http://your-domain.com/blog`
3. 访问博客文章：`http://your-domain.com/blog/robotics/dexmani`

如果博客文章能正常显示，说明部署成功！

##### 3.8 常见问题排查

**问题 1：博客文章点击后跳转到首页**

**原因**：Nginx 配置中缺少 `$uri.html`

**解决**：
1. 检查配置文件中的 `try_files` 是否包含 `$uri.html`
2. 检查配置文件位置是否正确：`/etc/nginx/sites-available/blog`
3. 运行 `sudo nginx -t` 检查语法
4. 运行 `sudo systemctl reload nginx` 重新加载配置

**问题 2：403 Forbidden 错误**

**原因**：文件权限不正确

**解决**：
```bash
# 检查文件权限
ls -la /home/ubuntu/PersonalBlog/out

# 设置正确的权限
sudo chown -R www-data:www-data /home/ubuntu/PersonalBlog/out
sudo chmod -R 755 /home/ubuntu/PersonalBlog/out
```

**问题 3：404 Not Found 错误**

**原因**：文件路径不正确或文件未同步

**解决**：
```bash
# 检查文件是否存在
ls -la /home/ubuntu/PersonalBlog/out/blog/robotics/

# 检查 Nginx root 配置是否正确
sudo cat /etc/nginx/sites-available/blog | grep root

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

**问题 4：静态资源加载失败**

**原因**：`_next/static` 目录权限或路径问题

**解决**：
```bash
# 检查 _next 目录
ls -la /home/ubuntu/PersonalBlog/out/_next/static

# 确保权限正确
sudo chown -R www-data:www-data /home/ubuntu/PersonalBlog/out/_next
```

##### 3.9 查看日志

```bash
# 查看 Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 查看 Nginx 状态
sudo systemctl status nginx
```

##### 3.10 更新部署后的操作

每次使用 `sync.ps1` 同步文件后，通常不需要重启 Nginx，但如果遇到问题，可以：

```bash
# 重新加载配置（推荐，不中断服务）
sudo systemctl reload nginx

# 或者重启 Nginx
sudo systemctl restart nginx
```

**重要提示**：
- ✅ `try_files` 配置必须包含 `$uri.html`，这是处理 Next.js 静态导出的关键
- ✅ 确保 `root` 路径指向正确的 `out` 目录
- ✅ 确保文件权限正确（Nginx 用户 `www-data` 可以读取）
- ✅ 配置修改后必须运行 `sudo nginx -t` 检查语法
- ✅ 配置修改后必须运行 `sudo systemctl reload nginx` 重新加载配置

##### 3.11 配置 SSL 证书（HTTPS）

为了消除浏览器中的"不安全"警告，您需要为网站配置 SSL 证书。本指南将详细介绍如何使用 Let's Encrypt 免费 SSL 证书。

**前置条件**：

1. **域名要求**：
   - Let's Encrypt 需要有效的域名（不能仅使用 IP 地址）
   - 域名必须已经解析到您的服务器 IP 地址
   - 如果只有 IP 地址，请先购买域名并配置 DNS 解析

2. **DNS 解析配置**：
   - 在域名注册商处添加 A 记录，将域名指向服务器 IP
   - 例如：`your-domain.com` → `152.136.43.194`
   - 等待 DNS 生效（通常几分钟到几小时）

3. **服务器要求**：
   - 服务器可以访问互联网
   - 80 端口和 443 端口未被防火墙阻止
   - 已安装并运行 Nginx

**步骤 1：验证前置条件**

在开始之前，请验证以下内容：

```bash
# 1. 检查域名解析是否生效
nslookup your-domain.com
# 或
dig your-domain.com

# 应该返回您的服务器 IP 地址（如 152.136.43.194）

# 2. 检查 80 和 443 端口是否开放
sudo netstat -tlnp | grep -E ':(80|443)'
# 或
sudo ss -tlnp | grep -E ':(80|443)'

# 3. 检查防火墙状态（如果使用 UFW）
sudo ufw status
# 确保允许 HTTP 和 HTTPS
sudo ufw allow 'Nginx Full'
# 或分别允许
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 4. 检查 Nginx 是否正在运行
sudo systemctl status nginx
```

**步骤 2：安装 Certbot**

Certbot 是 Let's Encrypt 的官方客户端，用于自动获取和续期 SSL 证书。

```bash
# 更新软件包列表
sudo apt update

# 安装 Certbot 和 Nginx 插件
sudo apt install certbot python3-certbot-nginx -y

# 验证安装
certbot --version
```

**步骤 3：获取 SSL 证书**

Certbot 提供了两种方式获取证书：自动配置和手动配置。

**方式 A：自动配置（推荐）**

Certbot 会自动修改 Nginx 配置文件，这是最简单的方式：

```bash
# 基本命令（单个域名）
sudo certbot --nginx -d your-domain.com

# 多个域名（包括 www 子域名）
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 示例：如果您的域名是 example.com
sudo certbot --nginx -d example.com -d www.example.com
```

**执行过程说明**：

1. **输入邮箱地址**：
   ```
   Enter email address (used for urgent renewal and security notices)
   ```
   - 输入您的邮箱地址，用于接收证书到期提醒和安全通知
   - 建议使用常用邮箱

2. **同意服务条款**：
   ```
   (A)gree/(C)ancel: A
   ```
   - 输入 `A` 同意服务条款

3. **选择是否共享邮箱**：
   ```
   (Y)es/(N)o: N
   ```
   - 选择是否与 EFF（电子前沿基金会）共享邮箱
   - 通常选择 `N`

4. **选择重定向 HTTP 到 HTTPS**：
   ```
   Please choose whether or not to redirect HTTP traffic to HTTPS, removing HTTP access.
   -------------------------------------------------------------------------------
   1: No redirect - Make no further changes to the webserver configuration.
   2: Redirect - Make all HTTP requests redirect to HTTPS. This is recommended.
   -------------------------------------------------------------------------------
   Select the appropriate number [1-2] then [enter] (press 'c' to cancel): 2
   ```
   - **强烈建议选择 `2`**，这样所有 HTTP 请求会自动重定向到 HTTPS

5. **完成**：
   - Certbot 会自动获取证书并更新 Nginx 配置
   - 如果成功，您会看到类似以下的消息：
     ```
     Congratulations! You have successfully enabled https://your-domain.com
     ```

**方式 B：手动配置（高级用户）**

如果您想手动控制配置过程，可以使用以下命令仅获取证书，不修改 Nginx 配置：

```bash
# 仅获取证书，不修改 Nginx 配置
sudo certbot certonly --nginx -d your-domain.com

# 或使用 standalone 模式（需要临时停止 Nginx）
sudo systemctl stop nginx
sudo certbot certonly --standalone -d your-domain.com
sudo systemctl start nginx
```

**步骤 4：验证证书获取**

证书获取成功后，验证证书文件是否存在：

```bash
# 查看证书文件
sudo ls -la /etc/letsencrypt/live/your-domain.com/

# 应该看到以下文件：
# - cert.pem          # 证书文件
# - chain.pem         # 中间证书链
# - fullchain.pem     # 完整证书链（cert.pem + chain.pem）
# - privkey.pem       # 私钥文件

# 查看证书信息
sudo certbot certificates
```

**步骤 5：更新 Nginx 配置（如果使用手动方式）**

如果您使用了方式 B（手动配置），需要手动更新 Nginx 配置文件：

```bash
# 编辑 Nginx 配置文件
sudo nano /etc/nginx/sites-available/blog
```

将配置更新为以下内容（**请根据实际情况修改域名和路径**）：

```nginx
# HTTP 服务器 - 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 重定向所有 HTTP 请求到 HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS 服务器
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL 安全配置（推荐设置）
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # 安全头配置
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 静态资源根目录（必须指向 out 目录的完整路径）
    root /home/ubuntu/PersonalBlog/out;  # 替换为您的实际路径
    
    # 默认首页配置
    index index.html;

    # 启用 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # 处理博客文章路由（必须在通用 location 之前）
    location ~ ^/blog/ {
        # 关键：必须包含 $uri.html 来处理 Next.js 静态导出
        try_files $uri $uri.html $uri/ /index.html;
    }

    # 处理所有其他请求
    location / {
        # 关键：必须包含 $uri.html 来处理 Next.js 静态导出
        try_files $uri $uri.html $uri/ /index.html;
    }

    # 处理 _next 静态资源（长期缓存）
    location /_next/static {
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # 静态资源缓存配置
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # 错误页面配置
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

**重要配置说明**：

- `ssl_certificate` 和 `ssl_certificate_key`：指向 Let's Encrypt 生成的证书文件
- `ssl_protocols`：指定支持的 TLS 协议版本（推荐 TLSv1.2 和 TLSv1.3）
- `ssl_ciphers`：指定加密套件（使用现代、安全的加密算法）
- `Strict-Transport-Security`：强制使用 HTTPS（HSTS）
- `listen 443 ssl http2`：启用 HTTP/2 协议以提升性能

**步骤 6：测试 Nginx 配置**

在重新加载 Nginx 之前，务必测试配置是否正确：

```bash
# 测试 Nginx 配置语法
sudo nginx -t
```

如果显示 `syntax is ok` 和 `test is successful`，说明配置正确。

**步骤 7：重新加载 Nginx**

配置测试通过后，重新加载 Nginx：

```bash
# 重新加载 Nginx 配置（推荐，不中断服务）
sudo systemctl reload nginx

# 或重启 Nginx（会短暂中断服务）
sudo systemctl restart nginx

# 检查 Nginx 状态
sudo systemctl status nginx
```

**步骤 8：验证 HTTPS 配置**

1. **浏览器访问测试**：
   - 访问 `https://your-domain.com`
   - 浏览器地址栏应该显示锁图标（🔒）
   - 不再显示"不安全"警告

2. **SSL 测试工具**：
   - 访问 [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)
   - 输入您的域名进行测试
   - 应该获得 A 或 A+ 评级

3. **命令行测试**：
   ```bash
   # 测试 HTTPS 连接
   curl -I https://your-domain.com
   
   # 查看证书信息
   echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
   ```

4. **验证 HTTP 重定向**：
   - 访问 `http://your-domain.com`
   - 应该自动重定向到 `https://your-domain.com`

**步骤 9：配置自动续期**

Let's Encrypt 证书有效期为 90 天，Certbot 会自动设置续期任务。但建议手动验证续期配置：

```bash
# 查看 Certbot 定时任务
sudo systemctl status certbot.timer

# 或查看 cron 任务
sudo crontab -l | grep certbot

# 测试自动续期（不会实际续期，只是测试）
sudo certbot renew --dry-run
```

如果 `--dry-run` 测试成功，说明自动续期配置正常。

**手动续期**（如果需要）：

```bash
# 手动续期所有证书
sudo certbot renew

# 续期后重新加载 Nginx
sudo systemctl reload nginx
```

**步骤 10：常见问题排查**

**问题 1：证书获取失败 - "Failed to verify domain"**

**原因**：域名解析不正确或 80 端口被阻止

**解决**：
```bash
# 1. 检查域名解析
nslookup your-domain.com
dig your-domain.com

# 2. 检查 80 端口是否开放
sudo netstat -tlnp | grep :80
sudo ufw status

# 3. 确保 Nginx 正在运行
sudo systemctl status nginx

# 4. 检查防火墙规则
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

**问题 2：证书获取失败 - "Too many requests"**

**原因**：Let's Encrypt 对每个域名有速率限制（每周最多 5 个证书）

**解决**：
- 等待一段时间后重试
- 如果确实需要多个证书，考虑使用通配符证书

**问题 3：HTTPS 访问显示"不安全"或证书错误**

**原因**：证书配置不正确或证书已过期

**解决**：
```bash
# 1. 检查证书是否过期
sudo certbot certificates

# 2. 检查 Nginx 配置中的证书路径是否正确
sudo cat /etc/nginx/sites-available/blog | grep ssl_certificate

# 3. 验证证书文件是否存在
sudo ls -la /etc/letsencrypt/live/your-domain.com/

# 4. 重新获取证书
sudo certbot --nginx -d your-domain.com --force-renewal
```

**问题 4：HTTP 没有自动重定向到 HTTPS**

**原因**：Nginx 配置中缺少重定向规则

**解决**：
```bash
# 检查配置文件
sudo cat /etc/nginx/sites-available/blog

# 确保有 HTTP 到 HTTPS 的重定向配置
# 如果没有，添加以下配置：
# server {
#     listen 80;
#     server_name your-domain.com;
#     return 301 https://$server_name$request_uri;
# }

# 重新加载 Nginx
sudo nginx -t
sudo systemctl reload nginx
```

**问题 5：证书续期失败**

**原因**：Nginx 配置错误或服务未运行

**解决**：
```bash
# 1. 检查 Nginx 配置
sudo nginx -t

# 2. 检查 Nginx 服务状态
sudo systemctl status nginx

# 3. 手动测试续期
sudo certbot renew --dry-run

# 4. 查看 Certbot 日志
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

**问题 6：SSL 测试评级较低（B 或 C）**

**原因**：SSL 配置不够安全

**解决**：
- 更新 Nginx 配置中的 `ssl_protocols` 和 `ssl_ciphers`
- 禁用不安全的协议（如 TLSv1.0、TLSv1.1）
- 使用推荐的 SSL 配置（参考步骤 5）

**步骤 11：维护和监控**

**定期检查证书状态**：

```bash
# 查看所有证书状态
sudo certbot certificates

# 查看证书到期时间
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

**设置证书到期提醒**：

Certbot 会在证书到期前自动发送邮件提醒（使用您注册时提供的邮箱）。您也可以设置监控脚本：

```bash
# 创建检查脚本
sudo nano /usr/local/bin/check-ssl-cert.sh
```

添加以下内容：

```bash
#!/bin/bash
DOMAIN="your-domain.com"
DAYS_BEFORE_EXPIRY=30

CERT_EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($CERT_EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt $DAYS_BEFORE_EXPIRY ]; then
    echo "警告：$DOMAIN 的 SSL 证书将在 $DAYS_UNTIL_EXPIRY 天后过期！"
    # 可以在这里添加邮件通知或其他操作
fi
```

```bash
# 设置执行权限
sudo chmod +x /usr/local/bin/check-ssl-cert.sh

# 添加到 crontab（每天检查一次）
sudo crontab -e
# 添加以下行：
# 0 0 * * * /usr/local/bin/check-ssl-cert.sh
```

**总结**：

完成以上步骤后，您的网站应该已经成功配置了 HTTPS：

- ✅ 所有 HTTP 请求自动重定向到 HTTPS
- ✅ 浏览器不再显示"不安全"警告
- ✅ 证书自动续期配置完成
- ✅ SSL 安全配置已优化

**重要提示**：
- 🔒 Let's Encrypt 证书免费，但需要每 90 天续期一次（Certbot 会自动处理）
- 🌐 必须使用域名，不能仅使用 IP 地址
- 🔄 证书续期后需要重新加载 Nginx：`sudo systemctl reload nginx`
- 📧 确保注册邮箱正确，以便接收证书到期提醒
- 🔍 定期检查证书状态，确保自动续期正常工作

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
