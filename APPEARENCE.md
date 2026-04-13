# APPEARENCE（页面外观模块清单）

> 目标：把前端“外观相关文件”按设计分工模块化，便于设计师分别接手（页眉/页脚/布局/卡片/主题样式等）。

## 1) 全局外观入口（必须先看）

- `frontend/src/app/layout.tsx`
  - 全局 CSS 导入入口（Tailwind、KaTeX、主题等）
  - 全局字体、`<body>` 基线外观（背景色、文字色、选择色）
  - 全站 Provider 包装层（Theme/Auth/Query 等）

- `frontend/src/app/(public)/layout.tsx`
  - 公共页面外壳（Header + Main + Footer）
  - 公共站点的背景与明暗主题切换外观

---

## 2) 页眉 Header 模块

### 核心文件
- `frontend/src/components/Header.tsx`
  - 统一入口（重导出到优化版 Header）

- `frontend/src/components/header/HeaderOptimized.tsx`
  - 当前主用页眉实现（桌面导航、移动菜单、滚动显隐、主题按钮、Auth 入口）

### 子模块文件
- `frontend/src/components/header/HeaderNavigation.tsx`
  - 导航链接结构与移动端折叠逻辑
- `frontend/src/components/header/HeaderActions.tsx`
  - 搜索/主题/语言/Auth 等动作区
- `frontend/src/components/header/MobileMenuButton.tsx`
  - 移动端菜单按钮
- `frontend/src/components/header/DarkModeToggle.tsx`
  - 深浅色切换按钮（可独立设计）

### 样式文件
- `frontend/src/components/Header.module.css`

---

## 3) 页脚 Footer 模块

### 核心文件
- `frontend/src/components/Footer.tsx`
  - 页脚整体布局（作者区、站点导航、社交图标、备案链接）

### 相关扩展
- `frontend/src/components/geist/GeistFooter.tsx`
  - Geist 风格页脚（若使用 Geist 主题布局）
- `frontend/src/components/home/MegaFooter.tsx`
  - 首页型扩展页脚模块

### 样式文件
- `frontend/src/components/Footer.module.css`

---

## 4) 页面布局 Layout 模块（给设计师做“版式设计”）

### 站点级布局
- `frontend/src/app/layout.tsx`（全站根布局）
- `frontend/src/app/(public)/layout.tsx`（公共页面布局）
- `frontend/src/components/LayoutWrapper.tsx`（通用 Header/Main/Footer 包装）
- `frontend/src/components/SectionContainer.tsx`（页面内容横向边距规则）

### 业务布局
- `frontend/src/components/admin/AdminLayout.tsx`（后台布局：侧栏 + 顶栏 + 内容区）
- `frontend/src/app/admin/layout.tsx`（后台布局入口）
- `frontend/src/components/geist/GeistLayout.tsx`（Geist 风格整体布局）
- `frontend/src/components/layouts/MagazineLayout.tsx`（杂志流布局）
- `frontend/src/components/layouts/PostLayout.tsx`（文章页布局：TOC/正文/侧栏）
- `frontend/src/components/layouts/PostLayoutMonograph.tsx`（长文风格布局）
- `frontend/src/components/layouts/ListLayout.tsx`（列表页布局）
- `frontend/src/components/layouts/ListLayoutWithTags.tsx`（带标签筛选列表布局）
- `frontend/src/components/layouts/AuthorLayout.tsx`
- `frontend/src/components/layouts/BookShelfLayout.tsx`
- `frontend/src/components/layouts/BookDetailLayout.tsx`

---

## 5) 页面区块 Sections 模块（首页/列表页拼装块）

- `frontend/src/components/magazine/HeroSection.tsx`（杂志风 Hero）
- `frontend/src/components/sections/PageHeader.tsx`（通用页标题区）
- `frontend/src/components/sections/SectionHeader.tsx`（区块标题）
- `frontend/src/components/sections/BlogSection.tsx`（博客区块）
- `frontend/src/components/sections/WorksSection.tsx`（作品区块）
- `frontend/src/components/sections/FeaturedWork.tsx`（重点作品区）
- `frontend/src/components/sections/ActionBar.tsx`（底部操作条）

