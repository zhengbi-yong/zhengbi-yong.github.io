# 博客动画与组件增强 - 后续优化任务文件

## 项目信息
- **项目名称**: 博客系统后续优化与增强
- **创建日期**: 2025-11-24
- **技术栈**: Next.js 15.1.4 + React 19 + TypeScript + Tailwind CSS 4.0
- **前置任务**: 动画与组件增强三阶段已完成
- **实施策略**: 按优先级分阶段实施

## 任务概述

本任务旨在对已完成的三阶段动画与组件增强进行后续优化和扩展，包括性能优化、功能扩展、测试、文档完善、部署优化等方面。

### 目标
1. 优化性能，减少 Bundle 大小
2. 扩展功能，添加更多组件和动画
3. 完善测试，确保代码质量
4. 优化文档，提升开发体验
5. 优化部署，提升用户体验
6. 增强可访问性和 SEO

---

## 第四阶段：性能优化（高优先级）

### 阶段目标
- 优化 Bundle 大小
- 实现代码分割
- 优化动画性能
- 提升页面加载速度

### 步骤 1：优化 experiment 页面代码分割

**文件路径**: `app/experiment/page.tsx`

**AI 执行 Prompt**:
```
优化 app/experiment/page.tsx 文件，实现代码分割以减小初始 Bundle 大小。

修改要求：
1. 使用 Next.js 的 dynamic import 动态导入 Three.js 相关代码：
   - 导入 dynamic：import dynamic from 'next/dynamic'
   - 创建一个新的组件文件 components/ThreeJSViewer.tsx，将现有的 Three.js 初始化代码（useEffect 中的 initThree 函数及相关逻辑）移动到该组件中
   - 在 experiment/page.tsx 中使用 dynamic 导入 ThreeJSViewer：
     ```typescript
     const ThreeJSViewer = dynamic(() => import('@/components/ThreeJSViewer'), {
       ssr: false,
       loading: () => <div className="flex h-96 items-center justify-center">加载 3D 模型中...</div>
     })
     ```
2. 将 ParticleBackground 组件也进行动态导入（可选，如果该组件较大）：
   ```typescript
   const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), {
     ssr: false
   })
   ```
3. 确保所有功能保持不变
4. 测试验证：
   - 运行 yarn build 验证构建成功
   - 运行 yarn analyze 检查 Bundle 大小变化
   - 验证页面功能正常
```

**预期结果**: experiment 页面的初始 Bundle 大小显著减小，Three.js 代码按需加载

---

### 步骤 2：创建 ThreeJSViewer 组件

**文件路径**: `components/ThreeJSViewer.tsx`

**AI 执行 Prompt**:
```
创建一个新的客户端组件 ThreeJSViewer.tsx，文件路径为 components/ThreeJSViewer.tsx。

组件要求：
1. 使用 'use client' 指令
2. 将 app/experiment/page.tsx 中的 Three.js 初始化代码（useEffect 中的 initThree 函数及相关逻辑）移动到该组件中
3. 组件应该是一个独立的、可复用的 3D 模型查看器
4. 支持以下 props（如果需要）：
   - className?: string（可选，用于自定义容器样式）
   - modelPath?: string（可选，URDF 模型路径，默认使用现有的路径）
5. 保持原有的所有功能：
   - URDF 模型加载
   - 轨道控制
   - 光照设置
   - 清理逻辑
6. 使用 TypeScript 严格类型
7. 添加适当的注释说明
8. 确保清理函数正确实现，避免内存泄漏

注意：从 experiment/page.tsx 中移动代码时，需要：
- 移动所有相关的 import 语句（THREE, URDFLoader, OrbitControls）
- 移动所有 useRef 声明（containerRef, sceneRef, rendererRef, cameraRef, controlsRef, animationId）
- 移动整个 useEffect 逻辑
- 移动容器 div 的渲染代码
```

**预期结果**: 创建独立的 ThreeJSViewer 组件，支持动态导入

---

### 步骤 3：优化动画性能 - 添加 will-change 属性

**文件路径**: `components/AnimatedSection.tsx`

**AI 执行 Prompt**:
```
优化 components/AnimatedSection.tsx 组件，添加 CSS will-change 属性以提升动画性能。

修改要求：
1. 在元素进入视口前，添加 will-change 属性：
   - 初始状态：添加 'will-change: transform, opacity' 样式
   - 动画完成后：移除 will-change 属性（性能优化）
2. 实现方式：
   - 使用 style 属性或 className 动态添加/移除 will-change
   - 在动画完成后（transitionend 事件或 setTimeout）移除 will-change
3. 确保不影响现有功能
4. 测试验证动画性能是否提升

注意：will-change 应该在动画开始前添加，动画结束后移除，避免长期占用 GPU 资源。
```

**预期结果**: 动画性能提升，GPU 加速优化

---

### 步骤 4：优化 Intersection Observer 配置

**文件路径**: `components/AnimatedSection.tsx`

