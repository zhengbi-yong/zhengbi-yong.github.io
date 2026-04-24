# Frontend

## Purpose

Next.js 15 前端，提供博客、MDX 渲染、认证、Admin 管理面板和杂志风格布局。面向全球受众设计，支持高并发访问。

---

## Quick Start

```bash
cd frontend
pnpm install

# 开发服务器（http://localhost:3001）
pnpm dev

# 生产构建
pnpm build && pnpm start

# 代码检查
pnpm lint
pnpm tsc --noEmit
```

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router), React 19 |
| 语言 | TypeScript 5.7+ |
| 包管理 | pnpm |
| 样式 | Tailwind CSS 3.4 + shadcn/ui + Radix UI |
| 动画 | Framer Motion, GSAP |
| 状态 | Zustand (客户端), TanStack Query (服务端) |
| 内容 | MDX + Velite (内容编译), next-mdx-remote |
| 数学 | KaTeX (rehype-katex) |
| 图表 | Nivo, ECharts, AntV G2 |
| 3D/化学 | @react-three/fiber, 3Dmol.js, RDKit (WASM) |
| 认证 | Backend JWT + HttpOnly Cookie（无 NextAuth.js） |
| 测试 | Playwright (E2E), Vitest (单元) |
| i18n | next-intl |

---

## 目录结构