---

## 6) 卡片 Cards 模块（给设计师做“组件视觉规范”）

### 内容卡片
- `frontend/src/components/sections/BlogCard.tsx`
- `frontend/src/components/sections/WorkCard.tsx`
- `frontend/src/components/magazine/ArticleCard.tsx`
- `frontend/src/components/magazine/BookCard.tsx`
- `frontend/src/components/magazine/ChapterCard.tsx`
- `frontend/src/components/magazine/SmartCard.tsx`

### 首页卡片
- `frontend/src/components/home/BentoCard.tsx`
- `frontend/src/components/home/HeroCard.tsx`
- `frontend/src/components/home/SocialCard.tsx`
- `frontend/src/components/home/ToolsCard.tsx`

### 管理端卡片
- `frontend/src/components/admin/AdminStatsCard.tsx`

---

## 7) 主题与视觉 Token（品牌色/排版/主题皮肤）

- `frontend/src/styles/tailwind.css`（全局基础样式）
- `frontend/src/styles/geist-tokens.css`（Geist 设计变量）
- `frontend/src/styles/visitor-theme.css`（访客主题）
- `frontend/src/styles/monograph-theme.css`（长文主题）
- `frontend/src/styles/admin-theme.css`（后台主题）
- `frontend/src/styles/admin-compact.css`（后台紧凑模式）
- `frontend/src/styles/prism.css`（代码高亮风格）

---

## 8) 设计师分工建议（可直接按组并行）

- **A组（导航）**：Header 模块（第2节）
- **B组（页脚）**：Footer 模块（第3节）
- **C组（版式）**：Layout 模块（第4节）
- **D组（内容组件）**：Sections + Cards（第5/6节）
- **E组（设计系统）**：主题与 Token（第7节）

---

## 9) 改动优先级建议（实现顺序）

1. 先定 **Token/主题变量**（第7节）
2. 再改 **全局布局壳**（第1/4节）
3. 再改 **Header/Footer**（第2/3节）
4. 最后批量替换 **Section/Card 视觉**（第5/6节）

这样可以避免重复返工。

---

## 10) 设计输入/输出规范（直接给设计与前端对齐）

> 说明：每个模块都按「设计输入（Designer Input）/ 设计输出（Designer Output）」交付，避免只给静态图无法落地。

### 10.1 Header（页眉）

**对应文件**：
- `frontend/src/components/header/HeaderOptimized.tsx`
- `frontend/src/components/header/HeaderNavigation.tsx`
- `frontend/src/components/header/HeaderActions.tsx`
- `frontend/src/components/Header.module.css`

**设计输入（Designer Input）**
- 品牌信息：Logo/站点名、是否仅文字 Logo。
- 导航信息架构：一级菜单、是否有当前态、是否允许滚动隐藏。
- 动作按钮策略：搜索/主题/登录是否都保留，优先级排序。
- 响应式要求：桌面、平板、手机断点下的折叠方式。
- 主题规范：浅色/深色两套色值（背景、边框、文字、hover）。

**设计输出（Designer Output）**
- 页面稿：Desktop / Tablet / Mobile 三套 Header（含滚动前后状态）。
- 组件稿：Nav Item、Icon Button、Mobile Menu（默认/悬停/激活/禁用）。
- 标注稿：高度、左右内边距、按钮尺寸、间距、圆角、阴影、z-index。
- Token 映射：颜色/字号/字重/动效时长映射到变量名。
- 交互说明：移动端菜单开合、点击遮罩关闭、滚动显隐规则。

---

### 10.2 Footer（页脚）

**对应文件**：
- `frontend/src/components/Footer.tsx`
- `frontend/src/components/Footer.module.css`

