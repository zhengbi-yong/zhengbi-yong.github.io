# 内容管理指南

本指南详细说明如何创建、管理和发布博客文章。

## 目录

- [文章结构](#文章结构)
- [创建新文章](#创建新文章)
- [Frontmatter 配置](#frontmatter-配置)
- [分类系统](#分类系统)
- [标签系统](#标签系统)
- [发布流程](#发布流程)

## 文章结构

### 目录组织

博客文章按分类存储在 `frontend/data/blog/` 目录中：

```
frontend/data/blog/
├── computer/          # 计算机科学
├── robotics/          # 机器人学
├── math/              # 数学
├── chemistry/         # 化学
├── motor/             # 电机控制
├── music/             # 音乐
├── photography/       # 摄影
├── social/            # 社会评论
├── tactile/           # 触觉传感
├── tools/             # 开发工具
├── control/           # 控制理论
└── economics/         # 经济学
```

### 文件格式

所有文章使用 **MDX** 格式（`.mdx` 扩展名），支持：
- 标准 Markdown 语法
- JSX 组件导入
- React 组件嵌入
- 自定义 MDX 组件

## 创建新文章

### 1. 选择分类

根据文章主题选择合适的分类目录。

### 2. 创建 MDX 文件

在对应分类目录下创建新文件：

```bash
cd frontend/data/blog/[category]
touch my-new-post.mdx
```

### 3. 添加 Frontmatter

每个文章必须包含 frontmatter 元数据：

```yaml
---
title: "文章标题"
date: 2025-01-15
tags: ['tag1', 'tag2', 'tag3']
draft: false
summary: "简短的文章摘要，用于 SEO 和文章列表"
layout: PostLayout
authors:
  - name: Zhengbi Yong
    url: https://github.com/zhengbi-yong
    image_url: https://github.com/zhengbi-yong.png
---
```

### 4. 编写内容

```mdx
import { MyComponent } from '@/components/MyComponent'

# 文章标题

正文内容...

## 二级标题

### 三级标题

**粗体** 和 *斜体*

- 列表项 1
- 列表项 2

> 引用文本

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`

<MyComponent prop="value" />
```

## Frontmatter 配置

### 必需字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 文章标题 |
| `date` | Date | 发布日期 (YYYY-MM-DD) |
| `tags` | string[] | 标签数组 |
| `draft` | boolean | 是否为草稿 |
| `summary` | string | 文章摘要 |

### 可选字段

| 字段 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `layout` | string | 页面布局 | `PostLayout` |
| `canonicalUrl` | string | 原文链接（转载时使用） | - |
| `authors` | object[] | 作者信息 | 站点默认作者 |

### 布局选项

三种可用的文章布局：

#### PostLayout（完整布局）

```yaml
layout: PostLayout
```

特性：
- 目录（TOC）
- 作者信息
- 阅读时间
- 评论系统
- 分享按钮
- 相关文章

#### PostSimple（简洁布局）

```yaml
layout: PostSimple
```

特性：
- 简洁设计
- 无侧边栏
- 专注于阅读
- 快速加载

#### PostBanner（横幅布局）

```yaml
layout: PostBanner
```

特性：
- 大型横幅图片
- 视觉冲击力强
- 适合展示型文章

## 分类系统

### 可用分类

| 分类 | 目录 | 说明 |
|------|------|------|
| 计算机科学 | `computer/` | AI、算法、编程 |
| 机器人学 | `robotics/` | ROS、控制系统、自动化 |
| 数学 | `math/` | 线性代数、微积分、理论 |
| 化学 | `chemistry/` | 分子可视化、化学结构 |
| 电机控制 | `motor/` | 伺服系统、电机 |
| 音乐 | `music/` | 音乐理论、记谱 |
| 摄影 | `photography/` | 摄影作品展示 |
| 社会评论 | `social/` | 社会议题、评论文章 |
| 触觉传感 | `tactile/` | 触觉研究、实验 |
| 开发工具 | `tools/` | 工具介绍、使用教程 |
| 控制理论 | `control/` | 反馈系统、控制算法 |
| 经济学 | `economics/` | 经济学理论、分析 |

### 添加新分类

1. 创建目录：
```bash
mkdir frontend/data/blog/[new-category]
```

2. 将文章放入新目录

3. 更新站点配置（可选）

## 标签系统

### 标签规则

- 使用小写字母
- 使用连字符分隔单词
- 使用英文标签（中文内容可用英文标签）
- 每篇文章 3-8 个标签

### 好的标签示例

```yaml
tags: ['machine-learning', 'computer-vision', 'deep-learning']
tags: ['robotics', 'ros', 'navigation']
tags: ['calculus', 'integration', 'derivatives']
```

### 自动生成

标签数据自动生成在 `frontend/data/tag-data.json`：

```bash
cd frontend
pnpm generate:tags
```

### 标签页面

每个标签会自动生成独立页面：
- URL: `/tags/[tag-slug]`
- 显示该标签下的所有文章
- 支持标签过滤

## 发布流程

### 本地预览

1. 启动开发服务器：
```bash
cd frontend
pnpm dev
```

2. 访问文章：
```
http://localhost:3001/blog/[category]/[post-slug]
```

### 草稿模式

设置 `draft: true` 的文章不会出现在生产构建中：

```yaml
---
draft: true
---
```

预览草稿：
```bash
# 在 .env.local 中设置
NEXT_PUBLIC_DRAFT_MODE=true

# 或构建时
DRAFT=1 pnpm build
```

### 发布文章

1. **检查 frontmatter**：
   - 设置 `draft: false`
   - 验证日期格式
   - 确认标签正确

2. **测试构建**：
```bash
cd frontend
pnpm build
```

3. **提交更改**：
```bash
git add frontend/data/blog/[category]/my-post.mdx
git commit -m "Add: New blog post"
git push
```

4. **自动部署**：
   - GitHub Actions 自动构建
   - 部署到 GitHub Pages

### 更新文章

修改现有文章：
1. 编辑 MDX 文件
2. 可选：更新日期 (`date` 字段)
3. 提交更改

### 删除文章

⚠️ **注意**: 删除后 URL 会失效，考虑使用重定向。

```bash
git rm frontend/data/blog/[category]/old-post.mdx
git commit -m "Remove: Old blog post"
```

## 图片管理

### 图片存放

推荐结构：
```
frontend/public/
├── images/
│   ├── blog/
│   │   ├── [category]/
│   │   │   └── [post-slug]/
│   │   │       ├── hero.jpg
│   │   │       └── content-image.png
```

### 图片引用

**相对路径** (推荐):
```mdx
![图片描述](/images/blog/[category]/[post-slug]/image.png)
```

**绝对路径**:
```mdx
![图片描述](https://example.com/image.png)
```

### 优化建议

- 使用 WebP 格式（更快加载）
- 压缩图片（使用 TinyPNG 等工具）
- 响应式图片（Next.js Image 组件）
- 添加 alt 文本（无障碍访问）

## 代码示例

### 内联代码

单行代码使用反引号：

```
使用 `const` 声明常量
```

### 代码块

指定语言以启用语法高亮：

``````markdown
```python
def hello():
    print("Hello, World!")
```
``````

### 导入代码文件

```mdx
此处有代码

import CodeBlock from '@/components/mdx/CodeBlock'

<CodeBlock language="rust" src="/examples/main.rs" />
```

## 交互式组件

### 3D 模型

```mdx
import { ThreeViewer } from '@/components/3d/ThreeViewer'

<ThreeViewer modelPath="/models/robot.glb" />
```

### 分子可视化

```mdx
import { MoleculeViewer } from '@/components/chemistry/MoleculeViewer'

<MoleculeViewer pdbFile="/molecules/protein.pdb" />
```

### 图表

```mdx
import { LineChart } from '@/components/charts/LineChart'

<LineChart data={chartData} xKey="date" yKey="value" />
```

### 音乐记谱

```mdx
import { MusicNotation } from '@/components/music/MusicNotation'

<MusicNotation xmlPath="/music/score.musicxml" />
```

更多组件请查看 [写作指南](writing-guide.md)。

## SEO 优化

### 标题优化

- 使用描述性标题
- 包含关键词
- 控制在 60 字符以内

### 摘要优化

```yaml
summary: "简洁、吸引人的文章摘要，包含主要关键词"
```

建议：
- 150-200 字符
- 包含核心关键词
- 吸引读者点击

### URL 结构

自动生成：
```
/blog/[category]/[post-slug]
```

Slug 基于 title，使用 kebab-case：
```
"My First Post" → my-first-post
```

自定义 slug（通过文件名）：
```
my-custom-slug.mdx → /blog/computer/my-custom-slug
```

## 最佳实践

### ✅ 推荐做法

1. **每次写完检查**:
   - 拼写和语法
   - 链接有效性
   - 图片加载

2. **使用草稿模式**:
   - 先设为 `draft: true`
   - 完成后再发布

3. **定期备份**:
   - Git 版本控制
   - 定期提交

4. **一致性**:
   - 统一写作风格
   - 规范标签命名
   - 标准化 frontmatter

### ❌ 避免做法

1. **不要**使用特殊字符在文件名中
2. **不要**忘记设置 `draft: false`
3. **不要**使用过大的图片（> 1MB）
4. **不要**忽略拼写检查
5. **不要**直接编辑 `.next` 目录

## 相关文档

- [写作指南](writing-guide.md) - Markdown 和组件使用
- [管理后台](admin-panel.md) - 管理内容和评论
- [前端架构](../development/frontend/overview.md) - 了解内容处理流程

---

**最后更新**: 2025-12-27