**AI 执行 Prompt**:
```
优化 components/AnimatedSection.tsx 中的 Intersection Observer 配置，提升动画触发时机。

修改要求：
1. 调整 rootMargin 配置，根据动画方向动态设置：
   - 'up': rootMargin: '0px 0px -50px 0px'（提前 50px 触发）
   - 'down': rootMargin: '-50px 0px 0px 0px'
   - 'left': rootMargin: '0px 0px 0px -50px'
   - 'right': rootMargin: '0px -50px 0px 0px'
2. 或者使用统一的提前触发距离，如 '0px 0px -100px 0px'
3. 确保动画在用户看到元素前就开始，提供更好的视觉体验
4. 测试验证动画触发时机是否合适
```

**预期结果**: 动画触发时机更合理，用户体验提升

---

### 步骤 5：移动设备动画优化

**文件路径**: `components/AnimatedSection.tsx`, `components/animations/FadeIn.tsx`, `components/animations/SlideIn.tsx`, `components/animations/ScaleIn.tsx`

**AI 执行 Prompt**:
```
为动画组件添加移动设备优化，降低移动设备上的动画复杂度以提升性能。

修改要求：
1. 检测设备类型（使用 navigator.userAgent 或 window.innerWidth）：
   - 移动设备：减少动画距离、降低粒子数量、简化动画效果
   - 桌面设备：保持原有动画效果
2. 在 AnimatedSection 中：
   - 移动设备：使用较小的 translate 距离（如 translate-y-4 而不是 translate-y-8）
   - 移动设备：使用较短的动画时长（如 duration-300 而不是 duration-500）
3. 在 Framer Motion 组件中：
   - 移动设备：减少 distance 参数（SlideIn）
   - 移动设备：使用较短的 duration
4. 在 ParticleBackground 中：
   - 移动设备：默认减少 particleCount（如 30 而不是 50）
5. 使用 TypeScript 严格类型
6. 添加适当的注释说明

注意：可以通过环境变量或配置项控制是否启用移动设备优化。
```

**预期结果**: 移动设备性能提升，动画更流畅

---

## 第五阶段：功能扩展（中优先级）

### 阶段目标
- 添加更多动画组件
- 扩展 Shadcn UI 组件库
- 增强交互效果
- 提升用户体验

### 步骤 6：创建 RotateIn 动画组件

**文件路径**: `components/animations/RotateIn.tsx`

**AI 执行 Prompt**:
```
创建一个新的 Framer Motion 动画组件 RotateIn.tsx，文件路径为 components/animations/RotateIn.tsx。

组件要求：
1. 使用 'use client' 指令
2. 使用 Framer Motion 实现旋转进入动画
3. 支持以下 props：
   - children: ReactNode（必需）
   - delay?: number（可选，延迟时间，默认 0，单位秒）
   - duration?: number（可选，动画时长，默认 0.5，单位秒）
   - angle?: number（可选，旋转角度，默认 180，单位度）
   - className?: string（可选）
   - whileInView?: boolean（可选，是否在进入视口时触发，默认 false）
4. 动画效果：
   - 初始状态：opacity: 0, rotate: -angle（或 angle）
   - 结束状态：opacity: 1, rotate: 0
5. 使用 TypeScript 严格类型
6. 添加适当的注释说明
7. 参考 FadeIn.tsx 的实现方式，保持代码风格一致
```

**预期结果**: 创建 RotateIn 动画组件

---

### 步骤 7：创建 BounceIn 动画组件

**文件路径**: `components/animations/BounceIn.tsx`

**AI 执行 Prompt**:
```
创建一个新的 Framer Motion 动画组件 BounceIn.tsx，文件路径为 components/animations/BounceIn.tsx。

组件要求：
1. 使用 'use client' 指令
2. 使用 Framer Motion 实现弹跳进入动画
3. 支持以下 props：
   - children: ReactNode（必需）
   - delay?: number（可选，延迟时间，默认 0，单位秒）
   - duration?: number（可选，动画时长，默认 0.6，单位秒）
   - className?: string（可选）
   - whileInView?: boolean（可选，是否在进入视口时触发，默认 false）
4. 动画效果：
   - 初始状态：opacity: 0, scale: 0.3, y: -50
   - 结束状态：opacity: 1, scale: 1, y: 0
   - 使用 Framer Motion 的 spring 动画类型，实现弹跳效果
5. 使用 TypeScript 严格类型
6. 添加适当的注释说明
7. 参考其他动画组件的实现方式，保持代码风格一致
```

**预期结果**: 创建 BounceIn 动画组件

---

### 步骤 8：更新 MDXComponents 添加新动画组件

**文件路径**: `components/MDXComponents.tsx`

**AI 执行 Prompt**:
```
更新 components/MDXComponents.tsx 文件，添加新创建的动画组件映射。

修改要求：
1. 导入新创建的动画组件：
   - import RotateIn from './animations/RotateIn'
   - import BounceIn from './animations/BounceIn'
2. 在 components 对象中添加映射：
   - RotateIn: RotateIn
   - BounceIn: BounceIn
3. 确保不影响现有的组件映射
4. 添加 TypeScript 类型注释说明新组件
5. 测试验证：在 MDX 文件中可以使用新组件
```