**设计输入**
- 信息架构：版权、备案、社媒、站点链接分组优先级。
- 社媒策略：图标风格（线性/面性）、尺寸与间距。
- 内容密度：紧凑型或舒展型（当前偏舒展）。

**设计输出**
- 页面稿：浅色/深色 Footer 完整版式。
- 组件稿：社媒按钮（默认/悬停/聚焦）、文本链接态。
- 标注稿：分栏规则、换行行为、移动端堆叠顺序。
- 资源包：社媒 SVG 图标规范（统一网格与描边粗细）。

---

### 10.3 Layout（页面布局）

**对应文件**：
- `frontend/src/app/layout.tsx`
- `frontend/src/app/(public)/layout.tsx`
- `frontend/src/components/SectionContainer.tsx`
- `frontend/src/components/layouts/*.tsx`
- `frontend/src/components/admin/AdminLayout.tsx`

**设计输入**
- 栅格体系：内容最大宽度、断点、列数、gutter。
- 页面类型：公共页、文章页、后台页是否共用栅格。
- 外层壳规则：Header 固定策略、Main 最小高度、Footer 贴底策略。

**设计输出**
- 版式规范：全站 Grid Spec（如 4/8/12 栅格）与断点表。
- 模板稿：公共页模板、文章页模板、后台模板。
- 标注稿：容器宽度、边距、Section 间距尺度。
- 实施说明：哪些布局可复用，哪些是单页特化。

---

### 10.4 Sections（页面区块）

**对应文件**：
- `frontend/src/components/magazine/HeroSection.tsx`
- `frontend/src/components/sections/PageHeader.tsx`
- `frontend/src/components/sections/SectionHeader.tsx`
- `frontend/src/components/sections/ActionBar.tsx`

**设计输入**
- 区块层级：H1/H2/H3 的视觉层级关系。
- 区块节奏：首屏、正文区、推荐区之间的留白比例。
- 动效偏好：入场动画强度、是否允许位移动画。

**设计输出**
- 区块模板：Hero/PageHeader/SectionHeader/ActionBar 四类模板。
- 状态定义：空内容、长标题、超长描述时的降级样式。
- 动效说明：持续时间、缓动曲线、是否支持 reduced-motion。

---

### 10.5 Cards（卡片组件）

**对应文件**：
- `frontend/src/components/sections/BlogCard.tsx`
- `frontend/src/components/sections/WorkCard.tsx`
- `frontend/src/components/magazine/ArticleCard.tsx`
- `frontend/src/components/magazine/BookCard.tsx`
- `frontend/src/components/magazine/ChapterCard.tsx`
- `frontend/src/components/home/BentoCard.tsx`

**设计输入**
- 卡片家族定义：信息卡、媒体卡、统计卡是否统一视觉语言。
- 比例规则：封面图比例（如 3:2 / 16:9 / 3:4）和裁切策略。
- 信息优先级：标题、摘要、标签、时间、CTA 的可见级别。

**设计输出**
- 卡片规范页：每类卡片的 Anatomy（结构拆解）。
- 状态页：默认/悬停/按下/焦点/禁用/骨架屏。
- 响应式页：同一卡片在 3 个断点下的重排规则。
- 截断规则：标题最多几行、摘要最多几行、溢出处理方式。

---

### 10.6 Theme & Token（主题与设计系统）

**对应文件**：
- `frontend/src/styles/tailwind.css`
- `frontend/src/styles/geist-tokens.css`
- `frontend/src/styles/visitor-theme.css`
- `frontend/src/styles/admin-theme.css`
- `frontend/src/styles/monograph-theme.css`

**设计输入**
- 品牌基础：主色/中性色/语义色（成功警告错误）。
- 字体策略：中文/英文/代码字体栈，字号阶梯。
- 圆角、阴影、描边、动效全局语言。

**设计输出**
- Token 表：Color / Typography / Spacing / Radius / Shadow / Motion。
- 主题矩阵：Light / Dark / Admin / Visitor / Monograph 的差异表。
- 命名规范：Token 命名与使用约束（避免硬编码色值）。
- 对照表：设计变量 → CSS 变量 / Tailwind token 映射。

