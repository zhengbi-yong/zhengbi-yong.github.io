# 前端组件清单与管理

> 本文件列出实际存在的组件。清单可能会随迭代更新，以 `frontend/src/` 为准。

## 1) 全局外观入口

| 文件 | 职责 |
|------|------|
| `frontend/src/app/layout.tsx` | 全局 CSS 入口、字体、主题层、suppressHydrationWarning |

## 2) 页眉模块 (Header)

| 文件 | 职责 |
|------|------|
| `Header.tsx` | 统一入口（重导出到 `header/HeaderOptimized`） |
| `header/HeaderOptimized.tsx` | 主用实现（桌面导航、移动菜单、滚动显隐） |

## 3) 页脚模块 (Footer)

| 文件 | 职责 |
|------|------|
| `Footer.tsx` | 页脚整体布局（作者区、导航、社交、备案） |
| `home/MegaFooter.tsx` | 首页全屏 CTA 页脚 |
| `Footer.module.css` | 页脚样式 |

## 4) 布局组件

### 站点级
| 文件 | 职责 |
|------|------|
| `SectionContainer.tsx` | 内容横向边距规则 |
| `layouts/PublicPageFrame.tsx` | 公开页面外壳布局 |

### 业务布局
| 文件 | 职责 | 状态 |
|------|------|------|
| `layouts/PostLayoutMonograph.tsx` | 长文阅读布局 | ✅ 唯一活跃 |
| `layouts/AuthorLayout.tsx` | 作者页 | ✅ |
| `layouts/MagazineLayout.tsx` | 杂志风格布局 | ✅ |
| `layouts/BookDetailLayout.tsx` | 书籍详情布局 | ✅ |
| `layouts/BookShelfLayout.tsx` | 书架布局 | ✅ |
| `layouts/ListLayout.tsx` | 列表布局 | ✅ |
| `layouts/ListLayoutWithTags.tsx` | 带标签的列表布局 | ✅ |

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
| `navigation/TableOfContents/index.tsx` | TOC 主组件（IntersectionObserver scroll-spy，响应式） |
| `navigation/TableOfContents/TOCItem.tsx` | 单个 TOC 条目组件 |
| `navigation/TableOfContents/TOCTree.tsx` | 递归渲染 TOC 树 |
| `navigation/TableOfContents/useTOCNavigation.ts` | 导航逻辑 hook（移动端展开/折叠、活跃标题追踪、树构建） |
| `navigation/TableOfContents/useHeadingObserver.ts` | 滚动观察 hook（IntersectionObserver 检测当前标题） |
| `navigation/TableOfContents/types.ts` | 类型定义 |
| `navigation/TableOfContents/TOC.module.css` | TOC 样式（浮动按钮、面板、桌面容器） |

## 7) 首页 Section 组件

| 文件 | 职责 | 状态 |
|------|------|------|
| `home/HeroSection.tsx` | Three.js 粒子沉浸英雄区 | 🔄 已有但未集成于 Main.tsx |
| `home/BentoGrid.tsx` | 首页 Bento 网格 | 🔄 已有但未集成于 Main.tsx |
| `home/ProjectGallery.tsx` | 项目展示 | 🔄 已有但未集成于 Main.tsx |
| `home/MusicExperience.tsx` | 音乐体验区 | 🔄 已有但未集成于 Main.tsx |
| `home/LatestWriting.tsx` | 最新文章 | 🔄 已有但未集成于 Main.tsx |
| `home/MegaFooter.tsx` | 尾页巨型 Footer | 🔄 已有但未集成于 Main.tsx |
| `home/SocialCard.tsx` | 社交媒体卡片 | ✅ 实际首页使用 |
| `home/HeroCard.tsx` | 英雄卡片 | ✅ 实际首页使用 |

> 说明：`Main.tsx` 实际使用的首页布局为：AnimatedHeading → SocialCard → HeroCard → Explore → FeaturedWork → BlogSection → NewsletterSignup。其上方的 Three.js 沉浸式组件虽已创建但尚未集成到实际页面中。

## 8) Section 组件（页面分区）

| 文件 | 职责 |
|------|------|
| `sections/Explore.tsx` | 探索分区 |
| `sections/FeaturedWork.tsx` | 特色作品分区 |
| `sections/BlogSection.tsx` | 博客文章分区 |
| `sections/SectionHeader.tsx` | Section 标题 |
| `sections/PageHeader.tsx` | 页面标题 |
| `sections/ActionBar.tsx` | 操作栏 |
| `sections/WorkCard.tsx` | 作品卡片 |
| `sections/WorksSection.tsx` | 作品展示分区 |
| `sections/SeparatorLine.tsx` | 分区分隔线 |
| `sections/BlogCard.tsx` | 博客卡片 |

## 9) 社交图标

| 文件 | 职责 |
|------|------|
| `social-icons/index.tsx` | 社交图标集合（SocialIcon 组件） |
| `social-icons/icons.tsx` | 各平台 SVG 图标定义 |

## 10) UI 基础组件

| 文件 | 职责 |
|------|------|
| `ui/LoadingStates.tsx` | 加载状态展示 |
| `ui/Skeleton/PostSkeleton.tsx` | 文章骨架屏 |
| `ui/Skeleton/BlogSkeleton.tsx` | 博客骨架屏 |
| `ui/ExcalidrawModal.tsx` | Excalidraw 绘图弹窗 |
| `ui/EnhancedImage.tsx` | 增强图片组件 |
| `ui/Loader.tsx` | 通用加载指示器（lucide-react 旋转器） |
| `ui/SwipeContainer.tsx` | 触摸滑动容器 |
| `ui/LiveRegion.tsx` | 无障碍动态区域（屏幕阅读器通知） |
| `ui/FAB.tsx` | 浮动操作按钮 |
| `loaders/Skeleton.tsx` | 通用骨架屏 |
| `loaders/ListSkeleton.tsx` | 列表骨架屏 |
| `loaders/ComponentLoader.tsx` | 组件加载器 |
| `shadcn/ui/` | shadcn UI 基础组件集（button, separator, avatar, sidebar 等） |

## 11) 主题与视觉 Token

| 文件 | 用途 |
|------|------|
| `styles/tailwind.css` | 全局基础样式 |
| `styles/geist-tokens.css` | Geist 设计变量 |
| `styles/visitor-theme.css` | 访客主题 |
| `styles/monograph-theme.css` | 长文主题 |
| `styles/admin-theme.css` | 后台主题 |
| `styles/admin-compact.css` | 后台紧凑模式 |
| `styles/prism.css` | 代码高亮 |

## 12) 设计交付规范

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
