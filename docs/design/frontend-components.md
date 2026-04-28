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
| `Footer.tsx` | 页脚整体布局（作者区、导航、社交、备案：京ICP备2025110798号-1） |
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
| `layouts/BookShelfLayout.tsx` | 书架布局 | ✅ |
| `layouts/BookDetailLayout.tsx` | 书籍详情布局 | ✅ |
| `layouts/PublicPageFrame.tsx` | 公开页外壳 | ✅ |
| `layouts/ListLayout.tsx` | 博客列表布局 | ✅ |
| `layouts/ListLayoutWithTags.tsx` | 标签过滤博客列表 | ✅ |
| `layouts/MagazineLayout.tsx` | 杂志式布局 | ✅ |

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
| `MobileNav.tsx` | 移动端导航菜单 |

## 7) 文章交互组件 (post/)

| 文件 | 职责 |
|------|------|
| `post/BackendComments.tsx` | 评论系统（嵌套回复、分页） |
| `post/LikeButton.tsx` | 点赞按钮 |
| `post/PostStats.tsx` | 文章统计（浏览/点赞/评论） |
| `post/PostBackendIntegration.tsx` | 文章后端集成包装器 |

## 8) 认证组件 (auth/)

| 文件 | 职责 |
|------|------|
| `auth/AuthButton.tsx` | 登录/登出按钮 |
| `auth/AuthModal.tsx` | 认证弹窗 |
| `auth/AuthInitializer.tsx` | 认证初始化 |
| `auth/PasswordStrengthIndicator.tsx` | 密码强度指示器 |

## 9) 搜索组件 (search/)

| 文件 | 职责 |
|------|------|
| `search/ApiSearchBar.tsx` | API 驱动搜索（300ms 防抖 + 下拉结果） |
| `search/SmartSearchBar.tsx` | 智能搜索框（建议 + 自动完成） |
| `SearchBoxOptimized.tsx` | 高性能搜索框（预索引 + 模糊匹配） |
| `SearchButton.tsx` | 搜索按钮 |

## 10) 节段组件 (sections/)

| 文件 | 职责 |
|------|------|
| `sections/SectionHeader.tsx` | 节段标题 |
| `sections/PageHeader.tsx` | 页面标题（带动画） |
| `sections/BlogSection.tsx` | 博客节段 |
| `sections/BlogCard.tsx` | 博客卡片 |
| `sections/Explore.tsx` | 探索网格 |
| `sections/ActionBar.tsx` | 底部操作栏 |
| `sections/FeaturedWork.tsx` | 精选作品 |
| `sections/WorksSection.tsx` | 作品节段 |
| `sections/WorkCard.tsx` | 作品卡片 |
| `sections/SeparatorLine.tsx` | 分隔线 |

## 11) 杂志组件 (magazine/)

| 文件 | 职责 |
|------|------|
| `magazine/HeroSection.tsx` | 杂志英雄区（精选文章 + 书籍网格） |
| `magazine/MasonryGrid.tsx` | 瀑布流网格（4 种卡片尺寸 + 无限滚动） |
| `magazine/FilterBar.tsx` | 分类/排序/搜索过滤栏 |
| `magazine/RecommendedSection.tsx` | 智能推荐 |
| `magazine/BookCard.tsx` | 书籍卡片 |
| `magazine/ChapterCard.tsx` | 章节卡片 |
| `magazine/SmartCard.tsx` | 自适应内容卡片 |

## 12) 图表组件 (charts/)

| 文件 | 职责 |
|------|------|
| `charts/NivoBarChart.tsx` | Nivo 柱状图 |
| `charts/NivoLineChart.tsx` | Nivo 折线图 |
| `charts/NivoPieChart.tsx` | Nivo 饼图 |
| `charts/EChartsComponent.tsx` | ECharts 图表 |
| `charts/ECharts3DTest.tsx` | ECharts 3D 测试 |
| `charts/AntVChart.tsx` | AntV G2 图表 |

