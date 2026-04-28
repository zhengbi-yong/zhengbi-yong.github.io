# 前端组件清单与管理

> 本文件列出实际存在的组件。清单可能会随迭代更新，以 `frontend/src/` 为准。

## 1) 全局外观入口

| 文件 | 职责 |
|------|------|
| `frontend/src/app/layout.tsx` | 全局 CSS 入口、字体、主题层、suppressHydrationWarning |

## 2) 页眉模块 (Header)

| 文件 | 职责 |
|------|------|
| `Header.tsx` | 统一入口（重导出到优化版） |
| `header/HeaderOptimized.tsx` | 主用实现（桌面导航、移动菜单、滚动显隐） |
| `header/HeaderNavigation.tsx` | 导航链接结构 + 移动折叠 |
| `header/HeaderActions.tsx` | 搜索/主题/语言/Auth 动作区 |
| `header/MobileMenuButton.tsx` | 移动端菜单按钮 |

## 3) 页脚模块 (Footer)

| 文件 | 职责 |
|------|------|
| `Footer.tsx` | 页脚整体布局（作者区、导航、社交、备案） |
| `Footer.module.css` | 页脚样式 |
| `geist/GeistFooter.tsx` | Geist 风格页脚 |
| `home/MegaFooter.tsx` | 首页全屏 CTA 页脚 |

## 4) 布局组件

### 站点级
| 文件 | 职责 |
|------|------|
| `SectionContainer.tsx` | 内容横向边距规则，支持 variant: shell/content/reading/wide |

### 业务布局
| 文件 | 职责 | 状态 |
|------|------|------|
| `layouts/PostLayoutMonograph.tsx` | 长文阅读布局 | ✅ 唯一活跃 |
| `layouts/AuthorLayout.tsx` | 作者页 | ✅ |

### 管理后台布局
| 文件 | 职责 |
|------|------|
| `admin/AdminLayout.tsx` | 后台布局（侧栏 + 顶栏 + 内容区） |
| `app/(admin)/admin/layout.tsx` | 后台布局入口 |

## 5) 代码块 (CodeBlock)

| 文件 | 职责 |
|------|------|
| `mdx/CodeBlock.tsx` | 深色主题 + macOS 窗口装饰 + 复制按钮 + 行号 + 终端模式 |

## 6) 导航组件

| 文件 | 职责 |
|------|------|
| `navigation/TableOfContents/index.tsx` | 主入口 |
| `navigation/TableOfContents/TOCItem.tsx` | 单个 TOC 条目 |
| `navigation/TableOfContents/TOCTree.tsx` | TOC 树状渲染 |
| `navigation/TableOfContents/useHeadingObserver.ts` | IntersectionObserver scroll-spy |
| `navigation/TableOfContents/useTOCNavigation.ts` | 点击平滑滚动导航 |
| `navigation/TableOfContents/types.ts` | 类型定义 |
| `navigation/TableOfContents/TOC.module.css` | TOC 样式 |

## 7) 首页 Section 组件

> **注意**：以下组件存在于 `frontend/src/components/home/` 目录中，但**实际首页（Main.tsx）并未使用它们**。实际首页使用的是 `home/HeroCard.tsx`、`home/SocialCard.tsx`、`sections/Explore.tsx`、`sections/FeaturedWork.tsx`、`sections/BlogSection.tsx`、`NewsletterSignup.tsx` 及 `visitor/` 下的组件。

| 文件 | 职责 |
|------|------|
| `home/HeroSection.tsx` | Three.js 粒子沉浸英雄区（**未在首页使用**） |
| `home/BentoGrid.tsx` | 首页 Bento 网格（**未在首页使用**） |
| `home/ProjectGallery.tsx` | 项目展示（**未在首页使用**） |
| `home/MusicExperience.tsx` | 音乐体验区（**未在首页使用**） |
| `home/LatestWriting.tsx` | 最新文章（**未在首页使用**） |
| `home/MegaFooter.tsx` | 尾页巨型 Footer |
| `home/CustomCursor.tsx` | 自定义鼠标指针（**未在首页使用**） |

## 8) shadcn/ui 组件列表

位于 `frontend/src/components/shadcn/ui/`。

| 文件 | 职责 |
|------|------|
| `accordion.tsx` | 可折叠内容面板 |
| `alert.tsx` | 提示横幅 |
| `avatar.tsx` | 头像组件 |
| `badge.tsx` | 状态徽章 |
| `button.tsx` | 按钮（多 variant/size） |
| `card.tsx` | 卡片容器（Header/Title/Content/Footer） |
| `dialog.tsx` | 模态对话框 |
| `dropdown-menu.tsx` | 下拉菜单 |
| `input.tsx` | 文本输入框 |
| `label.tsx` | 表单标签 |
| `progress.tsx` | 进度条 |
| `separator.tsx` | 视觉分隔线 |
| `sonner.tsx` | Toast 通知 |
| `tabs.tsx` | 标签导航 |
| `textarea.tsx` | 多行文本输入 |

## 9) 主题与视觉 Token

| 文件 | 用途 |
|------|------|
| `styles/tailwind.css` | 全局基础样式 |
| `styles/geist-tokens.css` | Geist 设计变量 |
| `styles/visitor-theme.css` | 访客主题 |
| `styles/monograph-theme.css` | 长文主题 |
| `styles/admin-theme.css` | 后台主题 |
| `styles/admin-compact.css` | 后台紧凑模式 |
| `styles/prism.css` | 代码高亮 |

## 10) 设计交付规范

每个模块交付 5 个文件夹（Figma）：

1. `01-Page` — 页面级方案
2. `02-Components` — 可复用组件
3. `03-States` — 状态矩阵 (hover/focus/active/disabled/loading/empty/error)
4. `04-Spec` — 标注与响应式规则
5. `05-Tokens` — 变量与样式映射

### 验收清单

- [ ] Desktop/Tablet/Mobile 三端稿齐全
- [ ] Light/Dark 两套主题齐全
- [ ] 所有交互态齐全
- [ ] 关键空态/异常态齐全
- [ ] Token 命名与代码变量映射齐全