```
frontend/
│
├── src/                              # ★ 所有业务代码（Next.js App Router）
│   │
│   ├── app/                          # 路由页面
│   │   ├── (public)/                 #   公开路由组
│   │   │   └── blog/[...slug]        #   博客文章页（catch-all）
│   │   │
│   │   ├── about/                    # 关于页
│   │   ├── admin/                    # 管理后台
│   │   │   ├── analytics/            #   数据分析
│   │   │   ├── comments/             #   评论审核
│   │   │   ├── media/                #   媒体库
│   │   │   ├── monitoring/           #   系统监控
│   │   │   │   ├── health/           #     健康检查
│   │   │   │   └── metrics/          #     性能指标
│   │   │   ├── posts/                #   文章管理
│   │   │   │   ├── edit/[...slug]/    #     编辑文章
│   │   │   │   ├── versions/[...slug]/ #     历史版本
│   │   │   │   ├── show/[...slug]/    #     查看文章
│   │   │   │   └── new/              #     新建文章
│   │   │   ├── posts-manage/         #   简易文章管理
│   │   │   ├── settings/             #   站点设置
│   │   │   ├── team/                 #   团队管理
│   │   │   │   ├── edit/            #     编辑成员
│   │   │   │   └── new/             #     新建成员
│   │   │   ├── test/                 #   测试页
│   │   │   └── users-refine/         #   Refine 版用户管理
│   │   │
│   │   ├── analytics/                # 访客分析页
│   │   ├── api/                      # BFF API 路由
│   │   │   ├── newsletter/           #   Newsletter 订阅
│   │   │   ├── visitor/              #   访客追踪
│   │   │   ├── visitors/             #   访客统计
│   │   │   └── v1/[...path]         #   代理到后端 /api/v1/*
│   │   │
│   │   ├── blog/                     # 博客入口
│   │   │   ├── category/[category]/  #   分类页
│   │   │   ├── page/[page]           #   分页
│   │   │   ├── popular/              #   热门文章
│   │   │   └── post/[id]            #   单篇文章
│   │   │
│   │   ├── excalidraw/               # Excalidraw 白板
│   │   ├── geist/                    # Geist UI 演示
│   │   ├── login/                    # 登录
│   │   ├── music/[name]/             # 音乐播放页
│   │   ├── notifications/            # 通知中心
│   │   ├── profile/                  # 用户资料
│   │   ├── projects/                 # 项目展示
│   │   ├── reading-history/         # 阅读历史
│   │   ├── reading-list/             # 阅读清单
│   │   ├── search/                   # 全局搜索
│   │   ├── tags/                     # 标签聚合页
│   │   │   └── [tag]/page/[page]    #   标签 + 分页
│   │   ├── team/                     # 团队页
│   │   ├── visitors/                 # 访客统计页
│   │   ├── [实验性路由...]           # test-abc, experiment, offline, simple-test 等
│   │   │
│   │   └── layout.tsx                # 根布局
│   │
│   ├── components/                   # React 组件（按功能划分）
│   │   ├── admin/                    #   Admin 后台组件
│   │   │   ├── badges/              #     徽章 Badge
│   │   │   ├── data-table/          #     通用数据表格
│   │   │   └── keyboard-shortcuts/  #     键盘快捷键
│   │   │
│   │   ├── ai/                      #   AI 聊天助手
│   │   │   └── AIChatAssistant.tsx
│   │   │
│   │   ├── animations/               #   交互动画
│   │   │   ├── AdvancedScrollAnimation.tsx
│   │   │   ├── BounceIn.tsx
│   │   │   ├── ConfettiAnimation.tsx
│   │   │   ├── FadeIn.tsx
│   │   │   └── ParallaxScroll.tsx
│   │   │
│   │   ├── audio/                    #   音乐播放器
│   │   │   └── MusicPlayer.tsx
│   │   │
│   │   ├── auth/                     #   认证组件
│   │   │   ├── AuthButton.tsx        #     登录/登出按钮
│   │   │   ├── AuthInitializer.tsx   #     认证初始化
│   │   │   ├── AuthModal.tsx        #     认证弹窗
│   │   │   └── PasswordStrengthIndicator.tsx
│   │   │
│   │   ├── blog/                     #   博客核心组件
│   │   │   ├── ApiBlogPage.tsx      #     API 驱动博客页
│   │   │   └── ReadingProgressTracker.tsx
│   │   │
│   │   ├── book/                     #   专著/书籍组件
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── Book.tsx
│   │   │   ├── BookIcons.tsx
│   │   │   ├── BookShelfLayout.tsx
│   │   │   └── Chapter.tsx
│   │   │
│   │   ├── charts/                   #   图表组件
│   │   │   ├── AntVChart.tsx        #     AntV (G2)
│   │   │   ├── EChartsComponent.tsx #     ECharts
│   │   │   ├── NivoBarChart.tsx
│   │   │   ├── NivoLineChart.tsx
│   │   │   ├── NivoPieChart.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── chemistry/                #   化学可视化
│   │   │   ├── ChemicalStructure.tsx
│   │   │   ├── RDKitStructure.tsx    #     RDKit WASM 渲染
│   │   │   ├── SMILESConverter.tsx
│   │   │   └── threeDmol.ts         #     3Dmol.js 运行时
│   │   │
│   │   ├── editor/                   #   富文本编辑器（Tiptap）
│   │   │   ├── ImmersiveEditorLayout.tsx
│   │   │   ├── TiptapEditor.tsx
│   │   │   ├── EditorToolbar.tsx
│   │   │   └── SEOPreviewCard.tsx
│   │   │
│   │   ├── geist/                    #   Geist Design System 组件
│   │   │   ├── GeistButton.tsx
│   │   │   ├── GeistHeader.tsx
│   │   │   ├── GeistLayout.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── header/                   #   站点头部
│   │   │   ├── DarkModeToggle.tsx
│   │   │   ├── HeaderNavigation.tsx
│   │   │   └── MobileMenuButton.tsx
│   │   │
│   │   ├── home/                     #   首页组件
│   │   │   ├── BentoGrid.tsx        #     宾果卡片网格
│   │   │   ├── HeroSection.tsx      #     首屏 Hero（包含 @react-three/fiber）
│   │   │   ├── LatestWriting.tsx
│   │   │   └── MusicExperience.tsx
│   │   │
│   │   ├── hooks/                    #   自定义 React Hooks
│   │   │   ├── useAnalyticsStorage.ts
│   │   │   ├── useGSAP.ts
│   │   │   ├── useImagePreload.ts
│   │   │   ├── usePerformanceMonitor.ts
│   │   │   └── useReadingProgress.ts
│   │   │
│   │   ├── layouts/                  #   页面布局组件
│   │   │   ├── AuthorLayout.tsx
│   │   │   ├── BookDetailLayout.tsx
│   │   │   ├── BookShelfLayout.tsx
│   │   │   ├── ListLayout.tsx       #     列表布局（博客索引）
│   │   │   ├── ListLayoutWithTags.tsx
│   │   │   ├── MagazineLayout.tsx   #     杂志布局
│   │   │   ├── PostLayout.tsx      #     文章详情布局
│   │   │   └── PostBanner.tsx
│   │   │
│   │   ├── magazine/                 #   杂志风格布局
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── BookCard.tsx
│   │   │   ├── FilterBar.tsx       #     分类/标签筛选
│   │   │   ├── HeroSection.tsx
│   │   │   ├── MasonryGrid.tsx     #     瀑布流网格
│   │   │   └── RecommendedSection.tsx
│   │   │
│   │   ├── maps/                     #   地图可视化
│   │   │   └── InteractiveMap.tsx
│   │   │
│   │   ├── mdx/                      #   MDX 渲染增强
│   │   │   └── CodeBlock.tsx        #     代码高亮（Prism）
│   │   │
│   │   ├── media/                    #   媒体组件
│   │   │   └── Image/               #     优化图片组件（含 lazy-load）
│   │   │
│   │   ├── navigation/              #   导航组件
│   │   │   └── TableOfContents/    #     文章目录（TOC）
│   │   │
│   │   ├── performance/             #   性能优化组件
│   │   │   ├── PerformanceDashboard.tsx
│   │   │   ├── ProportionalImage.tsx
│   │   │   └── VirtualList.tsx      #     虚拟列表（长列表优化）
│   │   │
│   │   ├── post/                     #   文章互动组件
│   │   │   ├── BackendComments.tsx #     后端评论集成
│   │   │   ├── CommentDrawer.tsx
│   │   │   ├── CommentForm.tsx
│   │   │   └── LikeButton.tsx
│   │   │
│   │   ├── search/                    #   搜索组件
│   │   │   ├── ApiSearchBar.tsx
│   │   │   └── SmartSearchBar.tsx
│   │   │
│   │   ├── sections/                 #   通用页面区块
│   │   │   ├── BlogCard.tsx
│   │   │   ├── BlogSection.tsx
│   │   │   ├── Explore.tsx
│   │   │   ├── FeaturedWork.tsx
│   │   │   └── SectionHeader.tsx
│   │   │
│   │   ├── seo/                      #   SEO 组件
│   │   │   ├── JsonLd.tsx           #     结构化数据
│   │   │   └── StructuredData.tsx
│   │   │
│   │   ├── shadcn/ui/               #   shadcn/ui 基础组件库
│   │   │
│   │   ├── social-icons/             #   社交图标
│   │   │   └── icons.tsx
│   │   │
│   │   ├── three/                    #   Three.js 3D 渲染
│   │   │   └── ThreeViewer.tsx
│   │   │
│   │   ├── ui/                       #   通用 UI 组件
│   │   │   ├── EnhancedImage.tsx
│   │   │   ├── FAB.tsx              #     悬浮操作按钮
│   │   │   ├── OptimizedImage.tsx
│   │   │   └── SwipeContainer.tsx
│   │   │
│   │   ├── visitor/                  #   访客端 UI
│   │   │   ├── cards/               #     访客卡片组件
│   │   │   ├── micro-interactions/  #     微交互动效
│   │   │   └── typography/          #     访客字体样式
│   │   │
│   │   ├── Excalidraw/              #   Excalidraw 白板集成
│   │   │   └── ExcalidrawViewer.tsx
│   │   │
│   │   ├── MDXComponents/           #   MDX 自定义组件
│   │   │   └── ExcalidrawEmbed.tsx
│   │   │
│   │   ├── debug/                   #   调试组件
│   │   │   └── DebugPanel.tsx
│   │   │
│   │   ├── dev/                     #   开发工具组件
│   │   │   └── ReactQueryDevtoolsLoader.tsx
│   │   │
│   │   ├── loaders/                 #   骨架屏 / 加载态
│   │   │   ├── AnimationSkeleton.tsx
│   │   │   ├── ArticleSkeleton.tsx
│   │   │   └── Spinner.tsx
│   │   │
│   │   └── lib/                     #   组件级工具函数
│   │       └── utils.ts
│   │
│   ├── lib/                         # 核心业务库
│   │   ├── adapters/                #   第三方 SDK 适配层
│   │   ├── ai/                      #   AI / LLM 集成
│   │   ├── api/                     #   API 客户端
│   │   │   ├── apiClient.ts         #     Axios 实例
│   │   │   ├── backend.ts          #     后端 API 调用封装
│   │   │   ├── resolveBackendApiBaseUrl.ts
│   │   │   └── generated/          #     Orval 自动生成的类型
│   │   │       └── schemas/        #       OpenAPI Schema
│   │   │
│   │   ├── cache/                   #   缓存策略
│   │   │   ├── blog-cache-client.ts
│   │   │   ├── blog-cache.ts
│   │   │   ├── post-cache-client.ts
│   │   │   └── ...
│   │   │
│   │   ├── chemistry/               #   化学计算库集成
│   │   ├── contexts/                #   React Context
│   │   │   └── ...
│   │   │
│   │   ├── db/                      #   文件系统博客抽象层（读 content/posts/）
│   │   ├── hooks/                   #   通用 Hooks（非组件专用）
│   │   ├── performance/             #   性能监控与分析
│   │   │   ├── code-splitting.tsx   #     代码分割工具
│   │   │   ├── image-optimization.ts
│   │   │   ├── performance-monitor.tsx
│   │   │   ├── prefetch-manager.ts  #     预取管理器
│   │   │   └── resource-preloader.ts
│   │   │
│   │   ├── pliny/                   #   Pliny 博客框架核心
│   │   │   ├── utils/              #     Pliny 工具函数
│   │   │   └── ...
│   │   │
│   │   ├── providers/               #   React Provider 组件
│   │   ├── security/                #   安全工具（XSS/CSRF 防护）
│   │   ├── server/                  #   服务端工具
│   │   ├── store/                   #   Zustand 状态管理
│   │   │   ├── auth-store.ts       #     认证状态
│   │   │   ├── blog-store.ts       #     博客状态
│   │   │   ├── comment-store.ts    #     评论状态
│   │   │   ├── post-store.ts       #     文章状态
│   │   │   ├── ui-store.ts         #     UI 状态
│   │   │   └── core/               #     Store 核心实现
│   │   │
│   │   ├── types/                   #   全局 TypeScript 类型
│   │   ├── ui/                      #   通用 UI 工具
│   │   ├── utils/                   #   通用工具函数
│   │   │   ├── recommendation-algorithm.ts  #   推荐算法
│   │   │   ├── extract-toc.ts       #     目录提取
│   │   │   ├── image-preloader.ts
│   │   │   ├── ip-geolocation.ts    #     IP 地理位置
│   │   │   └── ...
│   │   │
│   │   └── webgl/                   #   WebGL / 3D 渲染工具
│   │
│   ├── locales/                     # i18n 翻译文件
│   │   ├── en/                      #   英文
│   │   └── zh-CN/                   #   简体中文
│   │
│   ├── mocks/                       # MSW (Mock Service Worker)
│   │   ├── factories/               #   Mock 数据工厂
│   │   └── handlers/                #   API Mock 处理器
│   │
│   ├── payload/                     # Payload CMS 配置
│   │   └── collections/             #   Payload Collection 定义
│   │
│   └── styles/                      # 运行时样式表（被打入 CSS bundle）
│       ├── tailwind.css              #   Tailwind 入口 + @tailwind 指令
│       ├── admin-theme.css           #   Admin 后台主题
│       ├── visitor-theme.css         #   访客前端主题
│       ├── monograph-theme.css       #   专著/论文主题
│       ├── geist-tokens.css          #   Geist 字体/排版 tokens
│       └── prism.css                 #   代码高亮样式
│
├── styles/                           # 设计令牌（Design Tokens，★ 不是运行时 CSS）
│   └── tokens/                       #   设计系统源数据
│       ├── index.css                 #   入口，@import 其他 tokens
│       ├── colors.css                #   颜色系统（--color-primary-500 等）
│       └── spacing.css               #   间距系统（--spacing-md: 16px 等）
│
├── content/                          # MDX/MD 博客源文件（Velite 编译输入）
│   └── blog/                         #   博客文章源文件
│       └── rdkit化学结构可视化完整指南.md
│
├── .velite/                         # ★ Velite 编译输出目录（机器生成）
│   ├── blog.json                    #   博客索引
│   ├── authors.json                  #   作者索引
│   └── index.js                     #   编译入口
│
├── data/                            # Velite 源内容（MDX + YAML/JSON）
│   ├── authors/                      #   作者信息 MDX
│   │   └── default.mdx
│   ├── blog/                        #   ★ 博客文章 MDX 源文件
│   │   ├── chemistry/               #     化学
│   │   │   └── rdkit-visualization.mdx
│   │   ├── computer/               #     计算机科学
│   │   │   ├── architecture/
│   │   │   ├── artificial_intelligence/
│   │   │   │   ├── diffusion_policy.mdx
│   │   │   │   ├── federated_learning.mdx
│   │   │   │   ├── machine_learning_data_format.mdx
│   │   │   │   └── yolo.mdx
│   │   │   ├── database/
│   │   │   ├── frontend/
│   │   │   │   ├── charts.mdx
│   │   │   │   ├── frontend_data_graph.mdx
│   │   │   │   └── frontend_map.mdx
│   │   │   ├── game/
│   │   │   ├── graphics/
│   │   │   ├── high_performance_computing/
│   │   │   │   ├── cuda.mdx
│   │   │   │   ├── cudnn.mdx
│   │   │   │   ├── triton.mdx
│   │   │   │   └── nvcc.mdx
│   │   │   ├── language/
│   │   │   ├── network/
│   │   │   ├── skill/
│   │   │   │   ├── animation_in_mdx.mdx
│   │   │   │   ├── bash_hotkey.mdx
│   │   │   │   ├── claude_code_prompt.mdx
│   │   │   │   ├── dotfile.mdx
│   │   │   │   ├── ghostty.mdx
│   │   │   │   └── vim_hotkey.mdx
│   │   │   └── software_engineering/
│   │   │       ├── docker.mdx
│   │   │       ├── emacs.mdx
│   │   │       └── neovim.mdx
│   │   │       ...
│   │   ├── control/                 #     控制理论/机器人
│   │   ├── economics/              #     经济
│   │   ├── math/                   #     数学
│   │   ├── motor/                  #     电机/驱动器
│   │   │   ├── coreless_motor.mdx
│   │   │   ├── encoder.mdx
│   │   │   ├── moteus.mdx
│   │   │   ├── odrive.mdx
│   │   │   ├── rv_reducer.mdx
│   │   │   └── vesc.mdx
│   │   ├── music/                  #     音乐
│   │   ├── photography/            #     摄影
│   │   ├── robotics/               #     具身智能 ★
│   │   │   ├── diffusion_policy.mdx
│   │   │   ├── dexmani.mdx
│   │   │   ├── isaaclab.mdx
│   │   │   ├── lerobot.mdx
│   │   │   ├── locomotion.mdx
│   │   │   ├── mjlab.mdx
│   │   │   ├── mujoco.mdx
│   │   │   ├── pi0.mdx / pi0_5.mdx / pi0_6.mdx
│   │   │   ├── reinforcement_learning.mdx
│   │   │   ├── robopianist.mdx
│   │   │   ├── shadow_hand.mdx
│   │   │   └── unitree_sdk2_analysis.mdx
│   │   │       ...
│   │   ├── social/
│   │   ├── tacti le/              #     触觉传感
│   │   └── tools/                  #     工具推荐
│   │
│   ├── headerNavLinks.ts           #   头部导航配置
│   ├── musicData.ts                 #   音乐数据
│   ├── projectsData.ts              #   项目数据
│   ├── siteMetadata.ts              #   站点元数据配置
│   ├── socialData.ts                #   社交链接
│   ├── teamData.ts                  #   团队成员
│   └── works.ts                     #   作品集
│
├── scripts/                          # 构建自动化脚本
│   ├── build/                        #   构建阶段脚本
│   │   ├── analyze-bundle.sh        #     Bundle 分析
│   │   ├── build-slidev.mjs         #     Slidev 构建
│   │   ├── postbuild.mjs           #     构建后处理（生成 Sitemap 等）
│   │   └── rss.mjs                  #     RSS Feed 生成
│   │
│   ├── generate/                     #   代码生成
│   │   ├── generate-api-types.js   #     从 OpenAPI 生成 TS 类型（Orval）
│   │   ├── generate-search.mjs      #     生成搜索索引
│   │   └── generate-stories.mjs     #     生成 Storybook stories
│   │
│   ├── dev/                          #   开发辅助
│   │   ├── run-next-dev.js
│   │   ├── start-mock-server.sh
│   │   └── start-mock-server.bat
│   │
│   └── test/                         #   测试脚本
│       └── test-refine*.ps1 / *.sh
│
├── tests/                            # Vitest 单元测试
│   ├── app/                         #   页面级测试
│   ├── lib/                        #   工具函数测试
│   └── routes/                     #   API 路由测试
│
├── e2e/                              # Playwright E2E 测试
│   ├── admin.spec.ts               #   Admin 后台流程
│   ├── auth.spec.ts                #   认证流程
│   ├── blog.spec.ts                #   博客阅读流程
│   ├── search.spec.ts              #   搜索功能
│   └── api-contract.spec.ts        #   API 契约测试
│
├── types/                           # TypeScript 类型定义（.d.ts）
│   ├── common.ts                    #   通用类型
│   ├── chemistry.ts                 #   化学相关类型
│   └── ...
│
├── public/                          # 静态资源（直接服务，不经过构建）
│   ├── assets/                      #   站点图片资产
│   │   ├── blog/                   #     博客封面
│   │   ├── experiences/
│   │   ├── home/
│   │   ├── social/                 #     社交头像
│   │   ├── stack/                  #     技术栈图标
│   │   ├── tools/
│   │   └── works/
│   │
│   ├── chemistry/                   #   化学相关静态资源
│   │   ├── 3dmol/                  #     3Dmol.js 库
│   │   ├── katex/                  #     KaTeX 字体（WASM 渲染）
│   │   └── rdkit/                  #     RDKit WASM 资源
│   │
│   ├── data/                        #   静态数据文件（JSON）
│   ├── images/                      #   通用图片
│   ├── models/                      #   3D 模型（.SLDASM, .URDF 等）
│   │   └── SO_5DOF_ARM100_05d.SLDASM/
│   │       ├── meshes/
│   │       └── urdf/
│   │
│   ├── musicxml/                    #   MusicXML 乐谱文件
│   ├── robotics/                    #   机器人相关资源
│   ├── static/                      #   Velite 编译输出的静态资产
│   │   ├── favicons/
│   │   └── images/
│   │
│   ├── structures/                  #   化学/物理结构文件
│   └── tags/                        #   标签相关图片
│
├── package.json
├── tsconfig.json
├── next.config.js                   # Next.js 配置
├── tailwind.config.js                # Tailwind 主题（引用 Design Tokens）
├── velite.config.ts                  # Velite 内容编译配置
├── components.json                    # shadcn/ui 组件注册配置
├── postcss.config.js
├── prettier.config.js
├── eslint.config.mjs
├── playwright.config.ts
├── vitest.config.ts
├── instrumentation.ts                # OpenTelemetry 插桩
├── openapi.json                      # 后端 OpenAPI 规范（Orval 生成源）
├── orval.config.js                   # Orval API 类型生成配置
└── ...
```