---

### 10.7 统一交付格式（建议直接照此提交）

每个模块交付 5 个文件夹（Figma 或等价工具）：

1. `01-Page`：页面级方案
2. `02-Components`：可复用组件
3. `03-States`：状态矩阵（hover/focus/active/disabled/loading/empty/error）
4. `04-Spec`：标注与响应式规则
5. `05-Tokens`：变量与样式映射

---

### 10.8 验收清单（设计完成即勾选）

- [ ] Desktop/Tablet/Mobile 三端稿齐全
- [ ] Light/Dark 两套主题齐全
- [ ] 所有交互态（hover/focus/active/disabled）齐全
- [ ] 关键空态/异常态（无数据、超长文本）齐全
- [ ] Token 命名与代码变量映射齐全
- [ ] 可直接交给前端实现（无需二次口头解释）

---

## 11) 设计师分包任务单（A-E 组）

### A组（导航 Header）

| 任务 | 目标 | 设计输入 | 设计输出 | 验收标准（量化） |
|---|---|---|---|---|
| A1 信息架构 | 统一桌面/移动导航层级 | `frontend/src/components/header/HeaderOptimized.tsx` `frontend/src/components/header/HeaderNavigation.tsx` | IA图 + 断点规则（<768 / ≥768） | 导航项映射100%；断点切换无跳变 |
| A2 视觉规范 | 建立极简优雅视觉基线 | `frontend/src/components/Header.module.css` | 色板/字阶/间距/阴影 token 标注 | 对比度≥4.5:1；间距采用8pt体系 |
| A3 交互状态 | 统一按钮与下拉状态 | `frontend/src/components/header/HeaderActions.tsx` `frontend/src/components/ThemeSwitch.tsx` `frontend/src/components/LanguageSwitch.tsx` | 状态矩阵（default/hover/focus/active/open/disabled） | 关键控件状态覆盖100%；动效120–240ms |
| A4 移动菜单 | 提升移动可触达 | `frontend/src/components/header/MobileMenuButton.tsx` | 移动菜单组件规范 + 点击区定义 | 点击区≥40px；首屏主项可见100% |

### B组（Footer）

| 任务 | 目标 | 设计输入 | 设计输出 | 验收标准（量化） |
|---|---|---|---|---|
| B1 标准页脚规范 | 统一非首页 Footer（浅/深） | `frontend/src/components/Footer.tsx` `frontend/src/components/Footer.module.css` | Desktop/Mobile + Light/Dark 页脚稿 | 4画板齐全；映射 token 100% |
| B2 交互与可访问性 | 完整链接与社媒状态 | `frontend/src/components/Footer.tsx` | 状态矩阵 + 键盘焦点稿 | 对比度≥4.5:1；Tab 路径闭环 |
| B3 首页与内页策略 | 明确 MegaFooter 与 Footer 关系 | `frontend/src/components/home/MegaFooter.tsx` `frontend/src/app/(public)/layout.tsx` | 关系图 + 复用清单 | 差异点清单≥8项；token复用≥70% |

> 备注：`frontend/src/components/geist/GeistFooter.tsx` 当前不存在（后续如新增需单独验收）。

### C组（Layout 版式）

| 任务 | 目标 | 设计输入 | 设计输出 | 验收标准（量化） |
|---|---|---|---|---|
| C1 全局骨架 | 统一站点壳层与页宽策略 | `frontend/src/app/layout.tsx` `frontend/src/app/(public)/layout.tsx` `frontend/src/components/SectionContainer.tsx` | Layout Spec v1（壳层/容器/间距） | 覆盖3断点；6页面截图对齐；误差≤4px |
| C2 内容布局族 | 统一文章/列表/杂志布局节奏 | `frontend/src/components/layouts/*.tsx` | 布局组件集 + 标注稿 | 同类模块节奏一致率≥90% |
| C3 Admin框架 | 后台侧栏/顶栏/内容区一致 | `frontend/src/components/admin/AdminLayout.tsx` `frontend/src/app/admin/layout.tsx` | Admin 布局规范 | 移动开合可用100%；最小字号≥12px |

