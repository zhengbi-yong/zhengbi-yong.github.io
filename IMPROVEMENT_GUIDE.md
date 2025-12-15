# 博客改进执行手册

本文档为博客项目的改进计划提供详细的执行步骤，按照优先级和难度进行组织。

## 📋 执行前准备

### 1. 创建分支

```bash
git checkout -b feature/blog-improvements
```

### 2. 创建改进跟踪 Issue

在 GitHub 中创建一个 Issue，链接到此文档，用于跟踪进度。

---

## Phase 1: 基础设施与代码质量 (高优先级)

### 1.1 添加测试框架 ⭐⭐⭐

#### 步骤 1: 安装测试依赖

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
pnpm add -D @vitejs/plugin-react @vitest/coverage-v8
```

#### 步骤 2: 创建测试配置文件

创建 `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@/components': resolve(__dirname, './components'),
      '@/lib': resolve(__dirname, './lib'),
      '@/data': resolve(__dirname, './data'),
    },
  },
})
```

#### 步骤 3: 创建测试设置文件

创建 `test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'

// 可选：添加全局测试工具
```

#### 步骤 4: 更新 package.json 脚本

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

#### 步骤 5: 创建第一个测试

创建 `test/components/Header.test.tsx` 作为示例。

#### 步骤 6: 更新 CI/CD

在 `.github/workflows/ci.yml` 中添加测试步骤：

```yaml
- name: Run tests
  run: pnpm test
```

### 1.2 组件拆分优化 ⭐⭐

#### 步骤 1: 识别大组件

- 使用 VS Code 的扩展或工具分析组件大小
- 重点关注：`PostLayout.tsx`, `PostSimple.tsx`, `PostBanner.tsx`

#### 步骤 2: 拆分 PostLayout 组件

创建以下新组件：

- `components/blog/TableOfContents.tsx`
- `components/blog/ArticleMeta.tsx`
- `components/blog/ArticleNavigation.tsx`
- `components/blog/CommentSection.tsx`

#### 步骤 3: 逐步迁移和重构

1. 创建新组件文件
2. 移动相关代码
3. 更新导入和使用
4. 运行测试确保功能正常

#### 步骤 4: 重复过程

对其他大组件重复此过程。

---

## Phase 2: 安全性与性能 (高优先级)

### 2.1 依赖安全扫描 ⭐⭐⭐

#### 步骤 1: 更新 CI/CD

在 `.github/workflows/ci.yml` 中添加：

```yaml
- name: Audit dependencies
  run: pnpm audit --audit-level moderate

- name: Check for outdated packages
  run: pnpm outdated --format list
```

#### 步骤 2: 设置 Dependabot

创建 `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    reviewers:
      - 'your-username'
    assignees:
      - 'your-username'