---

## 样式系统：双层架构

### 第一层：`styles/tokens/` — 设计令牌（Design Tokens）

**角色**：设计系统的"源数据库"，在**构建时**被 Tailwind 引用。

```
styles/tokens/
├── index.css      # 入口，@import colors.css + spacing.css
├── colors.css    # 颜色系统 CSS 变量（--color-primary-500、--color-text-primary）
└── spacing.css   # 间距系统 CSS 变量（--spacing-sm: 8px、--spacing-md: 16px）
```

**特点**：
- 纯 CSS 变量，供 `tailwind.config.js` 通过 `var()` 引用
- 支持系统深色模式（`@media (prefers-color-scheme: dark)`）
- 支持手动主题切换（`[data-theme="dark"]`）
- 8px 基准网格，语义化命名

### 第二层：`src/styles/` — 运行时样式表

**角色**：Next.js 在**运行时**加载的实际 CSS，被打包进最终 CSS bundle。

```
src/styles/
├── tailwind.css        # @tailwind 指令入口
├── admin-theme.css     # Admin 后台主题
├── visitor-theme.css   # 访客前端主题
├── monograph-theme.css # 专著/论文主题
├── geist-tokens.css    # Geist 字体 tokens
└── prism.css           # 代码高亮
```

### 关系图