**预期结果**: 新动画组件可在 MDX 文件中使用

---

### 步骤 9：添加更多 Shadcn UI 组件

**AI 执行 Prompt**:
```
使用 shadcn CLI 添加更多 UI 组件到项目中。

执行步骤：
1. 在项目根目录执行以下命令（逐个执行）：
   ```bash
   npx shadcn@latest add dialog
   npx shadcn@latest add dropdown-menu
   npx shadcn@latest add tabs
   npx shadcn@latest add accordion
   npx shadcn@latest add alert
   npx shadcn@latest add progress
   ```
2. 每个命令执行后：
   - 检查组件文件是否创建成功
   - 检查 components.json 是否更新
   - 验证组件是否可以正常导入
3. 更新 components/MDXComponents.tsx，添加新组件的映射（如果需要）
4. 在 app/experiment/page.tsx 中添加新组件的使用示例
5. 测试验证所有新组件功能正常

注意：如果组件需要特定的依赖，确保安装所有必需的依赖包。
```

**预期结果**: 添加 6 个新的 Shadcn UI 组件，并更新文档和示例

---

### 步骤 10：创建滚动进度指示器组件

**文件路径**: `components/ScrollProgress.tsx`

**AI 执行 Prompt**:
```
创建一个新的滚动进度指示器组件 ScrollProgress.tsx，文件路径为 components/ScrollProgress.tsx。

组件要求：
1. 使用 'use client' 指令
2. 显示页面滚动进度（0-100%）
3. 支持以下 props：
   - className?: string（可选，用于自定义样式）
   - height?: number（可选，进度条高度，默认 2，单位像素）
   - color?: string（可选，进度条颜色，默认使用主题色）
   - position?: 'top' | 'bottom'（可选，位置，默认 'top'）
4. 实现方式：
   - 使用 useEffect 监听 scroll 事件
   - 计算滚动百分比：scrollTop / (scrollHeight - clientHeight) * 100
   - 使用 Tailwind CSS 或内联样式显示进度条
5. 性能优化：
   - 使用 throttle 或 debounce 限制 scroll 事件处理频率
   - 使用 requestAnimationFrame 优化动画
6. 使用 TypeScript 严格类型
7. 添加适当的注释说明
8. 支持深色/浅色主题
```

**预期结果**: 创建滚动进度指示器组件

---

### 步骤 11：创建返回顶部按钮组件

**文件路径**: `components/BackToTop.tsx`

**AI 执行 Prompt**:
```
创建一个新的返回顶部按钮组件 BackToTop.tsx，文件路径为 components/BackToTop.tsx。

组件要求：
1. 使用 'use client' 指令
2. 当页面滚动超过一定距离时显示按钮
3. 点击按钮平滑滚动到页面顶部
4. 支持以下 props：
   - className?: string（可选，用于自定义样式）
   - threshold?: number（可选，显示按钮的滚动距离阈值，默认 400，单位像素）
   - showAtBottom?: boolean（可选，是否在页面底部也显示，默认 false）
5. 实现方式：
   - 使用 useEffect 监听 scroll 事件
   - 使用 useState 控制按钮显示/隐藏
   - 使用 window.scrollTo({ top: 0, behavior: 'smooth' }) 实现平滑滚动
   - 使用 Framer Motion 或 CSS 实现按钮出现/消失动画
6. UI 设计：
   - 使用 lucide-react 的 ArrowUp 图标
   - 使用 Shadcn UI Button 组件（如果已安装）
   - 固定在页面右下角（或可配置位置）
   - 支持深色/浅色主题
7. 使用 TypeScript 严格类型
8. 添加适当的注释说明
```

**预期结果**: 创建返回顶部按钮组件

---

### 步骤 12：实现页面过渡动画

**文件路径**: `app/layout.tsx`, `components/PageTransition.tsx`

**AI 执行 Prompt**:
```
实现页面之间的过渡动画效果。

修改要求：
1. 更新 components/PageTransition.tsx（如果已存在）或创建新文件：
   - 使用 Framer Motion 的 AnimatePresence 和 motion.div
   - 实现页面切换时的淡入淡出效果
   - 支持自定义动画类型（fade, slide, scale 等）
2. 在 app/layout.tsx 中：
   - 导入 PageTransition 组件
   - 使用 Next.js 的 usePathname 获取当前路径
   - 使用 PageTransition 包装 children
3. 确保不影响 SSR 和静态导出
4. 测试验证：
   - 页面切换时是否有过渡动画
   - 动画是否流畅
   - 是否有性能问题

注意：页面过渡动画可能会影响 SEO，需要确保内容在动画前已经渲染。
```

**预期结果**: 实现页面之间的平滑过渡动画

---

## 第六阶段：可访问性优化（高优先级）

### 阶段目标
- 添加 prefers-reduced-motion 支持
- 优化键盘导航
- 添加 ARIA 标签
- 提升可访问性

### 步骤 13：添加 prefers-reduced-motion 支持

**文件路径**: `components/AnimatedSection.tsx`, `components/animations/FadeIn.tsx`, `components/animations/SlideIn.tsx`, `components/animations/ScaleIn.tsx`, `components/ParticleBackground.tsx`

