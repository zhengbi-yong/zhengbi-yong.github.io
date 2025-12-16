# Storybook 组件文档指南

本指南展示了项目中所有可用的组件及其在 Storybook 中的故事。

## 运行 Storybook

```bash
# 启动开发服务器
pnpm storybook

# 构建静态版本
pnpm build-storybook
```

## 组件分类

### UI 组件

#### 基础 UI

- **Button** (`stories/ui/Button.stories.tsx`) - 按钮组件，支持多种样式和状态
- **Card** (`stories/ui/Card.stories.tsx`) - 卡片组件，用于内容展示
- **LoadingStates** (`stories/ui/LoadingStates.stories.tsx`) - 加载状态组件集合
  - Skeleton - 骨架屏
  - PageLoader - 页面加载器
  - ProgressBar - 进度条
  - EmptyState - 空状态
  - ErrorState - 错误状态

### 核心组件

#### 布局和导航

- **Header** (`stories/components/Header.stories.tsx`) - 页面头部导航
- **Footer** (`stories/components/Footer.stories.tsx`) - 页面底部
- **LanguageSwitch** (`stories/components/LanguageSwitch.stories.tsx`) - 语言切换器

#### 动画组件

- **FadeIn** (`stories/animations/FadeIn.stories.tsx`) - 淡入动画
- **SlideIn** - 滑入动画
- **ScaleIn** - 缩放动画
- **RotateIn** - 旋转动画
- **BounceIn** - 弹跳动画

#### 功能组件

- **PerformanceDashboard** (`stories/components/PerformanceDashboard.stories.tsx`) - 性能监控面板
- **ReadingProgress** - 阅读进度指示器
- **ThemeSwitch** - 主题切换器
- **SearchButton** - 搜索按钮

### Hooks

#### 数据 Hooks

- **useReadingProgress** (`stories/hooks/useReadingProgress.stories.tsx`) - 阅读进度追踪
- **useArticleAnalytics** - 文章分析
- **usePerformanceMonitor** - 性能监控
- **useScrollAnimation** - 滚动动画

#### 工具 Hooks

- **useImagePreload** - 图片预加载
- **useGSAP** - GSAP 动画库封装
- **useActiveHeading** - 活跃标题追踪

### 页面组件

#### 博客相关

- **BlogCard** - 博客卡片
- **ArticleCard** - 文章卡片
- **Tag** - 标签组件
- **Comments** - 评论组件

#### 展示组件

- **HeroCard** - 主页卡片
- **WorkCard** - 作品卡片
- **SocialCard** - 社交卡片
- **ToolsCard** - 工具卡片

## 如何使用 Storybook

### 1. 浏览组件

在左侧边栏导航到不同的组件分类，点击组件名称查看其所有故事（变体）。

### 2. 交互式开发

- 使用控件面板调整组件属性
- 实时查看变化
- 测试不同的状态和组合

### 3. 查看文档

- 点击 "Docs" 标签查看组件文档
- 查看属性说明和使用示例
- 了解最佳实践

### 4. 响应式测试

- 使用工具栏切换不同视口大小
- 测试移动端、平板和桌面显示
- 验证响应式布局

### 5. 主题切换

- 使用全局工具栏切换明暗主题
- 测试组件在不同主题下的表现
- 验证颜色对比度

## 添加新的组件故事

### 1. 创建基础故事文件

```typescript
// stories/your-component/YourComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import YourComponent from '@/components/YourComponent'

const meta: Meta<typeof YourComponent> = {
  title: 'Category/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'centered', // 或 'fullscreen'
  },
  tags: ['autodocs'],
  argTypes: {
    // 定义可控制的属性
    propName: {
      control: 'select', // text, boolean, number, color, etc.
      options: ['option1', 'option2'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 默认故事
export const Default: Story = {
  args: {
    // 默认属性值
  },
}

// 其他变体
export const Variant: Story = {
  args: {
    // 变体属性值
  },
}
```

### 2. 最佳实践

1. **清晰的标题和描述**
   - 使用有意义的标题
   - 提供组件用途的简要说明

2. **全面的示例**
   - 展示所有主要状态
   - 包含边缘案例
   - 提供交互式示例

3. **参数控制**
   - 为重要属性添加控件
   - 使用合理的默认值
   - 提供清晰的选项

4. **响应式测试**
   - 展示不同屏幕尺寸下的表现
   - 使用视口参数

5. **主题支持**
   - 测试明暗主题
   - 确保颜色可访问性

## 组件设计系统

### 颜色规范

- 主色调：blue-600
- 成功色：green-600
- 警告色：yellow-600
- 错误色：red-600
- 中性色：gray 系列颜色

### 间距规范

- 使用 Tailwind CSS 的间距类
- 基础单位：4px (1 in Tailwind)
- 常用间距：4, 8, 16, 24, 32, 48, 64

### 字体规范

- 标题：text-xl, text-2xl, text-3xl
- 正文：text-base, text-sm
- 细节：text-xs

### 圆角规范

- 小圆角：rounded, rounded-md
- 中圆角：rounded-lg
- 大圆角：rounded-xl, rounded-2xl

## 常见问题

### 1. 组件未显示

- 检查文件路径是否正确
- 确保组件是默认导出
- 查看控制台错误信息

### 2. 属性控制无效

- 检查 argTypes 配置
- 确认属性名称正确
- 查看组件是否接受该属性

### 3. 样式问题

- 确保已导入全局样式
- 检查 Tailwind CSS 配置
- 验证暗模式样式

### 4. TypeScript 错误

- 确保类型定义正确
- 检查组件 Props 接口
- 更新 Storybook 类型配置

## 贡献指南

1. 为新组件创建故事
2. 更新现有故事以改进文档
3. 添加更多交互式示例
4. 确保所有故事通过测试
5. 遵循命名和组织规范

## 相关资源

- [Storybook 官方文档](https://storybook.js.org/)
- [Storybook for React](https://storybook.js.org/docs/react/get-started/introduction)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