```
styles/tokens/              (设计令牌源数据)
        ↓
  tailwind.config.js       (通过 var() 引用，扩展 Tailwind 主题颜色/间距)
        ↓
  src/styles/tailwind.css   (Tailwind @tailwind 指令入口)
        ↓
  Next.js CSS bundle        (打入最终 CSS bundle)
```

---

## 内容系统：Velite + MDX

### 源内容（`data/blog/`）

MDX 文件，通过 frontmatter 定义元数据：

```yaml
---
title: "RDKit 化学结构可视化指南"
date: "2026-01-06T10:06:15.014136Z"
tags: ["chemistry", "visualization", "rdkit"]
category: "chemistry"
summary: "使用 RDKit WASM 在浏览器中渲染化学分子结构"
authors: ["default"]
math: true
showTOC: true
---
```

### 编译（Velite）

```bash
# velite.config.ts 配置
pattern: 'blog/**/*.mdx'  →  输出到 .velite/ + public/static/
```

### 渲染（next-mdx-remote）

编译后的内容在 `src/app/blog/[...slug]/` 中通过 `next-mdx-remote` 渲染，支持：
- 数学公式（KaTeX / rehype-katex）
- 代码高亮（Prism / rehype-highlight）
- 化学结构（3Dmol.js / RDKit WASM）
- Excalidraw 白板嵌入

---

## 状态管理

### 客户端状态（Zustand）

| Store | 用途 |
|-------|------|
| `auth-store.ts` | 认证状态（用户信息、isAuthenticated）— **不含 Token**（GOLDEN_RULES 1.1: Token 仅在 HttpOnly Cookie） |
| `blog-store.ts` | 博客状态（当前文章、阅读进度） |
| `comment-store.ts` | 评论状态 |
| `post-store.ts` | 文章状态 |
| `ui-store.ts` | UI 状态（侧边栏、模态框、主题） |

### 服务端状态（TanStack Query）

用于 API 数据获取：文章列表、评论、访客统计等。

### 缓存策略（`src/lib/cache/`）

| 缓存 | 策略 |
|------|------|
| `blog-cache.ts` | ISR + 增量再生 |
| `post-cache.ts` | Stale-While-Revalidate |

---

## 响应式布局：文章详情页断点策略

本文档定义文章详情页在不同视口宽度下的布局行为，适配从手机到超宽屏的全部场景。

### 断点定义（Tailwind 默认）

| 断点 | 视口范围 | 布局策略 | 采用者参考 |
|------|---------|---------|-----------|
| `< sm` | 0–639px | **单列布局** | Medium、Substack |
| `sm – md` | 640–767px | **单列布局**（内容微宽） | — |
| `md – lg` | 768–1023px | **双列布局**（TOC 登场） | IEEE Spectrum、技术文档站 |
| `lg – xl` | 1024–1279px | **三列布局**（全功能） | The Verge（桌面）|
| `≥ xl` | ≥ 1280px | **三列布局（约束）** | Stripe、Vercel |

### 断点详细行为

#### 手机端（< 768px / `md` 以下）— 单列布局

```
┌─────────────────────────┐
│        顶部进度条        │  ← 3px 固定在顶
│        顶部导航          │
├─────────────────────────┤
│                         │
│       Hero 图/标题       │  ← 全宽
│                         │
├─────────────────────────┤
│  日期 · 阅读时间 · 作者   │  ← meta 行
├─────────────────────────┤
│                         │
│      标签（横向滚动）     │  ← 可选
│                         │
├─────────────────────────┤
│                         │
│    文章正文（单列）       │  ← max-width: 100%
│    max-width: 65ch     │     正文字号 16-17px
│                         │
│    ┌─────────────────┐  │
│    │  浮动 TOC 按钮    │  │  ← FAB，点击展开抽屉
│    └─────────────────┘  │
│                         │
├─────────────────────────┤
│  相关文章（卡片列表）     │  ← 底部分享按钮旁
├─────────────────────────┤
│  评论区（懒加载）         │  ← 底部，或折叠
├─────────────────────────┤
│  底部浮动操作栏           │  ← 分享 · 书签 · 评论计数
└─────────────────────────┘
```

**手机端关键设计决策：**

