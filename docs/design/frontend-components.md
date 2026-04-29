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
| `home/MegaFooter.tsx` | 首页全屏 CTA 页脚 |

## 4) 布局组件

### 站点级
| 文件 | 职责 |
|------|------|
| `SectionContainer.tsx` | 内容横向边距规则 |

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
| `CodeBlock.tsx` | 轻量级代码块（macOS 窗口装饰 + 复制按钮 + 终端模式） |
| `mdx/CodeBlock.tsx` | 高级代码块（Shiki 语法高亮 + 深色主题 + macOS 窗口装饰 + 复制按钮 + 行号 + 终端模式） |

## 6) 杂志风格组件 (Magazine)

| 文件 | 职责 |
|------|------|
| `magazine/HeroSection.tsx` | 特色文章 + 书籍网格英雄区 |
| `magazine/MasonryGrid.tsx` | 响应式瀑布流布局 + 无限滚动 |
| `magazine/FilterBar.tsx` | 分类过滤 + 排序 + 搜索 |
| `magazine/RecommendedSection.tsx` | 基于阅读历史的推荐引擎 |
| `magazine/BookCard.tsx` | 书籍封面卡片 |
| `magazine/SmartCard.tsx` | 智能内容卡片（自动适配类型） |
| `magazine/ChapterCard.tsx` | 章节预览卡片 |

## 7) 书籍组件 (Book)

| 文件 | 职责 |
|------|------|
| `book/Book.tsx` | 书籍分类展示（动画优化、响应式） |
| `book/Chapter.tsx` | 章节展示（进度指示器） |
| `book/ArticleCard.tsx` | 文章卡片（缩略图、元数据） |
| `book/BackToShelfButton.tsx` | 返回书架导航按钮 |
| `book/BookIcons.tsx` | 书籍分类图标映射 |

## 8) 编辑器组件 (Editor)

| 文件 | 职责 |
|------|------|
| `editor/TiptapEditor.tsx` | TipTap 富文本编辑器核心 |
| `editor/MenuBar.tsx` | 编辑器工具栏菜单 |
| `editor/EditorToolbar.tsx` | 格式化工具栏 |
| `editor/FloatingMenu.tsx` | 浮动菜单 (⚠️ 不存在 — 文档与实际不符) |
| `editor/SplitEditor.tsx` | 分屏编辑器 |
| `editor/ImmersiveEditorLayout.tsx` | 沉浸式编辑布局 |
| `editor/ArticleSettingsPanel.tsx` | 文章设置面板 |
| `editor/ArticleMetadata.tsx` | 文章元数据编辑 |
| `editor/SEOPreviewCard.tsx` | SEO 预览卡片 |
| `editor/CollaborationEditor.tsx` | 协作编辑 |
| `editor/EditorStatusBar.tsx` | 编辑器状态栏 |
| `editor/hooks/useImageUpload.ts` | 图片上传 Hook |

> **注意**：`editor/extensions/` 目录**不存在**。文档此前列出的扩展文件（`mathematics-extended.tsx`、`ShikiCodeBlockComponent.tsx`、`ShikiCodeBlock.ts`、`CodeBlockShikiNodeView.tsx`、`math-node-view.tsx`）均不存在。编辑器扩展由 TipTap 的 `@tiptap/*` npm 包直接提供，未在 `src/components/editor/extensions/` 下创建自定义扩展文件。

## 9) 认证组件 (Auth)

| 文件 | 职责 |
|------|------|
| `auth/AuthButton.tsx` | 认证按钮（登录/登出） |
| `auth/AuthModal.tsx` | 登录/注册模态框 |
| `auth/AuthInitializer.tsx` | 认证状态初始化 |
| `auth/PasswordStrengthIndicator.tsx` | 密码强度指示器 |

## 10) 搜索组件 (Search)

| 文件 | 职责 |
|------|------|
| `search/ApiSearchBar.tsx` | API 驱动搜索栏（防抖、自动补全、实时结果） |
| `search/SmartSearchBar.tsx` | 智能搜索栏 |

## 11) 加载状态组件 (Loaders)

| 文件 | 职责 |
|------|------|
| `loaders/ComponentLoader.tsx` | 通用加载包装器 |
| `loaders/Spinner.tsx` | 旋转加载图标 |
| `loaders/Skeleton.tsx` | 基础骨架屏（text/rect/circle） |
| `loaders/ListSkeleton.tsx` | 文章列表骨架屏 |
| `loaders/ArticleSkeleton.tsx` | 文章详情骨架屏 |
| `loaders/CardSkeleton.tsx` | 卡片骨架屏 |
| `loaders/ImageSkeleton.tsx` | 图片占位骨架屏 |
| `loaders/AnimationSkeleton.tsx` | 动画组件骨架屏 |
| `loaders/RouteTransition.tsx` | 路由切换过渡 |
| `loaders/index.ts` | 统一导出 |