**AI 执行 Prompt**:
```
为所有动画组件添加 prefers-reduced-motion 媒体查询支持，尊重用户的动画偏好设置。

修改要求：
1. 创建一个工具函数或 Hook 检测 prefers-reduced-motion：
   ```typescript
   // lib/utils/motion.ts 或 components/hooks/useReducedMotion.ts
   export function useReducedMotion(): boolean {
     const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
     
     useEffect(() => {
       const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
       setPrefersReducedMotion(mediaQuery.matches)
       
       const handler = (e: MediaQueryListEvent) => {
         setPrefersReducedMotion(e.matches)
       }
       
       mediaQuery.addEventListener('change', handler)
       return () => mediaQuery.removeEventListener('change', handler)
     }, [])
     
     return prefersReducedMotion
   }
   ```
2. 更新所有动画组件：
   - AnimatedSection: 如果 prefersReducedMotion 为 true，跳过动画或使用简化动画
   - FadeIn, SlideIn, ScaleIn: 如果 prefersReducedMotion 为 true，直接显示内容（无动画）
   - ParticleBackground: 如果 prefersReducedMotion 为 true，禁用粒子动画
3. 确保在服务器端渲染时不会报错（使用 typeof window !== 'undefined' 检查）
4. 测试验证：
   - 在浏览器中设置 prefers-reduced-motion
   - 验证动画是否被禁用或简化
   - 验证内容是否正常显示
```

**预期结果**: 所有动画组件支持 prefers-reduced-motion，提升可访问性

---

### 步骤 14：优化键盘导航

**文件路径**: `components/BackToTop.tsx`, `app/experiment/page.tsx`

**AI 执行 Prompt**:
```
优化组件的键盘导航支持，确保所有交互元素都可以通过键盘访问。

修改要求：
1. 在 BackToTop 组件中：
   - 确保按钮可以通过 Tab 键聚焦
   - 添加键盘事件处理（Enter 和 Space 键触发点击）
   - 添加适当的 focus 样式
2. 在 experiment 页面中：
   - 检查所有 Button 组件是否支持键盘导航
   - 确保 Tooltip 组件在键盘聚焦时也能显示
   - 添加适当的 focus-visible 样式
3. 在所有交互组件中：
   - 使用 button 元素或添加 role="button" 和 tabIndex
   - 确保有清晰的焦点指示器
   - 测试 Tab 键导航顺序是否合理
4. 使用 TypeScript 严格类型
5. 添加适当的注释说明
```

**预期结果**: 所有交互元素支持键盘导航，提升可访问性

---

### 步骤 15：添加 ARIA 标签

**文件路径**: `components/ScrollProgress.tsx`, `components/BackToTop.tsx`, `components/ParticleBackground.tsx`

**AI 执行 Prompt**:
```
为所有自定义组件添加适当的 ARIA 标签，提升屏幕阅读器兼容性。

修改要求：
1. 在 ScrollProgress 组件中：
   - 添加 role="progressbar"
   - 添加 aria-label="页面滚动进度"
   - 添加 aria-valuenow 和 aria-valuemin、aria-valuemax 属性
2. 在 BackToTop 组件中：
   - 添加 aria-label="返回顶部"
   - 确保按钮有清晰的文本标签
3. 在 ParticleBackground 组件中：
   - 添加 aria-hidden="true"（装饰性元素）
   - 或者添加适当的 aria-label（如果对内容有影响）
4. 在所有动画组件中：
   - 如果动画对内容理解有影响，添加适当的 aria-live 属性
5. 测试验证：
   - 使用屏幕阅读器测试
   - 验证所有标签是否正确
```

**预期结果**: 所有组件添加适当的 ARIA 标签，屏幕阅读器兼容性提升

---

## 第七阶段：测试与质量保证（中优先级）

### 阶段目标
- 添加单元测试
- 添加 E2E 测试
- 性能测试
- 代码质量检查

### 步骤 16：设置测试环境

**AI 执行 Prompt**:
```
为项目设置测试环境，安装必要的测试框架和工具。

执行步骤：
1. 安装测试依赖：
   ```bash
   yarn add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom @types/jest
   ```
2. 创建 jest.config.js 文件：
   ```javascript
   const nextJest = require('next/jest')
   
   const createJestConfig = nextJest({
     dir: './',
   })
   
   const customJestConfig = {
     setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
     testEnvironment: 'jest-environment-jsdom',
     moduleNameMapper: {
       '^@/(.*)$': '<rootDir>/$1',
     },
   }
   
   module.exports = createJestConfig(customJestConfig)
   ```
3. 创建 jest.setup.js 文件：
   ```javascript
   import '@testing-library/jest-dom'
   ```
4. 更新 package.json，添加测试脚本：
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:coverage": "jest --coverage"
     }
   }
   ```
5. 验证安装：
   - 运行 yarn test 验证配置是否正确
   - 创建一个简单的测试文件验证环境