## 13) 音频乐谱组件 (audio/)

| 文件 | 职责 |
|------|------|
| `audio/MusicPlayer.tsx` | 音乐播放器 |
| `MusicSheet.tsx` | 乐谱显示 |
| `FullscreenMusicSheet.tsx` | 全屏乐谱 |
| `SheetMusic.tsx` | 乐谱渲染 |

## 14) 书籍组件 (book/)

| 文件 | 职责 |
|------|------|
| `book/Book.tsx` | 书籍分类展示 |
| `book/Chapter.tsx` | 章节组件 |
| `book/ArticleCard.tsx` | 文章卡片 |
| `book/BookIcons.tsx` | 书籍图标映射 |
| `book/BackToShelfButton.tsx` | 返回书架按钮 |

## 15) 编辑器组件 (editor/)

| 文件 | 职责 |
|------|------|
| `editor/TiptapEditor.tsx` | TipTap 富文本编辑器 |
| `editor/FloatingMenu.tsx` | 浮动菜单 |
| `editor/EditorToolbar.tsx` | 编辑工具栏 |
| `editor/EditorStatusBar.tsx` | 编辑器状态栏 |
| `editor/ArticleMetadata.tsx` | 文章元数据编辑 |
| `editor/ArticleSettingsPanel.tsx` | 文章设置面板 |
| `editor/SEOPreviewCard.tsx` | SEO 预览卡片 |
| `editor/ImmersiveEditorLayout.tsx` | 沉浸式编辑布局 |
| `editor/SplitEditor.tsx` | 分屏编辑器 |
| `editor/CollaborationEditor.tsx` | 协作编辑器 |
| `editor/MenuBar.tsx` | 菜单栏 |

## 16) 3D 组件 (three/)

| 文件 | 职责 |
|------|------|
| `three/ThreeViewer.tsx` | Three.js 3D 查看器（WebGL LRU 管理） |
| `Hero3DSection.tsx` | 3D 英雄区 |
| `ThreeJSViewer.tsx` | Three.js 查看器 |

## 17) 动画组件 (animations/)

| 文件 | 职责 |
|------|------|
| `animations/FadeIn.tsx` | 淡入动画 |
| `animations/SlideIn.tsx` | 滑入动画 |
| `animations/ScaleIn.tsx` | 缩放动画 |
| `animations/RotateIn.tsx` | 旋转动画 |
| `animations/BounceIn.tsx` | 弹跳动画 |
| `animations/ScrollReveal.tsx` | 滚动揭示动画 |
| `animations/AdvancedScrollAnimation.tsx` | 高级滚动动画 |
| `animations/ParallaxScroll.tsx` | 视差滚动 |
| `animations/PinElement.tsx` | 固定元素 |
| `animations/SparklesAnimation.tsx` | 闪光效果 |
| `animations/ConfettiAnimation.tsx` | 五彩纸屑 |
| `animations/ConfettiOnView.tsx` | 视图触发五彩纸屑 |
| `animations/ExplosionAnimation.tsx` | 爆炸效果 |
| `animations/FireworksAnimation.tsx` | 烟花效果 |
| `animations/SVGPathAnimation.tsx` | SVG 路径动画 |
| `animations/SVGShapeMorph.tsx` | SVG 形状变形 |
| `animations/TimelineAnimation.tsx` | 时间线动画 |
| `animations/OptimizedPageTransition.tsx` | 优化页面过渡 |
| `PageTransition.tsx` | 页面过渡 |

## 18) MDX 组件 (mdx/)

| 文件 | 职责 |
|------|------|
| `mdx/CodeBlock.tsx` | 代码块（深色主题 + macOS 装饰 + 复制按钮 + 行号） |
| `MDXComponents.tsx` | MDX 组件映射注册表 |

## 19) 白板组件 (Excalidraw/)

| 文件 | 职责 |
|------|------|
| `Excalidraw/ExcalidrawViewer.tsx` | Excalidraw 白板查看器 |
| `ui/ExcalidrawModal.tsx` | Excalidraw 模态框 |