## 12) 化学可视化组件 (Chemistry)

| 文件 | 职责 |
|------|------|
| `chemistry/ChemicalStructure.tsx` | 3D 分子结构查看器（3Dmol.js） |
| `chemistry/RDKitStructure.tsx` | RDKit 2D 结构渲染 |
| `chemistry/SimpleChemicalStructure.tsx` | 轻量级结构查看器 |
| `chemistry/SMILESConverter.tsx` | SMILES 符号转换器 |
| `chemistry/MoleculeFingerprint.tsx` | 分子指纹可视化 |
| `chemistry/MhchemInit.tsx` | LaTeX mhchem 化学公式初始化 |
| `chemistry/threeDmol.ts` | 3Dmol.js 工具函数 |
| `chemistry/runtimeProps.ts` | 运行时属性类型 |
| `chemistry/index.ts` | 统一导出 |

## 13) 自定义 UI 组件与 Shadcn 分离说明

| 路径 | 内容 | 说明 |
|------|------|------|
| `components/shadcn/ui/` | accordion, alert, avatar, badge, button, card, dialog, dropdown-menu, input, label, progress, select, separator, sheet, sidebar, skeleton, sonner, tabs, textarea, tooltip 等（共 20 个组件） | shadcn/ui 基础组件（基于 Radix UI + Tailwind） |
| `components/ui/` | EnhancedImage, ExcalidrawModal, LoadingStates, Skeleton/, LiveRegion, Loader, SwipeContainer, FAB 等 | 项目自定义 UI 组件 |

## 14) 导航组件

| 文件 | 职责 |
|------|------|
| `navigation/TableOfContents/` | IntersectionObserver scroll-spy TOC |

## 15) 首页 Section 组件

| 文件 | 职责 |
|------|------|
| `home/HeroSection.tsx` | Three.js 粒子沉浸英雄区 |
| `home/BentoGrid.tsx` | 首页 Bento 网格 |
| `home/ProjectGallery.tsx` | 项目展示 |
| `home/MusicExperience.tsx` | 音乐体验区 |
| `home/LatestWriting.tsx` | 最新文章 |
| `home/MegaFooter.tsx` | 尾页巨型 Footer |

## 16) CSS Modules 使用

部分组件使用 CSS Modules（`.module.css`）实现样式隔离：

| 文件 | 用途 |
|------|------|
| `components/Header.module.css` | 页眉组件样式 |
| `components/Footer.module.css` | 页脚组件样式 |
| `components/BackToTop.module.css` | 回到顶部按钮样式 |
| `components/navigation/TableOfContents/TOC.module.css` | TOC 目录导航样式 |
| `components/sections/Explore.module.css` | Explore 区域样式 |

> **说明**：CSS Modules 与 Tailwind CSS 并行使用。前者用于复杂动画、媒体查询和精细控制，后者用于常规布局和基础样式。

## 17) 主题与视觉 Token

| 文件 | 用途 |
|------|------|
| `styles/tailwind.css` | 全局基础样式 |
| `styles/geist-tokens.css` | Geist 设计变量 |
| `styles/visitor-theme.css` | 访客主题 |
| `styles/monograph-theme.css` | 长文主题 |
| `styles/admin-theme.css` | 后台主题 |
| `styles/admin-compact.css` | 后台紧凑模式 |
| `styles/prism.css` | 代码高亮 |

## 18) 补充目录说明

以下是文档未覆盖但实际存在的组件目录：

| 目录 | 内容 | 说明 |
|------|------|------|
| `components/dev/` | ReactQueryDevtoolsLoader.tsx | 开发工具（仅在开发环境加载） |
| `components/geist/` | GeistBadge, GeistButton, GeistFooter, GeistHeader, GeistInput, GeistLayout, GeistSkeleton, GeistThemeSwitcher 等共 9 个文件 | Geist 设计系统组件库 |
| `components/lib/` | utils.ts（`cn()` 工具函数） | 通用工具组件 |
| `components/hooks/` | 11 个自定义 Hook（useActiveHeading, useReadingProgressWithApi, useGSAP, useScrollAnimation 等） | 自定义 React Hooks |
| `components/post/` | BackendComments, LikeButton, PostBackendIntegration, PostStats（共 4 个文件 + CLAUDE.md） | 文章交互组件（评论、点赞、统计） |
| `components/visitor/` | micro-interactions/ElegantLink.tsx, micro-interactions/ElegantButton.tsx | 访客微交互动效 |

> **说明**：以上目录中的组件未在前文各模块分类中列出，但它们属于 `components/` 下的独立功能模块。`components/hooks/` 和 `components/post/` 有各自独立的 CLAUDE.md 文档可供参考。`components/geist/` 下的组件在 `app/geist/` 路由中使用。

## 19) 设计交付规范

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