| 元素 | 处理方式 | 实现方式 |
|------|---------|---------|
| **TOC** | 隐藏 → FAB 触发抽屉 | `position: fixed` 浮动按钮 + Drawer 组件 |
| **进度条** | 顶部细条（3px）| `position: fixed; top: 0; left: 0; height: 3px` |
| **分享按钮** | 底部固定栏 | `position: fixed; bottom: 0` 底部操作条 |
| **Related 文章** | 文章底部卡片列表 | 水平滚动卡片 `overflow-x: auto` |
| **Comments** | 文章底部折叠 | 用户滚动到底部或点击触发加载 |
| **代码块** | 全宽 + 横向滚动 | `overflow-x: auto; max-width: 100vw` |
| **数学公式** | 居中对齐，横向滚动 | `overflow-x: auto` 防止溢出 |
| **化学/RDKit 结构** | 全宽渲染 | 静态 SVG，内联显示 |
| **3D 查看器** | 懒加载（IntersectionObserver）| 性能优先，手机端可能降级为静态图 |
| **Hero 图** | 全宽，高度压缩 | `aspect-ratio: 16/9`，点击放大 |
| **正文排版** | `max-width: 65ch; margin: 0 auto` | 居中，单列沉浸阅读 |
| **字号** | 16px（正文）/ 14px（辅助）| `text-base visitor-base` |

**Tailwind 实现要点：**
```tsx
{/* 手机端：单列正文，居中 */}
<div className="mx-auto max-w-[65ch] px-4">
  {/* FAB TOC 按钮 */}
  <button className="fixed bottom-20 right-4 z-50 rounded-full p-3 shadow-lg md:hidden">
    <TOCIcon />
  </button>
  {/* 底部固定操作栏 */}
  <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur md:hidden" />
</div>
```

---

#### 平板端（768px–1023px / `md` 至 `lg`）— 双列布局

```
┌────────────────────────────────────────────────────┐
│                    顶部进度条 + 导航                  │
├───────────┬────────────────────────────────────────┤
│           │                                        │
│  粘性 TOC │        文章正文（max-width: 720px）      │
│  (左侧)   │                                        │
│  220px    │        日期 · 阅读时间                   │
│           │        标题                              │
│  H2 导航  │        标签                             │
│  进度高亮  │                                        │
│           │        正文内容（max-width: 65ch）        │
│           │        （代码块可突破到 max-width: 900px）│
│           │                                        │
├───────────┴────────────────────────────────────────┤
│  相关文章（水平滚动卡片）                             │
├────────────────────────────────────────────────────┤
│  评论区（懒加载）                                    │
└────────────────────────────────────────────────────┘
```

**平板端关键设计决策：**

| 元素 | 处理方式 | 实现方式 |
|------|---------|---------|
| **TOC** | 左侧粘性栏，固定宽度 220px | `position: sticky; top: 5rem; width: 220px` |
| **正文列** | `max-width: 720px`，相对居中 | 可容纳代码块突破（900px） |
| **代码块** | 可突破正文宽度 | `max-width: 900px`（宽于正文） |
| **Related** | 底部水平滚动 | `grid grid-cols-2 gap-4 overflow-x-auto` |
| **Comments** | 底部展开 | 同手机逻辑 |
| **Hero 图** | 全宽，保持比例 | `aspect-ratio: 2/1` |
| **字号** | 17px（正文）/ 15px（辅助）| 适度放大 |

**CSS Grid 布局：**
```css
/* 平板双列：TOC + 正文 */
.article-layout-tablet {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

/* 代码块突破正文宽度 */
.code-block {
  max-width: 900px;  /* 可超出正文 max-width: 720px */
  margin-left: -4rem; /* 视觉上左对齐侧栏 */
}
```

---

#### 桌面端（1024px–1279px / `lg` 至 `xl`）— 三列布局

```
┌──────────────────────────────────────────────────────────────────────┐
│                        顶部进度条 + 导航                                │
├──────────┬─────────────────────────────────────────┬─────────────────┤
│          │                                         │                 │
│ 粘性 TOC │           文章正文                         │   粘性侧栏       │
│  (左侧)  │     max-width: 680px / 65ch              │   280px         │
│  200px   │                                         │                 │
│          │     日期 · 阅读时间 · 作者                 │  ┌───────────┐ │
│ H2 导航  │     标题                                 │  │ Related   │ │
│ 进度高亮  │     标签                                 │  │ Articles  │ │
│          │                                         │  │ (3篇)    │ │
│          │     正文内容（prose）                     │  └───────────┘ │
│          │                                         │                 │
│          │     ┌─────────────────────────────┐    │  ┌───────────┐ │
│          │     │ 代码块（可突破至 900px）      │    │  │ Comments  │ │
│          │     └─────────────────────────────┘    │  │ (FAB 触发)│ │
│          │                                         │  └───────────┘ │
│          │     相关文章（底部门槛下）                  │                 │
│          │     评论区（底部门槛下）                   │                 │
└──────────┴─────────────────────────────────────────┴─────────────────┘
```

**桌面端关键设计决策：**

| 元素 | 处理方式 | 实现方式 |
|------|---------|---------|
| **TOC** | 左侧粘性栏 200px | `position: sticky; top: 5rem; height: calc(100vh - 5rem)` |
| **正文** | `max-width: 680px`（约 65-70 字符）| 最优阅读宽度 |
| **右侧栏** | 280px，包含 Related（38%）+ Comments（62%）| `position: sticky; top: 5rem` |
| **Related** | 右侧栏上部（3篇），不占正文高度 | 实际意义弱，可考虑移除 |
| **Comments** | 右侧栏下部，或底部（移动到底部）| 评论重要性高于 Related |
| **代码块** | 突破正文：`max-width: 900px; margin-left: -5rem` | Stripe / Vercel 风格 |
| **Hero 图** | 全宽比例 | `aspect-ratio: 21/9`（宽银幕）|
| **字号** | 18px（正文）/ 16px（辅助）| visitor-base（18px）|

**三列 Grid：**
```css
/* 桌面三列：TOC(200) + 正文(680) + 侧栏(280) = 1160px */
.article-layout-desktop {
  display: grid;
  grid-template-columns: 200px minmax(0, 680px) 280px;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* 侧栏内部 Flex 分布 */
.sidebar-inner {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Related 占 38%（黄金比例小），Comments 占 62% */
.related-section  { flex: 0 0 38%; }
.comments-section { flex: 1; }
```

---

#### 超宽屏（≥ 1280px / `xl` 及以上）— 三列（约束宽度）

**问题**：超宽屏（1920px、2560px）下正文和 TOC 会被过度拉宽，阅读行宽超过 80 字符反而降低阅读体验。

**策略**：正文最大宽度约束在 `720px`，TOC 和侧栏保持固定宽度，超出空间用外边距吸收。

```
┌──────────────────────────────────────────────────────────────┐
│          ┌──────┬───────────────────────┬────────┐          │
│  (空白)  │ TOC  │      正文（max 720px） │ 侧栏   │  (空白)  │
│          │ 200px│                       │ 280px  │          │
│          └──────┴───────────────────────┴────────┘          │
└──────────────────────────────────────────────────────────────┘
```

**超宽屏关键 CSS：**
```css
/* 内容区最大宽度约束，防止正文过宽 */
.article-content-constrain {
  max-width: min(100%, 1200px);
  margin-left: auto;
  margin-right: auto;
  padding-left: max(1rem, calc((100% - 1200px) / 2));
  padding-right: max(1rem, calc((100% - 1200px) / 2));
}

/* 超宽屏下：正文最大 720px，侧栏保持 280px，TOC 保持 200px */
.article-layout-widescreen {
  display: grid;
  grid-template-columns: 200px minmax(0, 720px) 280px;
  gap: 2rem;
  max-width: 1240px;  /* 约束总宽度 */
  margin: 0 auto;
}
```

---

### 技术内容的响应式处理

#### 代码块（所有断点通用）