## 20) 高斯溅射渲染 (gaussian-splat/)

| 文件 | 职责 |
|------|------|
| `gaussian-splat/GaussianSplat.tsx` | 3D 高斯溅射渲染器 |

## 21) Geist 设计系统 (geist/)

| 文件 | 职责 |
|------|------|
| `geist/GeistButton.tsx` | Geist 按钮 |
| `geist/GeistHeader.tsx` | Geist 页眉 |
| `geist/GeistFooter.tsx` | Geist 页脚 |
| `geist/GeistLayout.tsx` | Geist 布局 |
| `geist/GeistInput.tsx` | Geist 输入框 |
| `geist/GeistSkeleton.tsx` | Geist 骨架屏 |
| `geist/GeistBadge.tsx` | Geist 徽章 |
| `geist/GeistThemeSwitcher.tsx` | Geist 主题切换 |

## 22) 访客组件 (visitor/)

| 文件 | 职责 |
|------|------|
| `visitor/micro-interactions/ElegantLink.tsx` | 优雅链接 |
| `visitor/micro-interactions/ElegantButton.tsx` | 优雅按钮 |
| `VisitorTracker.tsx` | 访客追踪 |
| `VisitorMap.tsx` | 访客地图 |
| `VisitorMapClient.tsx` | 访客地图客户端 |

## 23) 地图组件 (maps/)

| 文件 | 职责 |
|------|------|
| `maps/InteractiveMap.tsx` | Leaflet 交互式地图 |

## 24) 性能监控 (performance/)

| 文件 | 职责 |
|------|------|
| `performance/PerformanceDashboard.tsx` | 性能仪表盘 |
| `PerformanceMonitor.tsx` | 性能监控 |
| `PerformanceNotice.tsx` | 性能提示 |

## 25) 加载骨架屏 (loaders/)

| 文件 | 职责 |
|------|------|
| `loaders/ComponentLoader.tsx` | 通用加载包装器 |
| `loaders/Skeleton.tsx` | 基础骨架屏 |
| `loaders/ListSkeleton.tsx` | 列表骨架屏 |
| `loaders/ArticleSkeleton.tsx` | 文章骨架屏 |
| `loaders/CardSkeleton.tsx` | 卡片骨架屏 |
| `loaders/ImageSkeleton.tsx` | 图片骨架屏 |
| `loaders/AnimationSkeleton.tsx` | 动画骨架屏 |
| `loaders/Spinner.tsx` | 旋转加载 |
| `loaders/RouteTransition.tsx` | 路由过渡 |

## 26) 社交图标 (social-icons/)

| 文件 | 职责 |
|------|------|
| `social-icons/index.tsx` | 社交图标组件（13 平台：Mail, GitHub, Facebook, YouTube, LinkedIn, Twitter/X, Mastodon, Threads, Instagram, Medium, Bluesky） |
| `social-icons/icons.tsx` | SVG 图标定义 |

## 27) 首页 Section 组件

| 文件 | 职责 |
|------|------|
| `home/HeroSection.tsx` | Three.js 粒子沉浸英雄区 |
| `home/BentoGrid.tsx` | 首页 Bento 网格 |
| `home/ProjectGallery.tsx` | 项目展示 |
| `home/MusicExperience.tsx` | 音乐体验区 |
| `home/LatestWriting.tsx` | 最新文章 |
| `home/MegaFooter.tsx` | 尾页巨型 Footer |

## 28) 主题与视觉 Token

| 文件 | 用途 |
|------|------|
| `styles/tailwind.css` | 全局基础样式 |
| `styles/geist-tokens.css` | Geist 设计变量 |
| `styles/visitor-theme.css` | 访客主题 |
| `styles/monograph-theme.css` | 长文主题 |
| `styles/admin-theme.css` | 后台主题 |
| `styles/admin-compact.css` | 后台紧凑模式 |
| `styles/prism.css` | 代码高亮 |

## 29) 设计交付规范

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
