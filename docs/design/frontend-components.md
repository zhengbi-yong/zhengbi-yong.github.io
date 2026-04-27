# 前端组件清单与管理

> 来源：APPEARENCE.md（精简重组）
> 用途：前端工程师和设计师查询当前组件分布和视觉模块归属

## 1) 全局外观入口

| 文件 | 职责 |
|------|------|
| `frontend/src/app/layout.tsx` | 全局 CSS 入口、字体、主题层 |
| `frontend/src/app/(public)/layout.tsx` | 公共页面外壳（Header + Main + Footer） |

## 2) 页眉模块 (Header)

| 文件 | 职责 |
|------|------|
| `Header.tsx` | 统一入口（重导出到优化版） |
| `header/HeaderOptimized.tsx` | 主用实现（桌面导航、移动菜单、滚动显隐） |
| `header/HeaderNavigation.tsx` | 导航链接结构 + 移动折叠 |
| `header/HeaderActions.tsx` | 搜索/主题/语言/Auth 动作区 |
| `header/MobileMenuButton.tsx` | 移动端菜单按钮 |
| `header/DarkModeToggle.tsx` | 深浅色切换按钮 |
| `Header.module.css` | 页眉样式 |

## 3) 页脚模块 (Footer)

| 文件 | 职责 |
|------|------|
| `Footer.tsx` | 页脚整体布局（作者区、导航、社交、备案） |
| `home/MegaFooter.tsx` | 首页全屏 CTA 页脚 |
| `Footer.module.css` | 页脚样式 |

## 4) 布局组件 (Layout)

### 站点级

| 文件 | 职责 |
|------|------|
| `LayoutWrapper.tsx` | 通用 Header/Main/Footer 包装 |
| `SectionContainer.tsx` | 内容横向边距规则 |

### 业务布局

| 文件 | 职责 | 状态 |
|------|------|------|
| `layouts/PostLayoutMonograph.tsx` | 长文阅读布局 | ✅ 唯一活跃 |
| `layouts/ListLayout.tsx` | 列表页布局 | ✅ 活跃 |
| `layouts/ListLayoutWithTags.tsx` | 带标签筛选的列表 | ✅ 待合并入 ListLayout |
| `layouts/AuthorLayout.tsx` | 作者页 | ✅ 活跃 |
| `layouts/MagazineLayout.tsx` | 杂志流布局 | ✅ 活跃 |
| `layouts/PostSimple.tsx` | | ❌ 已废弃 |
| `layouts/PostBanner.tsx` | | ❌ 已废弃 |
| `layouts/PostLayout.tsx` | | ❌ 已废弃 |

### 管理后台布局

| 文件 | 职责 |
|------|------|
| `admin/AdminLayout.tsx` | 后台布局（侧栏 + 顶栏 + 内容区） |
| `app/admin/layout.tsx` | 后台布局入口 |

## 5) 页面区块 (Sections)

| 文件 | 职责 |
|------|------|
| `magazine/HeroSection.tsx` | 杂志风 Hero |
| `sections/PageHeader.tsx` | 通用页标题区 |
| `sections/SectionHeader.tsx` | 区块标题 |
| `sections/BlogSection.tsx` | 博客区块 |
| `sections/WorksSection.tsx` | 作品区块 |
| `sections/FeaturedWork.tsx` | 重点作品区 |
| `sections/ActionBar.tsx` | 底部操作条 |

## 6) 卡片组件 (Cards)

| 文件 | 用途 |
|------|------|
| `sections/BlogCard.tsx` | 博客文章卡片 |
| `sections/WorkCard.tsx` | 作品卡片 |
| `magazine/ArticleCard.tsx` | 杂志文章卡片 |
| `magazine/BookCard.tsx` | 书籍卡片 |
| `home/BentoCard.tsx` | 首页 Bento 网格卡片 |
| `admin/AdminStatsCard.tsx` | 后台指标卡片 |

## 7) 主题与视觉 Token

| 文件 | 用途 |
|------|------|
| `styles/tailwind.css` | 全局基础样式 |
| `styles/geist-tokens.css` | Geist 设计变量 |
| `styles/visitor-theme.css` | 访客主题 |
| `styles/monograph-theme.css` | 长文主题 |
| `styles/admin-theme.css` | 后台主题 |
| `styles/admin-compact.css` | 后台紧凑模式 |
| `styles/prism.css` | 代码高亮 |

## 8) 设计师 A-E 组分工指南

| 组 | 负责模块 | 文件范围 |
|----|---------|---------|
| **A组（导航）** | 页眉 | Header 全部文件 |
| **B组（页脚）** | 页脚 | Footer 全部文件 |
| **C组（版式）** | 布局系统 | Layout 文件 + SectionContainer |
| **D组（内容组件）** | Sections + Cards | sections/*, magazine/*Card, home/*Card |
| **E组（设计系统）** | 主题与 Token | 所有 CSS 主题文件 |

## 9) 改动优先级建议

```
1. 先定 Token/主题变量（E 组）
2. 再改全局布局壳（C 组 + Layout）
3. 再改 Header/Footer（A 组 + B 组）
4. 最后批量替换 Section/Card 视觉（D 组）
```

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