### D组（Sections + Cards）

| 任务 | 目标 | 设计输入 | 设计输出 | 验收标准（量化） |
|---|---|---|---|---|
| D1 卡片视觉统一 | 统一圆角/阴影/边框/动效 | `frontend/src/components/sections/*` `frontend/src/components/magazine/*` `frontend/src/components/home/*Card.tsx` | Card 组件库（L/S + 主题 + 状态） | 状态覆盖100%；四断点画板齐全 |
| D2 区块层级与节奏 | 统一标题层级与留白节奏 | `frontend/src/components/sections/SectionHeader.tsx` `FeaturedWork.tsx` `BlogSection.tsx` `WorksSection.tsx` | Section 版式规范 | 标题层级≤2档；8pt倍数执行100% |
| D3 管理端指标卡对齐 | AdminStatsCard 并入统一语言 | `frontend/src/components/admin/AdminStatsCard.tsx` | Admin Card 视觉稿 | 5语义色完整；对比度≥4.5:1 |

### E组（Theme & Token）

| 任务 | 目标 | 设计输入 | 设计输出 | 验收标准（量化） |
|---|---|---|---|---|
| E1 Token基线统一 | 统一 Visitor/Admin/Monograph 语义层 | `frontend/src/styles/tailwind.css` `visitor-theme.css` `monograph-theme.css` `admin-theme.css` `admin-compact.css` | Token 映射清单（含冲突/弃用） | 归类≥80 token；命名冲突=0 |
| E2 分层与消费规范 | 建立 global/alias/component 三层 | 同上 + `frontend/src/styles/prism.css` | 分层规则 + 消费示例 | 规则≥12条；暗黑覆盖100% |
| E3 代码高亮对齐 | Prism 与主题 token 对齐 | `frontend/src/styles/tailwind.css` `frontend/src/styles/prism.css` | 语法高亮 token 映射 | 语法类别≥10；硬编码色值下降≥70% |

> 备注：`frontend/src/styles/geist-tokens.css` 当前不存在（建议后续作为 token 承载文件规划）。

---

## 12) 前端落地对照表（逐文件）

### A组（导航 Header）

| 文件路径 | 改动点 | Token | DoD |
|---|---|---|---|
| `frontend/src/components/header/HeaderOptimized.tsx` | 容器高度、滚动显隐、断点结构 | `--header-height*` `--header-bg` | 断点稳定，无 hydration 报错 |
| `frontend/src/components/header/HeaderNavigation.tsx` | active/focus/hover 统一 | `--nav-*` `--motion-base` | 键盘可达，active判定100% |
| `frontend/src/components/header/HeaderActions.tsx` | 搜索/主题/登录按钮规格统一 | `--icon-btn-*` | 点击区≥40px |
| `frontend/src/components/header/MobileMenuButton.tsx` | 菜单按钮状态与可访问标签 | `--motion-fast` | `aria-label` 完整，开合延迟<100ms |
| `frontend/src/components/Header.module.css` | 清理硬编码色值，改语义变量 | `--header-*` | 硬编码色值降至0（品牌例外） |
| `frontend/src/components/ThemeSwitch.tsx` `frontend/src/components/LanguageSwitch.tsx` | 下拉面板状态对齐 | `--surface-pop` `--shadow-pop` | 明暗主题一致 |

### B组（Footer）