```

**预期结果**: 测试环境设置完成，可以运行单元测试

---

### 步骤 17：为动画组件添加单元测试

**文件路径**: `components/__tests__/AnimatedSection.test.tsx`, `components/__tests__/animations/FadeIn.test.tsx`

**AI 执行 Prompt**:
```
为动画组件创建单元测试文件。

创建测试文件：
1. components/__tests__/AnimatedSection.test.tsx：
   - 测试组件是否正确渲染
   - 测试 Intersection Observer 是否正确触发
   - 测试动画类是否正确应用
   - 测试清理函数是否正确执行
2. components/__tests__/animations/FadeIn.test.tsx：
   - 测试组件是否正确渲染
   - 测试 Framer Motion 动画是否正确应用
   - 测试 whileInView 属性是否正确工作
   - 测试 delay 和 duration 属性是否正确传递

测试要求：
1. 使用 @testing-library/react 进行渲染测试
2. 使用 jest.mock 模拟 Intersection Observer 和 Framer Motion
3. 测试所有 props 的不同组合
4. 测试边界情况（如 delay 为负数、duration 为 0 等）
5. 确保测试覆盖率 > 80%

注意：需要模拟浏览器 API（Intersection Observer, window.matchMedia 等）。
```

**预期结果**: 动画组件有完整的单元测试覆盖

---

### 步骤 18：设置 E2E 测试环境

**AI 执行 Prompt**:
```
为项目设置 E2E 测试环境，使用 Playwright。

执行步骤：
1. 安装 Playwright：
   ```bash
   yarn add -D @playwright/test
   npx playwright install
   ```
2. 创建 playwright.config.ts 文件：
   ```typescript
   import { defineConfig, devices } from '@playwright/test'
   
   export default defineConfig({
     testDir: './e2e',
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     reporter: 'html',
     use: {
       baseURL: 'http://localhost:3000',
       trace: 'on-first-retry',
     },
     projects: [
       {
         name: 'chromium',
         use: { ...devices['Desktop Chrome'] },
       },
     ],
     webServer: {
       command: 'yarn dev',
       url: 'http://localhost:3000',
       reuseExistingServer: !process.env.CI,
     },
   })
   ```
3. 创建 e2e 目录
4. 更新 package.json，添加 E2E 测试脚本：
   ```json
   {
     "scripts": {
       "test:e2e": "playwright test",
       "test:e2e:ui": "playwright test --ui"
     }
   }
   ```
5. 验证安装：
   - 运行 yarn test:e2e 验证配置是否正确
```

**预期结果**: E2E 测试环境设置完成

---

### 步骤 19：创建 E2E 测试用例

**文件路径**: `e2e/animation.spec.ts`, `e2e/components.spec.ts`

**AI 执行 Prompt**:
```
创建 E2E 测试用例，测试动画和组件的功能。

创建测试文件：
1. e2e/animation.spec.ts：
   - 测试博客列表页面的滚动动画
   - 测试文章页面的内容动画
   - 测试 experiment 页面的动画效果
   - 验证动画是否在正确的时机触发
2. e2e/components.spec.ts：
   - 测试 Shadcn UI 组件的交互（Button, Card, Tooltip 等）
   - 测试 BackToTop 按钮的功能
   - 测试 ScrollProgress 组件的显示
   - 验证主题切换功能

测试要求：
1. 使用 Playwright 的页面对象模式
2. 测试关键用户流程
3. 测试不同浏览器和设备
4. 添加截图和视频记录（可选）
5. 确保测试稳定可靠

注意：E2E 测试应该测试真实的用户交互，而不是实现细节。
```

**预期结果**: 创建完整的 E2E 测试用例

---

## 第八阶段：文档完善（中优先级）

### 阶段目标
- 完善组件文档
- 添加使用示例
- 创建最佳实践指南
- 提升开发体验

### 步骤 20：创建组件文档页面

**文件路径**: `docs/components/animations.md`, `docs/components/ui.md`

**AI 执行 Prompt**:
```
创建组件文档页面，详细说明所有动画组件和 UI 组件的使用方法。

创建文档文件：
1. docs/components/animations.md：
   - 列出所有动画组件（AnimatedSection, AnimatedList, FadeIn, SlideIn, ScaleIn, RotateIn, BounceIn）
   - 每个组件包含：
     - 组件描述
     - Props 说明
     - 使用示例（代码）
     - 最佳实践
     - 注意事项
2. docs/components/ui.md：
   - 列出所有 Shadcn UI 组件
   - 每个组件包含：
     - 组件描述
     - 安装命令
     - 使用示例
     - 自定义方法
3. 使用 Markdown 格式，包含代码示例和截图（如果有）
4. 添加目录和导航链接
5. 确保文档清晰易懂

注意：文档应该面向开发者，提供实用的信息。
```

**预期结果**: 创建完整的组件文档

---

### 步骤 21：更新 README 添加性能优化说明

**文件路径**: `README.md`

**AI 执行 Prompt**:
```
更新 README.md 文件，添加性能优化相关的说明。

添加内容：
1. 性能优化章节：
   - Bundle 大小优化方法
   - 代码分割最佳实践
   - 动画性能优化建议
   - 移动设备优化
