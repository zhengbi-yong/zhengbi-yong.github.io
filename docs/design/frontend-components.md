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
| `Footer.module.css` | 页脚样式 |
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
| `layouts/BookShelfLayout.tsx` | 书架页面布局 | ✅ |
| `layouts/BookDetailLayout.tsx` | 书籍详情布局 | ✅ |
| `layouts/ListLayout.tsx` | 列表页面布局 | ✅ |
| `layouts/ListLayoutWithTags.tsx` | 带标签筛选的列表布局 | ✅ |
| `layouts/MagazineLayout.tsx` | 杂志风格布局 | ✅ |
| `layouts/PublicPageFrame.tsx` | 公开页面框架布局 | ✅ |

### 管理后台布局
| 文件 | 职责 |
|------|------|
| `admin/AdminLayout.tsx` | 后台布局（侧栏 + 顶栏 + 内容区） |
| `app/(admin)/admin/layout.tsx` | 后台布局入口 |

## 5) 代码块 (CodeBlock)

存在两个 CodeBlock 组件：

| 文件 | 职责 |
|------|------|
| `mdx/CodeBlock.tsx` | MDX 渲染专用的代码块（深色主题 + macOS 窗口装饰 + 复制按钮 + 行号 + 终端模式） |
| `CodeBlock.tsx` | 根级代码块组件（通用用途） |

## 6) 导航组件

| 文件 | 职责 |
|------|------|
| `navigation/TableOfContents/` | IntersectionObserver scroll-spy TOC |

## 7) 首页 Section 组件

| 文件 | 职责 |
|------|------|
| `home/HeroSection.tsx` | Three.js 粒子沉浸英雄区（⚠️ 已实现但不在首页使用，用于其他页面） |
| `home/HeroCard.tsx` | 首页英雄卡片（多层视差效果） |
| `home/SocialCard.tsx` | 社交卡片组件 |
| `home/ToolsCard.tsx` | 工具/技术展示卡片 |
| `home/BentoGrid.tsx` | 首页 Bento 网格 |
| `home/BentoCard.tsx` | Bento 区域卡片 |
| `home/ProjectGallery.tsx` | 项目展示 |
| `home/MusicExperience.tsx` | 音乐体验区 |
| `home/MusicOSMDRenderer.tsx` | OSMD 乐谱渲染器 |
| `home/LatestWriting.tsx` | 最新文章 |
| `home/MegaFooter.tsx` | 尾页巨型 Footer |
| `home/ParticleBackground.tsx` | 粒子背景 |
| `home/CustomCursor.tsx` | 自定义光标（实验性） |
| `home/AnimatedText.tsx` | 文字动画组件 |

## 8) 编辑器组件 (Editor)

| 文件 | 职责 |
|------|------|
| `editor/TiptapEditor.tsx` | 核心富文本编辑器（Tiptap） |
| `editor/SplitEditor.tsx` | 分屏编辑器 |
| `editor/MenuBar.tsx` | 编辑器菜单栏 |
| `editor/EditorToolbar.tsx` | 编辑器工具栏 |
| `editor/EditorStatusBar.tsx` | 编辑器状态栏 |
| `editor/ImmersiveEditorLayout.tsx` | 沉浸式编辑器布局 |
| `editor/FloatingMenu.tsx` | 浮动菜单 |
| `editor/ArticleSettingsPanel.tsx` | 文章设置面板 |
| `editor/ArticleMetadata.tsx` | 文章元数据编辑 |
| `editor/SEOPreviewCard.tsx` | SEO 预览卡片 |
| `editor/CollaborationEditor.tsx` | 协作编辑 |
| `editor/extensions/ShikiCodeBlock.ts` | Shiki 代码块扩展 |
| `editor/extensions/ShikiCodeBlockComponent.tsx` | Shiki 代码块组件 |
| `editor/extensions/CodeBlockShikiNodeView.tsx` | Shiki NodeView |
| `editor/extensions/mathematics-extended.tsx` | 数学公式扩展 |
| `editor/extensions/math-node-view.tsx` | 数学公式 NodeView |
| `editor/hooks/useImageUpload.ts` | 图片上传 Hook |

## 9) 页面 Section 组件 (Sections)

