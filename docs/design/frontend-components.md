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
| `Header.module.css` | 页眉样式 |

## 3) 页脚模块 (Footer)

| 文件 | 职责 |
|------|------|
| `Footer.tsx` | 页脚整体布局（作者区、导航、社交、备案） |
| `home/MegaFooter.tsx` | 首页全屏 CTA 页脚 |

## 4) 布局组件

### 站点级
| 文件 | 职责 |
|------|------|
| `SectionContainer.tsx` | 内容横向边距规则 |

### 业务布局
| 文件 | 职责 | 状态 |
|------|------|------|
| `layouts/PostLayoutMonograph.tsx` | 长文阅读布局（黄金比例双栏、sticky TOC、进度条） | ✅ 唯一活跃 |
| `layouts/AuthorLayout.tsx` | 作者页 | ✅ |
| `layouts/ListLayout.tsx` | 博客列表页（搜索、无限滚动、骨架屏） | ✅ |
| `layouts/ListLayoutWithTags.tsx` | 带标签过滤的博客列表 | ✅ |
| `layouts/MagazineLayout.tsx` | 杂志风格布局（Hero + 筛选 + 瀑布流） | ✅ |
| `layouts/BookDetailLayout.tsx` | 书籍详情布局 | ✅ |
| `layouts/BookShelfLayout.tsx` | 书架网格布局 | ✅ |
| `layouts/PublicPageFrame.tsx` | 公开页通用框架 | ✅ |

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
| `navigation/TableOfContents/` | IntersectionObserver scroll-spy TOC |

## 7) 首页 Section 组件

| 文件 | 职责 | 备注 |
|------|------|------|
| `home/HeroSection.tsx` | Three.js 粒子沉浸英雄区 | 可用但未被主页直接引用 |
| `home/HeroCard.tsx` | 主页英雄卡片（视差效果） | 被 `Main.tsx` 使用 |
| `home/SocialCard.tsx` | 社交链接卡片 | 被 `Main.tsx` 使用 |
| `home/ParticleBackground.tsx` | Three.js 粒子背景场景 | 被 `HeroSection` 动态加载 |
| `home/BentoGrid.tsx` | 首页 Bento 网格 | 可用 |
| `home/ProjectGallery.tsx` | 项目展示（横向滚动） | 可用 |
| `home/MusicExperience.tsx` | 音乐体验区（OSMD+Tone.js） | 可用 |
| `home/LatestWriting.tsx` | 最新文章 | 可用 |
| `home/MegaFooter.tsx` | 尾页巨型 Footer | 被 `(public)/layout.tsx` 使用 |
| `sections/Explore.tsx` | 探索区域 | 被 `Main.tsx` 使用 |
| `sections/FeaturedWork.tsx` | 精选作品 | 被 `Main.tsx` 使用 |
| `sections/BlogSection.tsx` | 博客文章区域 | 被 `Main.tsx` 使用 |

## 8) 主题与视觉 Token

| 文件 | 用途 |
|------|------|
| `styles/tailwind.css` | 全局基础样式 |
| `styles/geist-tokens.css` | Geist 设计变量 |
| `styles/visitor-theme.css` | 访客主题 |
| `styles/monograph-theme.css` | 长文主题 |
| `styles/admin-theme.css` | 后台主题 |
| `styles/admin-compact.css` | 后台紧凑模式 |
| `styles/prism.css` | 代码高亮 |

## 9) 设计交付规范

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