```css
/* 手机/平板：全宽滚动 */
.code-block {
  max-width: 100vw;
  overflow-x: auto;
}

/* 桌面+：突破正文宽度 */
@media (min-width: 1024px) {
  .article-prose .code-block {
    max-width: 900px;
    margin-left: calc(-1 * (900px - 680px) / 2 - 1rem);
  }
}
```

#### 数学公式（KaTeX）

```css
/* 手机端：强制居中，防止溢出 */
.math-block {
  overflow-x: auto;
  text-align: center;
  font-size: 0.95em; /* 略小，增加容错 */
}

/* 平板+：正常显示 */
@media (min-width: 768px) {
  .math-block {
    font-size: 1em;
    text-align: center;
  }
}
```

#### 大表格

```css
/* 所有断点：横向滚动 */
.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* 手机端：缩小字号 */
@media (max-width: 639px) {
  table { font-size: 0.875rem; }
  th, td { padding: 0.5rem 0.75rem; }
}
```

#### 化学结构（RDKit / 3Dmol）

```css
/* 手机端：全宽静态渲染 */
.molecule-container {
  width: 100%;
  max-width: 100vw;
}

/* 平板+：居中最大宽度 */
@media (min-width: 768px) {
  .molecule-container {
    max-width: 600px;
    margin: 0 auto;
  }
}

/* 3D 查看器：懒加载，手机端不自动初始化 */
.viewer-3d {
  aspect-ratio: 4/3;
  max-height: 400px;
}

@media (max-width: 767px) {
  .viewer-3d { max-height: 250px; }
  .viewer-3d.auto-init { display: none; }  /* 手机端不自动初始化 3D */
}
```

#### Sidenotes（边注）/ 脚注

```css
/* 桌面端：右侧边注 */
.sidenote {
  float: right;
  width: 35%;
  margin-right: -38%;
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding-left: 1rem;
  border-left: 2px solid var(--border);
}

/* 手机+平板端：转为脚注（无浮动） */
@media (max-width: 1023px) {
  .sidenote {
    float: none;
    width: 100%;
    margin-right: 0;
    margin-top: 1rem;
    padding-left: 1rem;
  }
}
```

#### Callout 框（信息/警告/危险/成功）

```css
.callout {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid var(--callout-color);
  background: var(--callout-bg);
  margin: 1.5rem 0;
}

/* 手机端：减小内边距 */
@media (max-width: 639px) {
  .callout { padding: 0.75rem; gap: 0.5rem; }
}
```

---

### 移动端优先（Mobile-First）实现原则

```tsx
{/* 1. 默认（手机）：单列，手写移动端样式 */}
<div className="mx-auto max-w-[65ch] px-4 py-6">

{/* 2. 平板+（md）：双列 Grid */}
<div className="md:grid md:grid-cols-[220px_1fr] md:gap-8">

{/* 3. 桌面+（lg）：三列 Grid */}
<div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)_280px] lg:gap-6">

{/* 4. 超宽屏（xl）：内容宽度约束 */}
<div className="xl:max-w-[1200px] xl:mx-auto">
```

### 响应式加载策略

| 断点 | 图片策略 | JS 策略 |
|------|---------|---------|
| **< md** | `srcset` 低分辨率，`loading: lazy` | 不加载 3D 查看器；评论懒加载 |
| **md – lg** | 中分辨率 srcset | 按需加载重型组件 |
| **≥ lg** | 高分辨率 srcset，`fetchpriority="high"`（Hero）| 全部按需加载（已有 lazy import）|

---

### 各断点字号参考

| 断点 | H1 | H2 | H3 | 正文 | 辅助文字 |
|------|----|----|----|------|---------|
| **< md** | 32px | 26px | 20px | 16px | 14px |
| **md – lg** | 40px | 30px | 24px | 17px | 15px |
| **lg – xl** | 48px | 36px | 28px | 18px | 16px |
| **≥ xl** | 48px（约束）| 36px | 28px | 18px | 16px |

---

### 布局模式快速对比

| 布局 | 视口 | TOC | Related | Comments | 适用场景 |
|------|------|-----|---------|---------|---------|
| **单列** | < 768px | 浮动抽屉 FAB | 底部水平滚动 | 底部折叠 | 手机、平板竖屏 |
| **双列** | 768–1023px | 左侧粘性 220px | 底部水平滚动 | 底部折叠 | 平板横屏、小笔记本 |
| **三列** | 1024–1279px | 左侧粘性 200px | 右侧栏上部 | 右侧栏下部 | 桌面主流 |
| **三列（约束）**| ≥ 1280px | 左侧粘性 200px | 右侧栏上部 | 右侧栏下部 | 超宽屏（1920px+）|

---

## 响应式策略进阶：超越像素断点

### 设计哲学：高信息密度填充

**核心定位**：本博客是技术参考 + 文档，内容密度优先。不同于 Stripe/Vercel 的极简留白路线，本博客在任何分辨率下都应充分利用空间，追求**高信息密度 + 高效率**。

```
设计哲学对比：
  Stripe/Vercel：留白优先，舒适阅读，内容密度 ~18%
  本博客：填满空间，高密度技术参考，内容密度 40-60%
```

**目标**：超宽屏（21:9、4K）用户应看到**更多列或更宽正文**，而非大量留白。

---

### 核心理念：三层策略互补

```
视口像素（粗粒度骨架）  → 定义"有没有空间用多列"
ch / cqi（内容驱动）    → 驱动"正文有多舒适可读"
Container Queries       → 组件内部自适应
dvh                      → 移动端粘性高度精确
```

**不依赖的技术**：Aspect Ratio 媒体查询（调研证明无实际必要，max-width 约束更简单）。

---

### 策略一：`ch` 驱动正文最优阅读宽度

`ch` = 当前字体下"0"字符的宽度。18px Inter：1ch ≈ 9-10px。

```
最优正文：max-width: 65ch（~65-70 字符/行）
→ 小屏幕自动收缩到 100%（永不超过容器）
→ 大屏幕最多 65ch（永不超过最优可读宽度）
```

**CSS 实现：**

```css
.article-body {
  max-width: min(65ch, 100%);
  margin-left: auto;
  margin-right: auto;
}
```

**各视口 ch 表现：**

| 视口宽度 | 正文实际宽度 | 约等字符 | 说明 |
|---------|------------|---------|------|
| 375px | ~343px | ~55ch | 受容器约束，仍可读 |
| 768px | ~640px | ~71ch | 最优区间 |
| 1024px | ~680px | ~75ch | 上限，可接受 |
| 1280px | ~720px | ~80ch | 超过 65ch，上限约束 |
| 2560px（21:9）| ~720px | ~80ch | 硬性约束到 720px |
| 3840px（4K）| ~720px | ~80ch | 硬性约束到 720px |

---

### 策略二：填满空间的 Grid 策略

**布局演变逻辑（基于视口像素）：**

```
< 768px   → 单列（手机竖/横）
768-1023px → 平板双列（768基础宽度用满）
1024-1279px → 桌面三列（基础三列）
≥ 1280px  → 扩展三列（正文 + 侧栏同时扩展）

超宽屏（21:9/4K/5K）策略：
  → 不是约束总宽度，而是扩展三列
  → 正文列：max 900px（允许代码块突破）
  → 左 TOC 列：固定 220px
  → 右 Related 列：固定 320px
  → 剩余空间 → 正文列继续扩展到 900px
```

**Grid 实现（充分利用空间）：**