| 文件 | 职责 |
|------|------|
| `sections/Explore.tsx` | 首页探索区域 |
| `sections/FeaturedWork.tsx` | 特色作品展示 |
| `sections/BlogSection.tsx` | 博客文章列表区域 |
| `sections/BlogCard.tsx` | 博客卡片组件 |
| `sections/WorkCard.tsx` | 作品卡片 |
| `sections/SectionHeader.tsx` | Section 标题统一组件 |
| `sections/PageHeader.tsx` | 页面头部 |
| `sections/ActionBar.tsx` | 操作栏 |
| `sections/SeparatorLine.tsx` | 分隔线 |
| `sections/WorksSection.tsx` | 作品集合区域 |
| `sections/Explore.module.css` | Explore 样式 |

## 10) 杂志风格组件 (Magazine)

| 文件 | 职责 |
|------|------|
| `magazine/HeroSection.tsx` | 杂志风格 Hero |
| `magazine/SmartCard.tsx` | 智能卡片 |
| `magazine/BookCard.tsx` | 书籍卡片 |
| `magazine/ChapterCard.tsx` | 章节卡片 |
| `magazine/MasonryGrid.tsx` | 瀑布流网格 |
| `magazine/FilterBar.tsx` | 筛选栏 |
| `magazine/RecommendedSection.tsx` | 推荐区域 |

## 11) 管理后台组件 (Admin)

| 文件 | 职责 |
|------|------|
| `admin/AdminLayout.tsx` | 后台布局（侧栏 + 顶栏 + 内容区） |
| `admin/AdminStatsCard.tsx` | 统计卡片 |
| `admin/BreadcrumbNav.tsx` | 面包屑导航 |
| `admin/ThemeToggle.tsx` | 主题切换 |
| `admin/UserManagement.tsx` | 用户管理 |
| `admin/layout/header.tsx` | 后台顶栏 |
| `admin/layout/main.tsx` | 后台主内容区 |
| `admin/layout/app-sidebar.tsx` | 后台侧边栏 |
| `admin/data-table/DataTableToolbar.tsx` | 数据表格工具栏 |
| `admin/data-table/EnhancedDataTable.tsx` | 增强数据表格 |
| `admin/data-table/index.ts` | 数据表格导出 |
| `admin/badges/StatusBadge.tsx` | 状态徽章 |
| `admin/badges/index.ts` | 徽章导出 |
| `admin/keyboard-shortcuts/CommandPalette.tsx` | 命令面板 |
| `admin/keyboard-shortcuts/KeyboardShortcutProvider.tsx` | 快捷键提供者 |
| `admin/keyboard-shortcuts/index.ts` | 快捷键导出 |
| `admin/team/TeamMemberForm.tsx` | 团队成员编辑表单 |

## 12) 文章相关组件 (Post)

| 文件 | 职责 |
|------|------|
| `post/BackendComments.tsx` | 后端评论组件 |
| `post/LikeButton.tsx` | 点赞按钮 |
| `post/PostBackendIntegration.tsx` | 文章后端集成 |
| `post/PostStats.tsx` | 文章统计 |

## 13) 书籍组件 (Book)

| 文件 | 职责 |
|------|------|
| `book/Book.tsx` | 书籍渲染 |
| `book/Chapter.tsx` | 章节渲染 |
| `book/ArticleCard.tsx` | 文章卡片 |
| `book/BackToShelfButton.tsx` | 返回书架按钮 |

## 14) 搜索组件 (Search)

| 文件 | 职责 |
|------|------|
| `search/SmartSearchBar.tsx` | 智能搜索栏 |
| `search/ApiSearchBar.tsx` | API 搜索栏 |

## 15) 加载状态组件 (Loaders)

| 文件 | 职责 |
|------|------|
| `loaders/Skeleton.tsx` | 通用骨架屏 |
| `loaders/ListSkeleton.tsx` | 列表骨架屏 |
| `loaders/CardSkeleton.tsx` | 卡片骨架屏 |
| `loaders/ArticleSkeleton.tsx` | 文章骨架屏 |
| `loaders/ImageSkeleton.tsx` | 图片骨架屏 |
| `loaders/AnimationSkeleton.tsx` | 动画骨架屏 |
| `loaders/Spinner.tsx` | 旋转加载器 |
| `loaders/ComponentLoader.tsx` | 组件加载器 |
| `loaders/RouteTransition.tsx` | 路由过渡动画 |

## 16) 动画组件 (Animations)

