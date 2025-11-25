# 背景
文件名：code-quality-performance-optimization_2025-01-14_2.md
创建于：2025-01-14
创建者：Auto
主分支：main
任务分支：task/code-quality-performance-optimization_2025-01-14_2
Yolo模式：Off

# 任务描述
实施代码质量和性能优化，包括：
1. 创建统一日志工具系统（渐进式方案）
2. 优化 ThreeJSViewer 组件：添加页面可见性检测
3. 创建全局错误边界组件（渐进式方案）

# 项目概览
这是一个基于Next.js 16的博客项目，使用React 19、TypeScript、Tailwind CSS等技术栈。项目包含3D模型查看器、粒子动画、GSAP动画等高性能组件。

⚠️ 警告：永远不要修改此部分 ⚠️
核心RIPER-5协议规则：
- 必须在每个响应开头声明模式
- EXECUTE模式必须100%遵循计划
- 未经明确许可不能在模式间转换
- 所有代码修改必须完整显示上下文
⚠️ 警告：永远不要修改此部分 ⚠️

# 分析
通过代码研究，发现以下优化机会：
1. ThreeJSViewer.tsx 中有 12 处 console 语句，虽然已用 process.env.NODE_ENV 包裹，但可以统一为 logger 工具
2. ThreeJSViewer 的动画循环没有实现页面可见性检测，页面不可见时仍在渲染，浪费资源
3. 缺少全局错误边界组件，无法优雅处理 React 错误

# 提议的解决方案
采用渐进式综合方案：
- 第一阶段：创建统一日志工具系统（基础版，保留扩展接口）
- 第二阶段：ThreeJSViewer 页面可见性检测优化
- 第三阶段：创建全局错误边界组件（基础版，保留扩展接口）

# 当前执行步骤："2. 实施代码优化"

# 任务进度
[2025-01-14]
- 已创建：任务文件和功能分支
- 状态：规划中

[2025-01-14 执行阶段]
- 已创建：lib/utils/logger.ts - 统一日志工具系统
- 已修改：components/ThreeJSViewer.tsx
  - 添加 logger 导入
  - 替换所有 12 处 console 语句为 logger 方法
  - 添加页面可见性检测（isVisibleRef）
  - 添加 visibilitychange 事件监听器
  - 优化动画循环，仅在页面可见时渲染
- 已创建：components/ErrorBoundary.tsx - 全局错误边界组件
- 已修改：app/layout.tsx - 集成 ErrorBoundary 组件
- 状态：实施完成，待确认

# 最终审查
待完成