```css
/* Base：单列 */
.article-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  padding: 0 1rem;
}

/* 平板+：双列（充分利用平板横屏宽度）*/
@media (min-width: 768px) {
  .article-layout {
    grid-template-columns: 220px 1fr;
    padding: 0 1.5rem;
  }
}

/* 桌面+：三列（充分利用空间）*/
@media (min-width: 1024px) {
  .article-layout {
    grid-template-columns: 220px minmax(0, 1fr) 320px;
    padding: 0 2rem;
  }
}

/* 超宽屏（21:9 / 4K / 5K）：正文列扩展到 900px */
@media (min-width: 1440px) {
  .article-layout {
    grid-template-columns: 220px minmax(0, max(900px, 30%)) 320px;
  }
}

/* 极宽屏（≥ 1920px）：所有列同时扩展 */
@media (min-width: 1920px) {
  .article-layout {
    grid-template-columns: 260px minmax(0, max(900px, 35%)) 360px;
  }
}
```

**Grid 列分配原则：**

```
超宽屏 2560×1080 (21:9)：
  可用宽度：2560px - padding(64px) = 2496px
  → TOC: 220px (8.8%)
  → 正文: 900px (36.1%)  ← 代码块可突破
  → Related: 320px (12.8%)
  → 实际填充率: 57.7%

超宽屏 3840×2160 (4K)：
  可用宽度：3840px - padding(64px) = 3776px
  → TOC: 220px (5.8%)
  → 正文: 900px (23.8%)
  → Related: 320px (8.5%)
  → 实际填充率: 38.1%（仍有大量扩展空间，可考虑扩大 Related）
```

**极宽屏扩展策略（可选）：**

```css
/* 5K 或超宽屏（≥ 2560px 视口，且宽度 > 3000px）：Related 列扩展 */
@media (min-width: 2560px) {
  .article-layout {
    /* 当可用宽度 > 2000px 时，扩展 Related 列 */
    grid-template-columns: 220px minmax(0, max(900px, 35%)) minmax(320px, 25%);
  }
}
```

---

### 策略三：`clamp()` 流式字号（替代多个像素断点）

`clamp(min, preferred, max)` 在任意视口宽度下产生**连续、平滑**的过渡，无需多个媒体查询。

```css
/* 正文章节标题：平滑从 28px 过渡到 40px */
h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); }

/* 正文字号：16px-18px 连续过渡 */
.article-body p,
.article-body li {
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: clamp(1.6, 3vw, 1.75);
}

/* 代码块字号：14px-16px */
pre, code {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
}

/* H2 标题：24px-32px */
h2 { font-size: clamp(1.5rem, 3vw, 2rem); }

/* H3 标题：20px-26px */
h3 { font-size: clamp(1.25rem, 2.5vw, 1.625rem); }
```

**对比：clamp() vs 像素断点**

```
像素断点方案（需要 4 个媒体查询）：
  < 640px: font-size: 16px
  640-768px: font-size: 17px
  768-1024px: font-size: 18px
  ≥ 1024px: font-size: 18px

clamp() 方案（1 行）：
  font-size: clamp(1rem, 2vw, 1.125rem)
  → 在所有视口下都产生平滑过渡
```

---

### 策略四：Container Queries（组件级内容自适应）

Container Queries 让组件响应**其父容器宽度**，而非视口宽度。同一个组件在不同父容器中自动适配。

**浏览器支持（2025）：Chrome 105+、Safari 16+、Firefox 110+、Edge 105+，覆盖率 ~95%。**

```css
/* 定义容器 */
.article-content {
  container-type: inline-size;
  container-name: article-content;
}

/* 容器查询：正文列宽度决定内部组件行为 */

/* 正文列宽度 < 45ch → 隐藏边注 */
@container article-content (max-width: 45ch) {
  .sidenote { display: none; }
}

/* 正文列宽度 >= 600px → 代码块可突破 720px */
@container article-content (min-width: 600px) {
  .code-block {
    max-width: 900px;
  }
}

/* 正文列宽度 < 40ch → 大表格横向滚动（不压缩）*/
@container article-content (max-width: 40ch) {
  .data-table-wrapper {
    overflow-x: auto;
  }
}
```

**在 Next.js/Tailwind 中使用：**

```tsx
// PostLayout.tsx
<div className="[container-type:inline-size] [container-name:article-content]">
  {/* 正文内容 */}
</div>
```

---

### 策略五：`dvh` 修复移动端粘性高度

**`vh` 的历史问题**：移动浏览器有"动态工具栏"（地址栏展开/收起），`100vh` 实际可用高度波动 60-120px。

**`dvh`（Dynamic Viewport Height）**：实时响应浏览器 chrome 变化。

```css
/* TOC 侧栏粘性高度：用 dvh */
.toc-sidebar {
  position: sticky;
  top: 5rem;
  height: calc(100dvh - 5rem);  /* 随浏览器 chrome 动态调整 */
  overflow-y: auto;
}

/* Related 侧栏粘性高度 */
.related-sidebar {
  position: sticky;
  top: 5rem;
  height: calc(100dvh - 5rem);
  overflow-y: auto;
}

/* 进度条永远贴顶 */
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100dvh;  /* 实时响应动态视口 */
}
```

**浏览器支持**：Safari 16+（2023 年），覆盖率 ~92%，生产可用。

---

### 完整布局实现（Tailwind + CSS 变量）

**Design Tokens（visitor-theme.css）：**

```css
:root {
  /* 阅读 */
  --reading-max-width: 65ch;
  --code-max-width: 900px;

  /* 侧栏 */
  --sidebar-toc-width: 220px;
  --sidebar-related-width: 320px;
  --sidebar-max-height: calc(100dvh - 5rem);

  /* 间距 */
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;

  /* 字号 */
  --font-body: clamp(1rem, 2vw, 1.125rem);
  --font-h1: clamp(1.75rem, 4vw, 2.5rem);
  --font-h2: clamp(1.5rem, 3vw, 2rem);
  --font-h3: clamp(1.25rem, 2.5vw, 1.625rem);
  --font-code: clamp(0.875rem, 1.5vw, 1rem);
}
```

**PostLayout.tsx Grid 结构（最终版）：**

```tsx
<div className="
  /* Base：单列 */
  grid grid-cols-1 gap-6 p-4

  /* 平板+：双列（充分利用）*/
  md:grid-cols-[220px_1fr] md:gap-8 md:p-6

  /* 桌面+：三列（充分利用空间）*/
  lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:gap-8 lg:p-8

  /* 超宽屏+：正文列扩展到 900px */
  xl:grid-cols-[220px_minmax(0,max(900px,30%))_320px]

  /* 极宽屏：所有列同步扩展 */
  2xl:grid-cols-[260px_minmax(0,max(900px,35%))_360px]
">
```

**正文列的 clamp 字号：**

```tsx
<article className="
  prose
  prose-zinc
  prose-base
  max-w-none
  /* clamp 字号由 Tailwind typography 插件提供，或手动：*/
  text-[clamp(1rem,2vw,1.125rem)]
  leading-[clamp(1.6,3vw,1.75)]
">
```

---

### 布局决策总结表

| 维度 | 策略 |
|------|------|
| 骨架结构 | 像素断点（md/lg/xl/2xl）|
| 正文宽度 | `min(65ch, 100%)` — 永远不超过最优 |
| 超宽屏填充 | Grid `minmax` + 绝对 max — 不约束宽度，而是扩展内容 |
| 字号 | `clamp()` — 连续平滑，无断点跳跃 |
| 侧栏粘性 | `calc(100dvh - 5rem)` — 精确填满移动端视口 |
| 组件自适应 | Container Queries — 正文列宽度驱动内部行为 |
| 侧栏 TOC | 固定 220px（桌面+），粘性 sticky |
| 侧栏 Related | 固定 320px（桌面+），粘性 sticky |
| 代码块 | `max-width: 900px`（允许突破正文到 720px）|
| 不使用 | aspect-ratio 媒体查询、cqi 单位 |