2. 可访问性章节：
   - prefers-reduced-motion 支持说明
   - 键盘导航指南
   - ARIA 标签使用说明
3. 测试章节：
   - 如何运行单元测试
   - 如何运行 E2E 测试
   - 测试覆盖率要求
4. 更新技术栈列表（如果添加了新工具）
5. 更新功能特性列表

确保文档格式清晰，使用适当的 Markdown 语法。
```

**预期结果**: README 包含完整的性能优化和测试说明

---

### 步骤 22：创建示例博客文章

**文件路径**: `data/blog/examples/animation-showcase.mdx`

**AI 执行 Prompt**:
```
创建一个示例博客文章，展示所有动画组件和 UI 组件的使用方法。

创建文件：
1. data/blog/examples/animation-showcase.mdx：
   - 使用所有可用的动画组件（AnimatedSection, AnimatedList, FadeIn, SlideIn, ScaleIn, RotateIn, BounceIn）
   - 使用所有 Shadcn UI 组件（Button, Card, Badge, Tooltip, Separator, Dialog, Dropdown, Tabs, Accordion, Alert, Progress）
   - 展示最佳实践和常见用法
   - 包含代码示例和说明
2. 文章结构：
   - 标题和摘要
   - 动画组件展示
   - UI 组件展示
   - 组合使用示例
   - 性能注意事项
3. 确保文章内容有价值，不仅仅是组件展示
4. 使用适当的 Markdown 和 MDX 语法

注意：这个示例文章可以作为其他开发者的参考。
```

**预期结果**: 创建完整的示例博客文章

---

## 第九阶段：部署优化（中优先级）

### 阶段目标
- 优化静态导出
- 配置 CDN
- 添加监控
- 提升用户体验

### 步骤 23：优化静态导出配置

**文件路径**: `next.config.js`

**AI 执行 Prompt**:
```
优化 next.config.js 文件，提升静态导出的性能和兼容性。

修改要求：
1. 确保 output: 'export' 配置正确
2. 添加图片优化配置（如果需要）：
   ```javascript
   images: {
     unoptimized: true, // 静态导出需要
   }
   ```
3. 添加压缩配置：
   ```javascript
   compress: true,
   ```
4. 添加生产环境优化：
   ```javascript
   productionBrowserSourceMaps: false, // 减小 Bundle 大小
   ```
5. 验证配置：
   - 运行构建命令验证配置正确
   - 检查 out/ 目录结构
   - 测试静态文件是否正常
```

**预期结果**: 静态导出配置优化完成

---

### 步骤 24：添加性能监控

**文件路径**: `app/layout.tsx` 或新建 `lib/analytics.ts`

**AI 执行 Prompt**:
```
为项目添加性能监控功能，跟踪 Core Web Vitals 和其他性能指标。

实现要求：
1. 创建 lib/analytics.ts 文件：
   - 使用 Web Vitals 库（如果未安装，需要先安装：yarn add web-vitals）
   - 跟踪以下指标：
     - LCP (Largest Contentful Paint)
     - FID (First Input Delay)
     - CLS (Cumulative Layout Shift)
     - FCP (First Contentful Paint)
     - TTFB (Time to First Byte)
   - 将指标发送到分析服务（Google Analytics, Plausible 等）
2. 在 app/layout.tsx 中：
   - 导入并调用性能监控函数
   - 确保只在客户端执行
3. 可选：添加错误监控（Sentry 等）
4. 确保符合隐私政策（GDPR 等）

注意：如果项目已有分析服务（如 Pliny），可以集成到现有服务中。
```

**预期结果**: 性能监控功能添加完成

---

### 步骤 25：创建部署检查清单

**文件路径**: `docs/deployment-checklist.md`

**AI 执行 Prompt**:
```
创建部署检查清单文档，确保部署前所有事项都已完成。

创建文件：
1. docs/deployment-checklist.md：
   - 构建验证清单
   - 功能测试清单
   - 性能检查清单
   - SEO 检查清单
   - 安全检查清单
   - 可访问性检查清单
2. 每个清单项包含：
   - 检查项描述
   - 验证方法
   - 通过标准
3. 使用 Markdown 格式，可以使用复选框
4. 确保清单全面且实用

示例格式：
```markdown
## 构建验证
- [ ] 运行 `yarn build` 成功
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 错误
- [ ] Bundle 大小在预算内
...
```
```

**预期结果**: 创建完整的部署检查清单

---

## 第十阶段：SEO 优化（低优先级）

### 阶段目标
- 添加结构化数据
- 优化元数据
- 提升搜索引擎排名

### 步骤 26：添加 JSON-LD 结构化数据

**文件路径**: `app/blog/[...slug]/page.tsx`, `lib/structured-data.ts`

**AI 执行 Prompt**:
```
为博客文章添加 JSON-LD 结构化数据，提升 SEO。

实现要求：
1. 创建 lib/structured-data.ts 文件：
   - 创建函数生成文章的 JSON-LD 数据（Article schema）
   - 创建函数生成网站的 JSON-LD 数据（WebSite schema）
   - 创建函数生成作者的 JSON-LD 数据（Person schema）