```

### 2.2 Bundle 分析与优化 ⭐⭐

#### 步骤 1: 设置定期分析

创建脚本 `scripts/analyze-bundle.sh`:

```bash
#!/bin/bash
echo "Analyzing bundle size..."
pnpm analyze
```

#### 步骤 2: 实施动态导入

更新 `components/LazyLoadedComponents.tsx`:

```typescript
// 示例：动态加载 3D 组件
const ThreeDViewer = dynamic(() => import('@/components/ThreeDViewer'), {
  loading: () => <div className="animate-pulse">Loading 3D view...</div>,
})
```

#### 步骤 3: 创建 Bundle Budget

在 `next.config.js` 中添加：

```javascript
experimental: {
  webpackBundleAnalyzer: {
    analyzerMode: 'static',
    openAnalyzer: false,
  },
}
```

### 2.3 CSP 优化 ⭐

#### 步骤 1: 分析当前 CSP 使用

运行 `pnpm dev` 并检查控制台的 CSP 违规。

#### 步骤 2: 逐步移除 unsafe

1. 为内联脚本使用 nonce
2. 将内联样式移到 CSS 文件
3. 使用 hash 代替 unsafe-inline

#### 步骤 3: 测试 CSP 严格模式

创建 `scripts/test-csp.js` 来测试新的 CSP 配置。

---

## Phase 3: SEO 与可访问性 (中优先级)

### 3.1 结构化数据 ⭐⭐

#### 步骤 1: 创建 schema 组件

创建 `components/seo/JsonLd.tsx`:

```typescript
interface JsonLdProps {
  data: Record<string, any>
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
```

#### 步骤 2: 添加文章 Schema

在 `layouts/PostLayout.tsx` 中添加：

```typescript
import JsonLd from '@/components/seo/JsonLd'

// 在组件中生成 schema
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: frontMatter.title,
  // ... 其他属性
}
```

### 3.2 无障碍访问改进 ⭐⭐

#### 步骤 1: 安装 a11y 检查工具

```bash
pnpm add -D @axe-core/react
```

#### 步骤 2: 添加 a11y 测试

创建 `test/accessibility/a11y.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('should not have accessibility violations', async () => {
  const { container } = render(<YourComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

#### 步骤 3: 改进键盘导航

1. 确保所有交互元素可通过 Tab 访问
2. 添加焦点管理
3. 实现跳过链接（Skip to main content）

---

## Phase 4: 性能与用户体验 (中优先级)

### 4.1 图片优化策略 ⭐⭐

#### 步骤 1: 选择图片优化服务

- 选项 1: Cloudinary
- 选项 2: ImageKit
- 选项 3: 自建图片处理服务

#### 步骤 2: 创建图片组件

创建 `components/OptimizedImage.tsx`:

```typescript
interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
}

export default function OptimimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
}: OptimizedImageProps) {
  // 实现图片优化逻辑
}
```

#### 步骤 3: 实现渐进式加载

1. 添加加载占位符
2. 实现模糊到清晰效果
3. 添加懒加载

### 4.2 PWA 功能完善 ⭐

#### 步骤 1: 更新 Service Worker

更新 `public/sw.js`:

```javascript
const CACHE_NAME = 'blog-v1'
const urlsToCache = ['/', '/static/css/main.css', '/static/js/main.js']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})
```

#### 步骤 2: 完善 App Manifest

更新 `public/manifest.json`:

```json
{
  "name": "Zhengbi Yong's Blog",
  "short_name": "ZY Blog",
  "description": "Personal blog about technology and more",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait"
}
```

---

## Phase 5: 高级功能 (低优先级)

### 5.1 错误监控 ⭐

#### 步骤 1: 集成 Sentry

```bash
pnpm add @sentry/nextjs
```

#### 步骤 2: 配置 Sentry

创建 `sentry.client.config.ts` 和 `sentry.server.config.ts`

#### 步骤 3: 添加错误边界

更新 `components/ErrorBoundary.tsx` 以发送错误到 Sentry。

### 5.2 多语言支持 ⭐

#### 步骤 1: 安装 i18n 库

```bash
pnpm add next-i18next
```

#### 步骤 2: 配置语言文件

创建 `locales/` 目录结构和翻译文件。

#### 步骤 3: 更新组件支持多语言

修改组件以使用翻译功能。

---

## Phase 6: 开发者体验 (持续改进)

### 6.1 文档完善

#### 步骤 1: 创建组件文档

1. 安装 Storybook：
   ```bash
   npx storybook@latest init
   ```

#### 步骤 2: 编写使用指南

创建 `docs/` 目录并添加：

- 组件使用指南
- 贡献指南（CONTRIBUTING.md）
- 架构说明（ARCHITECTURE.md）

### 6.2 开发工具优化

#### 步骤 1: 配置 VS Code 工作区

创建 `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

#### 步骤 2: 添加调试配置

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"]
    }
  ]
}
```

---

## 执行建议

### 1. 时间规划

- **Phase 1-2**: 1-2 周（必须完成）
- **Phase 3-4**: 2-3 周（建议完成）
- **Phase 5-6**: 持续进行（可选）

### 2. 测试策略

每个阶段完成后：

1. 运行完整测试套件
2. 手动测试关键功能
3. 性能测试（Lighthouse）
4. 在 Preview 环境中验证

### 3. 发布策略

- 每个 Phase 创建一个 PR
- 使用 Draft PR 进行讨论
- 合并前进行代码审查
- 使用 Feature Flag 控制新功能发布

### 4. 监控指标

改进后需要跟踪的指标：

- Core Web Vitals
- Bundle 大小
- 测试覆盖率
- 错误率
- 页面加载速度

### 5. 回滚计划

每个重要更改都应该：

1. 有回滚方案
2. 保留原代码备份
3. 监控发布后的指标
4. 准备快速回滚流程

---

## 注意事项

1. **渐进式改进**：不要一次性进行所有更改，分阶段实施。
2. **向后兼容**：确保更改不会破坏现有功能。
3. **性能监控**：每次更改后都要检查性能影响。
4. **文档同步**：代码更改后及时更新文档。
5. **定期审查**：每季度审查和更新此改进计划。

---

## 资源链接

- [Next.js 性能优化指南](https://nextjs.org/docs/going-to-production)
- [Web.dev 性能指南](https://web.dev/performance)
- [React Testing 文档](https://testing-library.com/docs/react-testing-library/intro)
- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

最后更新：2025-01-15
版本：1.0