| 文件路径 | 改动点 | Token | DoD |
|---|---|---|---|
| `frontend/src/components/Footer.tsx` | 品牌/导航/社交/合规四区结构 | `--footer-*` | 首页外页脚一致渲染 |
| `frontend/src/components/Footer.module.css` | 社媒 icon 动效与焦点态 | `--motion-fast` `--icon-size-sm` | hover时长 300ms±50ms |
| `frontend/src/components/home/MegaFooter.tsx` | 首页大页脚与标准页脚风格对齐 | `--space-section-*` | 首页只渲染 MegaFooter |
| `frontend/src/app/(public)/layout.tsx` | Footer 条件渲染策略 | `layout.footer.variant` | `/` 不渲染标准 Footer，其它路由渲染 |

### C组（Layout）

| 文件路径 | 改动点 | Token | DoD |
|---|---|---|---|
| `frontend/src/app/layout.tsx` | 根层字体/背景/主题基线 | `--site-bg` `--text-primary` | 首屏无样式闪烁 |
| `frontend/src/app/(public)/layout.tsx` | Header/Main/Footer 壳层策略 | `--header-h` `--space-section-*` | `main` 语义完整，Footer贴底稳定 |
| `frontend/src/components/SectionContainer.tsx` | 容器宽度语义化（shell/content/reading） | `--container-*` | 无横向滚动，边距统一 |
| `frontend/src/components/layouts/*.tsx` | 文章/列表/杂志布局网格与节奏统一 | `--grid-*` `--space-*` | 同类布局节奏一致率≥90% |
| `frontend/src/components/admin/AdminLayout.tsx` `frontend/src/app/admin/layout.tsx` | 后台框架并轨 | `--admin-*` `--density-*` | 未登录/加载/已登录三态完整 |

### D组（Sections + Cards）

| 文件路径 | 改动点 | Token | DoD |
|---|---|---|---|
| `frontend/src/components/sections/BlogCard.tsx` `WorkCard.tsx` | 卡片层级、动效、信息密度 | `--card-*` `--motion-*` | 明暗主题一致，hover不冲突 |
| `frontend/src/components/magazine/ArticleCard.tsx` `BookCard.tsx` `ChapterCard.tsx` `SmartCard.tsx` | 多卡型统一视觉语法 | `--card-*` `--radius-*` | 4卡型同源，层级清晰 |
| `frontend/src/components/home/HeroCard.tsx` `SocialCard.tsx` `ToolsCard.tsx` | 首页特色卡与通用卡对齐 | `--radius-*` `--shadow-*` | 桌面/移动规则一致 |
| `frontend/src/components/admin/AdminStatsCard.tsx` | 指标卡语义色与排版统一 | `--state-*` `--text-*` | 5语义色稳定可读 |

### E组（Theme & Token）

| 文件路径 | 改动点 | Token | DoD |
|---|---|---|---|
| `frontend/src/styles/tailwind.css` | 抽离全局语义 token，减少硬编码 | `--g-*` `--a-*` | 硬编码色值下降≥60% |
| `frontend/src/styles/visitor-theme.css` | Visitor 主题只消费语义层 | `--visitor-*` | 浅/深切换无缺失变量 |
| `frontend/src/styles/monograph-theme.css` | 长文主题与全局别名对齐 | `--mono-*` | 重复定义下降≥50% |
| `frontend/src/styles/admin-theme.css` | Admin 状态色统一 | `--admin-*` | 成功/警告/危险/信息一致 |
| `frontend/src/styles/admin-compact.css` | 紧凑模式改密度 token 驱动 | `--density-*` | 信息密度提升可复测 |
| `frontend/src/styles/prism.css` | 语法高亮引用主题 token | `--code-*` | 10+语法类别在浅/深可读 |

---

## 13) 多 Agent 执行记录（本轮已完成）

已并行启动 5 个 Agent 并完成交付内容汇总：
- A组：导航 Header 分包任务单 + 前端对照表
- B组：Footer 分包任务单 + 前端对照表
- C组：Layout 分包任务单 + 前端对照表
- D组：Sections/Cards 分包任务单 + 前端对照表
- E组：Theme/Token 分包任务单 + 前端对照表

本轮为“方案与实施蓝图交付”，未直接改动业务代码。