2. 在 app/blog/[...slug]/page.tsx 中：
   - 导入结构化数据函数
   - 为每篇文章生成 JSON-LD
   - 使用 Next.js 的 Script 组件添加 JSON-LD
3. 在 app/layout.tsx 中：
   - 添加网站的 JSON-LD 数据
4. 验证：
   - 使用 Google Rich Results Test 验证结构化数据
   - 确保所有必需字段都包含

注意：参考 Schema.org 的 Article 和 WebSite 规范。
```

**预期结果**: 博客文章包含有效的 JSON-LD 结构化数据

---

### 步骤 27：优化元数据

**文件路径**: `app/blog/[...slug]/page.tsx`, `app/layout.tsx`

**AI 执行 Prompt**:
```
优化所有页面的元数据，提升 SEO 和社交媒体分享效果。

修改要求：
1. 在 app/blog/[...slug]/page.tsx 中：
   - 确保所有文章都有完整的 metadata
   - 添加 Open Graph 标签
   - 添加 Twitter Card 标签
   - 添加 canonical URL
   - 确保图片 URL 是绝对路径
2. 在 app/layout.tsx 中：
   - 添加默认的 Open Graph 标签
   - 添加默认的 Twitter Card 标签
   - 确保所有页面都有基本的元数据
3. 验证：
   - 使用 Facebook Sharing Debugger 验证 Open Graph
   - 使用 Twitter Card Validator 验证 Twitter Card
   - 检查所有页面的元数据是否完整