| 文件 | 职责 |
|------|------|
| `animations/FadeIn.tsx` | 淡入动画 |
| `animations/SlideIn.tsx` | 滑入动画 |
| `animations/ScaleIn.tsx` | 缩放进入 |
| `animations/BounceIn.tsx` | 弹跳进入 |
| `animations/RotateIn.tsx` | 旋转进入 |
| `animations/ScrollReveal.tsx` | 滚动揭示 |
| `animations/ParallaxScroll.tsx` | 视差滚动 |
| `animations/PinElement.tsx` | 固定元素动画 |
| `animations/SparklesAnimation.tsx` | 火花粒子效果 |
| `animations/ConfettiAnimation.tsx` | 彩纸效果 |
| `animations/ConfettiOnView.tsx` | 进入视口触发彩纸 |
| `animations/ExplosionAnimation.tsx` | 爆炸效果 |
| `animations/FireworksAnimation.tsx` | 烟花效果 |
| `animations/SVGPathAnimation.tsx` | SVG 路径动画 |
| `animations/SVGShapeMorph.tsx` | SVG 形状变形 |
| `animations/TimelineAnimation.tsx` | 时间线动画 |
| `animations/OptimizedPageTransition.tsx` | 优化页面过渡 |
| `animations/AdvancedScrollAnimation.tsx` | 高级滚动动画 |

## 17) 图表组件 (Charts)

| 文件 | 职责 |
|------|------|
| `charts/NivoBarChart.tsx` | Nivo 柱状图 |
| `charts/NivoLineChart.tsx` | Nivo 折线图 |
| `charts/NivoPieChart.tsx` | Nivo 饼图 |
| `charts/EChartsComponent.tsx` | ECharts 通用组件 |
| `charts/ECharts3DTest.tsx` | ECharts 3D 测试 |
| `charts/AntVChart.tsx` | AntV 图表 |

## 18) 化学组件 (Chemistry)

| 文件 | 职责 |
|------|------|
| `chemistry/ChemicalStructure.tsx` | 化学结构展示 |
| `chemistry/SimpleChemicalStructure.tsx` | 简化化学结构 |
| `chemistry/SMILESConverter.tsx` | SMILES 转换器 |
| `chemistry/RDKitStructure.tsx` | RDKit 结构渲染 |
| `chemistry/MoleculeFingerprint.tsx` | 分子指纹 |
| `chemistry/threeDmol.ts` | 3Dmol 集成 |
| `chemistry/MhchemInit.tsx` | mhchem 初始化 |
| `chemistry/runtimeProps.ts` | 运行时属性 |

## 19) 音频/乐谱组件 (Audio)

| 文件 | 职责 |
|------|------|
| `audio/MusicPlayer.tsx` | 音乐播放器 |

## 20) SEO 组件

| 文件 | 职责 |
|------|------|
| `seo/StructuredData.tsx` | 结构化数据 |
| `seo/JsonLd.tsx` | JSON-LD 结构化数据 |

## 21) Three.js 3D 组件

| 文件 | 职责 |
|------|------|
| `three/ThreeViewer.tsx` | Three.js 3D 查看器 |

## 22) 地图组件

| 文件 | 职责 |
|------|------|
| `maps/InteractiveMap.tsx` | 交互式地图 |

## 23) 访客主题组件 (Visitor)

| 文件 | 职责 |
|------|------|
| `visitor/typography/AnimatedText.tsx` | 动画排版文字 |
| `visitor/micro-interactions/ElegantLink.tsx` | 优雅链接微交互 |
| `visitor/micro-interactions/ElegantButton.tsx` | 优雅按钮微交互 |

## 24) 认证组件 (Auth)

| 文件 | 职责 |
|------|------|
| `auth/AuthModal.tsx` | 认证弹窗 |
| `auth/AuthButton.tsx` | 认证按钮 |
| `auth/AuthInitializer.tsx` | 认证初始化 |
| `auth/PasswordStrengthIndicator.tsx` | 密码强度指示器 |

## 25) 性能监控组件

| 文件 | 职责 |
|------|------|
| `performance/PerformanceDashboard.tsx` | 性能仪表盘 |
| `performance/VirtualList.tsx` | 虚拟列表 |
| `performance/Skeleton.tsx` | 性能版骨架屏 |

## 26) Geist 主题组件

| 文件 | 职责 |
|------|------|
| `geist/GeistButton.tsx` | Geist 风格按钮 |
| `geist/GeistHeader.tsx` | Geist 风格头部 |
| `geist/GeistFooter.tsx` | Geist 风格页脚 |
| `geist/GeistLayout.tsx` | Geist 风格布局 |
| `geist/GeistInput.tsx` | Geist 风格输入框 |
| `geist/GeistSkeleton.tsx` | Geist 风格骨架屏 |
| `geist/GeistBadge.tsx` | Geist 风格徽章 |
| `geist/GeistThemeSwitcher.tsx` | Geist 主题切换 |

## 27) 主题与视觉 Token

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