---

### 超宽屏行为示例

```
21:9 超宽屏（2560×1080）：
  → 三列，充分利用 2496px 可用宽度
  → TOC: 220px | 正文: 900px | Related: 320px
  → 正文仍有 ~1056px 剩余空间（填不满）

4K 屏幕（3840×2160）：
  → 三列，充分利用 3776px 可用宽度
  → TOC: 220px | 正文: 900px | Related: 320px
  → 仍有 ~2336px 剩余空间
  → xl 断点已触发（minmax 生效）：正文列扩展到 max(900px, 30%)
  → 30% × 3776px ≈ 1132px → 正文实际 1132px（扩展生效）

→ 如果 30% 仍填不满，考虑：
  → 方案 A：Related 列从 320px 扩展到 400px
  → 方案 B：正文列从 30% 改为 40%（需代码块 max 900px 配合）
  → 方案 C：接受 60% 利用率（已比 Stripe 18% 高很多）
```

---

## 国际化（i18n）

**路径**：`src/locales/{en,zh-CN}/`

**框架**：next-intl

**翻译范围**：UI 标签、错误消息、日期格式、SEO meta

---

## API 架构（BFF 模式）

### 路由（`src/app/api/`）

```
api/
├── newsletter/      POST  Newsletter 订阅
├── visitor/         POST  记录单次访问
├── visitors/        GET   访客统计
└── v1/[...path]     *     透明代理到后端 /api/v1/*
```

### API 类型生成

```bash
# Orval 根据 openapi.json 自动生成
openapi.json  →  src/lib/api/generated/schemas/

pnpm generate:types  # 触发 Orval
```

---

## 性能优化策略

### 路由层
- **Route Groups**：`src/app/(public)/` 分组公开/私密路由，中间件鉴权
- **Parallel Routes**：管理员面板多标签页并行

### 渲染层
- **ISR**（Incremental Static Regeneration）：文章页 `revalidate = 3600`
- **SSR**：Admin 页、个性化内容
- **SSG**：静态页（首页、关于页）

### Bundle 优化
```bash
ANALYZE=true pnpm build  # Bundle 分析
# 查看 .next/analyze/client.html
```

### 代码分割
- **Dynamic Imports**：`next/dynamic` 懒加载 Heavy 组件（Three.js、ECharts、3Dmol）
- **HeroSection**：`@react-three/fiber` 独立 chunk（⚠️ 需注意未代码分割问题）
- **图表库**：ECharts / Nivo 按需引入，避免全量导入

### 图片优化
- `next/image`：自动 WebP、响应式 srcset、lazy-load
- 自定义 `ImageOptimizer`：CDN 策略、质量控制
- `public/images/`：静态图片资源

### 预加载
- `prefetch-manager.ts`：智能预取下一篇文章
- `resource-preloader.ts`：关键资源预加载

### 渲染性能
- **虚拟列表**：`VirtualList.tsx`（长列表场景）
- **骨架屏**：每个内容区块对应 Skeleton 组件
- **Web Vitals 监控**：`performance-monitor.tsx`

---

## 安全策略

| 防护项 | 实现位置 |
|--------|----------|
| XSS 防护 | `src/lib/security/`（DOMPurify 净化） |
| CSRF 防护 | Next.js 内置 + SameSite Cookie |
| 内容安全策略 | `next.config.js` 配置 CSP 头 |
| 依赖扫描 | `pnpm audit` |
| API 鉴权 | 后端 JWT + HttpOnly Cookie + XSRF-TOKEN |

---

## 可扩展性设计（支撑全球上百亿访问）

### 边缘化部署
- **目标**：Vercel Edge / Cloudflare Workers / 阿里云 Edge
- **要求**：所有 API 路由为 Edge Runtime（`export const runtime = 'edge'`）
- **状态**：目前部分路由使用 Node.js Runtime，需逐步迁移

### 数据库与缓存
```
用户请求 → CDN (静态资源) / Edge (SSR) → 
  → ISR Cache Hit → 直接返回
  → Cache Miss → API Gateway → Rust 后端 → PostgreSQL + Redis
                              → Payload CMS (媒体)
```

### 多语言（i18n）
- 路由级 i18n：URL 如 `/en/blog/...`、`/zh-CN/blog/...`
- 目前仅：中文（简体）、英文
- 潜在扩展：中文繁体、日语、韩语、阿拉伯语（RTL）

### 媒体处理
- 图片：Vercel/Cloudflare Image CDN + WebP/AVIF 自动转换
- 视频：视频 CDN（HLS/DASH 流媒体）
- 3D 模型：Draco 压缩 + GLTF 格式
- 大文件：对象存储（OSS/S3）+ CDN 分发

### 高可用架构要点
- **无状态渲染**：每个 SSR 请求不依赖本地状态
- **外部状态**：用户 Session → Redis；阅读进度 → PostgreSQL
- **读写分离**：博客读取 → Redis 缓存；写作管理 → PostgreSQL 主库
- **CDN 缓存**：静态资源永久缓存；API 响应 `Cache-Control: s-maxage`

---

## 开发规范

### 新增文章
```bash
# 方式一：手动创建
vim data/blog/robotics/pi0_7.mdx

# 方式二：使用脚本
node scripts/create-blog-file.ts
```

### 新增页面
1. 在 `src/app/` 下创建路由目录
2. 添加 `page.tsx`
3. 导出 metadata（SEO）
4. 注册导航链接

### 新增组件
1. 放入 `src/components/{功能组}/`
2. 添加 TypeScript 类型
3. 如需样式：用 Tailwind 类名 或 `src/styles/` 中的 CSS 变量
4. 编写对应 Vitest 测试

### API 变更
1. 修改 Rust 后端 `openapi.json`
2. 运行 `pnpm generate:types`（Orval 重新生成 TS 类型）
3. 更新 `src/lib/api/mutator.ts`

---

## 环境变量

```bash
# .env.local（不提交）
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_GA_ID=GA-XXXXXXXXX
```

---

## 常见问题

### 构建错误
```bash
rm -rf .next && pnpm install && pnpm build
```

### Tailwind 不生效
检查 `tailwind.config.js` 是否正确引用 `styles/tokens/` 中的 CSS 变量

### MSW Mock 不生效
确认 Service Worker 注册：`src/mocks/` 中的 handlers 需要在 app 初始化时激活

### 类型错误
```bash
pnpm tsc --noEmit
# 精确定位
npx tsc --noEmit src/app/blog/page.tsx
```

---

## 相关文档

- `../docs/` — 用户面向文档
- `package.json` — 完整依赖列表
- `next.config.js` — Next.js 配置
- `tailwind.config.js` — Tailwind 主题扩展
- `velite.config.ts` — 内容编译配置
- `openapi.json` — 后端 API 契约
- 子目录 CLAUDE.md：
  - `src/components/*/CLAUDE.md`
  - `src/lib/*/CLAUDE.md`
  - `scripts/CLAUDE.md`
  - `tests/CLAUDE.md`
  - `e2e/CLAUDE.md`
  - `types/CLAUDE.md`