注意：确保元数据与内容一致，避免误导。
```

**预期结果**: 所有页面都有完整且优化的元数据

---

## 实施优先级总结

### 高优先级（立即执行）
1. 步骤 1-2: 优化 experiment 页面代码分割
2. 步骤 3-4: 优化动画性能
3. 步骤 13: 添加 prefers-reduced-motion 支持
4. 步骤 14-15: 优化可访问性

### 中优先级（近期执行）
1. 步骤 6-12: 功能扩展
2. 步骤 16-19: 测试与质量保证
3. 步骤 20-22: 文档完善
4. 步骤 23-25: 部署优化

### 低优先级（长期规划）
1. 步骤 26-27: SEO 优化

---

## 任务进度

### 待执行步骤
- [x] 步骤 1: 优化 experiment 页面代码分割 ✅
- [x] 步骤 2: 创建 ThreeJSViewer 组件 ✅
- [x] 步骤 3: 优化动画性能 - 添加 will-change 属性 ✅
- [x] 步骤 4: 优化 Intersection Observer 配置 ✅
- [x] 步骤 5: 移动设备动画优化 ✅
- [x] 步骤 6: 创建 RotateIn 动画组件 ✅
- [x] 步骤 7: 创建 BounceIn 动画组件 ✅
- [x] 步骤 8: 更新 MDXComponents 添加新动画组件 ✅
- [x] 步骤 9: 添加更多 Shadcn UI 组件 ✅
- [x] 步骤 10: 创建滚动进度指示器组件 ✅
- [x] 步骤 11: 创建返回顶部按钮组件 ✅
- [ ] 步骤 12: 实现页面过渡动画
- [ ] 步骤 13: 添加 prefers-reduced-motion 支持
- [ ] 步骤 14: 优化键盘导航
- [ ] 步骤 15: 添加 ARIA 标签
- [ ] 步骤 16: 设置测试环境
- [ ] 步骤 17: 为动画组件添加单元测试
- [ ] 步骤 18: 设置 E2E 测试环境
- [ ] 步骤 19: 创建 E2E 测试用例
- [ ] 步骤 20: 创建组件文档页面
- [ ] 步骤 21: 更新 README 添加性能优化说明
- [ ] 步骤 22: 创建示例博客文章
- [ ] 步骤 23: 优化静态导出配置
- [ ] 步骤 24: 添加性能监控
- [ ] 步骤 25: 创建部署检查清单
- [ ] 步骤 26: 添加 JSON-LD 结构化数据
- [ ] 步骤 27: 优化元数据

---

## 最终审查

待所有步骤完成后，将进行最终审查，包括：
- 功能完整性检查
- 性能指标验证
- 代码质量审查
- 文档完整性检查
- 部署准备检查

---

**最后更新**: 2025-11-24

---

## 第四阶段执行记录

**[2025-11-24] 第四阶段：性能优化 - 部分完成**

**已完成的步骤**：
1. ✅ 步骤 1: 优化 experiment 页面代码分割
   - 创建了 `components/ThreeJSViewer.tsx` 组件
   - 使用 `dynamic` 导入 ThreeJSViewer 和 ParticleBackground
   - **结果**：experiment 页面 Bundle 大小从 186 kB + 328 kB 减少到 28.8 kB + 171 kB（显著优化）

2. ✅ 步骤 2: 创建 ThreeJSViewer 组件
   - 将 Three.js 相关代码从 experiment 页面分离
   - 支持动态导入，按需加载
   - 保持所有原有功能（URDF 加载、轨道控制、光照等）

3. ✅ 步骤 3: 优化动画性能 - 添加 will-change 属性
   - 在 AnimatedSection 组件中添加 `will-change: transform, opacity`
   - 动画完成后自动移除 will-change 以释放 GPU 资源
   - 提升动画性能，启用 GPU 加速

4. ✅ 步骤 4: 优化 Intersection Observer 配置
   - 根据动画方向动态设置 rootMargin
   - 提前 50px 触发动画，提供更好的视觉体验
   - 优化动画触发时机

5. ✅ 步骤 5: 移动设备动画优化
   - 创建 `lib/utils/device.ts` 设备检测工具
   - AnimatedSection: 移动设备使用较小的 translate 距离和更短的动画时长
   - FadeIn, SlideIn, ScaleIn: 移动设备缩短动画时长
   - ParticleBackground: 移动设备减少粒子数量和速度
   - 更新 tsconfig.json 和 jsconfig.json 添加 `@/lib/*` 路径映射

**修改的文件**：
- `components/ThreeJSViewer.tsx` (新建)
- `app/experiment/page.tsx` (修改，使用动态导入)
- `components/AnimatedSection.tsx` (修改，添加 will-change 和移动设备优化)
- `components/animations/FadeIn.tsx` (修改，添加移动设备优化)
- `components/animations/SlideIn.tsx` (修改，添加移动设备优化)
- `components/animations/ScaleIn.tsx` (修改，添加移动设备优化)
- `components/ParticleBackground.tsx` (修改，添加移动设备优化)
- `lib/utils/device.ts` (新建)
- `tsconfig.json` (修改，添加路径映射)
- `jsconfig.json` (修改，添加路径映射)

**构建结果**：
- ✅ 构建成功
- ✅ 无编译错误
- ✅ TypeScript 类型检查通过
- ✅ experiment 页面 Bundle 大小显著减小

**性能改进**：
- experiment 页面初始 Bundle: 从 328 kB 减少到 171 kB（减少 ~48%）
- Three.js 代码按需加载，不影响其他页面
- 移动设备动画性能提升
- GPU 加速优化

**下一步**：
- 继续执行第五阶段：功能扩展（中优先级）

---

**[2025-01-XX] 第五阶段：功能扩展 - 部分完成**

**已完成的步骤**：
6. ✅ 步骤 6: 创建 RotateIn 动画组件
   - 创建了 `components/animations/RotateIn.tsx` 组件
   - 支持旋转角度配置（默认 180 度）
   - 支持移动设备优化
   - 支持 `whileInView` 模式

7. ✅ 步骤 7: 创建 BounceIn 动画组件
   - 创建了 `components/animations/BounceIn.tsx` 组件
   - 使用 Framer Motion 的 spring 动画类型实现弹跳效果
   - 支持移动设备优化
   - 支持 `whileInView` 模式

8. ✅ 步骤 8: 更新 MDXComponents 添加新动画组件
   - 在 `components/MDXComponents.tsx` 中添加了 RotateIn 和 BounceIn 组件映射
   - 新组件现在可以在 MDX 文件中使用

9. ✅ 步骤 9: 添加更多 Shadcn UI 组件
   - 添加了 Dialog 组件
   - 添加了 DropdownMenu 组件
   - 添加了 Tabs 组件
   - 添加了 Accordion 组件
   - 添加了 Alert 组件
   - 添加了 Progress 组件
   - 在 `app/experiment/page.tsx` 中添加了所有新组件的使用示例
   - 修复了 Alert 组件的 ESLint 错误

10. ✅ 步骤 10: 创建滚动进度指示器组件
    - 创建了 `components/ScrollProgress.tsx` 组件
    - 使用 `requestAnimationFrame` 优化性能
    - 支持自定义高度、颜色和位置
    - 支持深色/浅色主题自动适配
    - 添加了 ARIA 标签以提升可访问性

11. ✅ 步骤 11: 创建返回顶部按钮组件
    - 创建了 `components/BackToTop.tsx` 组件
    - 使用 lucide-react 的 ArrowUp 图标
    - 支持自定义阈值和显示位置
    - 支持平滑滚动
    - 使用 `requestAnimationFrame` 优化性能

**修改的文件**：
- `components/animations/RotateIn.tsx` (新建)
- `components/animations/BounceIn.tsx` (新建)
- `components/MDXComponents.tsx` (修改，添加新动画组件映射)
- `components/components/ui/dialog.tsx` (新建)
- `components/components/ui/dropdown-menu.tsx` (新建)
- `components/components/ui/tabs.tsx` (新建)
- `components/components/ui/accordion.tsx` (新建)
- `components/components/ui/alert.tsx` (新建，修复 ESLint 错误)
- `components/components/ui/progress.tsx` (新建)
- `app/experiment/page.tsx` (修改，添加新组件示例)
- `components/ScrollProgress.tsx` (新建)
- `components/BackToTop.tsx` (新建)

**构建结果**：
- ✅ 构建成功
- ✅ 无编译错误
- ✅ TypeScript 类型检查通过
- ✅ ESLint 检查通过

**下一步**：
- 继续执行第六阶段：可访问性增强（中优先级）

