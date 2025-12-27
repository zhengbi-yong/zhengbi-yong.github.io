# Frontend Testing Guide

本文档说明前端测试的完整策略，包括单元测试、集成测试、可访问性测试和错误处理测试。

## 目录

- [测试策略](#测试策略)
- [单元测试](#单元测试)
- [集成测试](#集成测试)
- [可访问性测试](#可访问性测试)
- [错误处理测试](#错误处理测试)
- [性能测试](#性能测试)
- [测试工具](#测试工具)
- [CI/CD 集成](#cicd-集成)
- [测试结果](#测试结果)

---

## 测试策略

### 测试金字塔

```
         /\
        /E2E\        少量端到端测试
       /------\
      /  集成  \     适量集成测试
     /----------\
    /   单元测试  \   大量单元测试
   /--------------\
```

**覆盖率目标**:
- **单元测试**: >80% 代码覆盖率
- **集成测试**: 100% 关键流程覆盖
- **E2E 测试**: 100% 主要用户路径覆盖
- **可访问性**: 100% WCAG 2.1 AA 合规

---

## 单元测试

### Vitest 配置

**文件**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

---

### 组件测试

#### 测试 React 组件

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const handleClick = vi.fn()
    render(<MyComponent onClick={handleClick} />)

    const button = screen.getByRole('button')
    button.click()

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<MyComponent loading />)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
  })
})
```

---

### Hook 测试

#### 测试自定义 Hooks

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useCustomHook } from '@/hooks/useCustomHook'

describe('useCustomHook', () => {
  it('initial state is correct', () => {
    const { result } = renderHook(() => useCustomHook())
    expect(result.current.state).toBe('initial')
  })

  it('updates state on action', async () => {
    const { result } = renderHook(() => useCustomHook())

    await act(async () => {
      result.current.updateState('new value')
    })

    expect(result.current.state).toBe('new value')
  })
})
```

---

### 工具函数测试

```typescript
import { describe, it, expect } from 'vitest'
import { formatDate, calculateAge } from '@/lib/utils'

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-12-27')
    expect(formatDate(date)).toBe('2025-12-27')
  })

  it('handles invalid date', () => {
    expect(formatDate(null)).toBe('N/A')
  })
})
```

---

## 集成测试

### Refine 集成测试

**测试统计**: 52 个测试，100% 通过率 ✅

#### Data Provider 测试

**文件**: `tests/lib/providers/refine-data-provider.test.ts`

**测试内容** (17个测试):
- ✅ 列表查询（用户、评论、统计）
- ✅ 单个资源查询
- ✅ 创建资源
- ✅ 更新资源（包括特殊端点）
- ✅ 删除资源
- ✅ 自定义请求
- ✅ 错误处理

```typescript
describe('Refine Data Provider', () => {
  it('should get list of users', async () => {
    const data = await dataProvider.getList('admin/users', {
      pagination: { current: 1, pageSize: 20 },
    })
    expect(data.data).toHaveLength(20)
  })

  it('should create a new user', async () => {
    const user = await dataProvider.create('admin/users', {
      variables: {
        email: 'test@example.com',
        password: 'TestPassword123!',
      },
    })
    expect(user.data.email).toBe('test@example.com')
  })
})
```

#### Auth Provider 测试

**文件**: `tests/lib/providers/refine-auth-provider.test.ts`

**测试内容** (15个测试):
- ✅ 登录功能（成功/失败）
- ✅ 登出功能（成功/失败）
- ✅ 认证检查（有 token/无 token/刷新 token）
- ✅ Token 刷新失败场景
- ✅ 获取用户身份
- ✅ 注册功能
- ✅ 错误处理

```typescript
describe('Refine Auth Provider', () => {
  it('should login successfully', async () => {
    const response = await authProvider.login({
      email: 'user@example.com',
      password: 'password',
    })
    expect(response.success).toBe(true)
  })

  it('should fail with wrong password', async () => {
    await expect(
      authProvider.login({
        email: 'user@example.com',
        password: 'wrong',
      })
    ).rejects.toThrow('Invalid credentials')
  })
})
```

#### 页面组件测试

**用户管理页面** (8个测试):
- ✅ 加载状态渲染
- ✅ 用户列表渲染
- ✅ 错误状态渲染
- ✅ 搜索功能
- ✅ 角色更改
- ✅ 删除用户
- ✅ 分页功能
- ✅ 统计卡片显示

**评论管理页面** (7个测试):
- ✅ 加载状态渲染
- ✅ 评论列表渲染
- ✅ 错误状态渲染
- ✅ 状态筛选
- ✅ 状态更改
- ✅ 删除评论
- ✅ 状态徽章显示

**仪表板页面** (5个测试):
- ✅ 加载状态渲染
- ✅ 统计数据渲染
- ✅ 错误状态渲染
- ✅ 所有统计卡片显示
- ✅ 快速操作链接显示

---

### Mock 策略

#### API Mock

```typescript
import { vi } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('@/lib/api/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// 使用 mock
import { api } from '@/lib/api/apiClient'

api.get.mockResolvedValue({ data: { users: [] } })
```

#### Refine Hooks Mock

```typescript
vi.mock('@refinedev/core', () => ({
  useList: vi.fn(() => ({
    data: { data: [] },
    isLoading: false,
    error: null,
  })),
  useUpdate: vi.fn(() => ({
    mutate: vi.fn(),
  })),
  useDelete: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}))
```

#### localStorage Mock

```typescript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

global.localStorage = localStorageMock as Storage
```

---

## 可访问性测试

### WCAG 2.1 AA 合规性

本项目遵循 **WCAG 2.1 AA** 标准，确保为所有用户提供优质的访问体验。

### 四大原则

#### 1. 可感知性 (Perceivable)

- ✅ **文本替代**: 所有图片都有 alt 文本
- ✅ **时基媒体**: 提供字幕和替代内容
- ✅ **适应性**: 内容可以不同方式呈现
- ✅ **可辨别性**: 前景和背景对比度足够

#### 2. 可操作性 (Operable)

- ✅ **键盘可访问**: 所有功能可通过键盘操作
- ✅ **充足时间**: 用户提供足够时间
- ✅ **癫痫和身体反应**: 没有闪烁内容
- ✅ **导航性**: 提供导航辅助

#### 3. 可理解性 (Understandable)

- ✅ **可读性**: 文本内容可读可理解
- ✅ **可预测性**: UI 行为可预测
- ✅ **输入辅助**: 帮助用户避免和纠正错误

#### 4. 稳健性 (Robust)

- ✅ **兼容性**: 与辅助技术兼容

---

### 键盘导航

#### Tab 顺序

所有交互元素都遵循自然的 Tab 顺序：

```tsx
// ✅ 正确的 Tab 顺序
<button>Button 1</button>
<input type="text" />
<button>Button 2</button>

// ❌ 错误：使用 tabindex 重新排序
<button tabIndex={3}>Button 1</button>
<input tabIndex={1} type="text" />
<button tabIndex={2}>Button 2</button>
```

#### 键盘事件处理

```tsx
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  },
  []
)

// 使用示例
<DarkModeToggle
  onToggle={toggleTheme}
  onKeyDown={handleKeyDown}
/>
```

#### 跳过导航链接

```tsx
<SkipLink href="#main-content">跳到主要内容</SkipLink>

<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

---

### ARIA 标签

#### 语义化标签

```tsx
// 导航
<nav aria-label="主导航">
  <ul>
    <li><a href="/">首页</a></li>
    <li><a href="/blog">博客</a></li>
  </ul>
</nav>

// 搜索
<div role="search">
  <SearchButton aria-label="打开搜索" />
</div>

// 目录
<nav aria-label="文章目录">
  <TOCTree />
</nav>
```

#### 动态内容更新

```tsx
// Toast 通知
<div
  role="alert"
  aria-live="polite"
  aria-atomic="true"
>
  {toast.message}
</div>

// 加载状态
<div role="status" aria-live="polite">
  <span aria-hidden="true">⏳</span>
  <span>加载中...</span>
</div>
```

#### 状态指示

```tsx
// 展开状态
<button
  aria-expanded={isMobileMenuOpen}
  aria-controls="mobile-menu"
  aria-label="打开移动菜单"
>
  <Menu />
</button>

// 选中状态
<a
  href="#section1"
  aria-current={activeHeadingId === 'section1' ? 'location' : undefined}
>
  第一部分
</a>
```

---

### 颜色对比度

#### 对比度标准

- **正常文本**: 至少 4.5:1
- **大文本（18pt+ 或 14pt+ 粗体）**: 至少 3:1
- **UI 组件和图形对象**: 至少 3:1

#### 实现

```css
/* 浅色模式 */
--color-text-primary: #2D2926; /* 对比度 > 4.5:1 */
--color-bg-primary: #F5F3F0;

/* 深色模式 */
--color-text-primary: #E8E8E8; /* 对比度 > 4.5:1 */
--color-bg-primary: #1E3A5F;

/* 链接颜色 */
--color-link: #7c1823; /* 对比度 > 4.5:1 */
```

---

### 表单无障碍

#### 标签关联

```tsx
// ✅ 正确：label 关联
<label htmlFor="email-input">电子邮件</label>
<input
  id="email-input"
  type="email"
  name="email"
  required
/>

// ✅ 正确：aria-label
<input
  type="search"
  aria-label="搜索文章"
  placeholder="搜索..."
/>

// ❌ 错误：缺少标签
<input type="text" placeholder="输入邮箱" />
```

#### 错误提示

```tsx
<input
  id="password"
  type="password"
  aria-invalid={hasError}
  aria-describedby={hasError ? 'password-error' : undefined}
/>
{hasError && (
  <p id="password-error" role="alert" className="text-red-600">
    密码至少需要 12 个字符
  </p>
)}
```

---

### 焦点指示器

#### 可见焦点

```css
/* 焦点环 */
*:focus-visible {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* 移除默认轮廓但保留可访问性 */
*:focus:not(:focus-visible) {
  outline: none;
}
```

---

### 组件无障碍检查清单

#### 按钮

- [ ] 有 `type` 属性（`button`, `submit`, `reset`）
- [ ] 有文本标签或 `aria-label`
- [ ] 图标按钮有 `aria-label`
- [ ] 可通过键盘操作（Enter, Space）
- [ ] 有可见焦点指示器

```tsx
<button
  type="button"
  aria-label="关闭对话框"
  onClick={onClose}
>
  <X aria-hidden="true" />
</button>
```

#### 链接

- [ ] 有意义的链接文本
- [ ] 外部链接有明确指示
- [ ] 新窗口链接有 `aria-label`
- [ ] 可通过键盘操作（Enter）

```tsx
<a
  href="https://example.com"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="访问外部网站 example.com（在新窗口打开）"
>
  外部链接
</a>
```

#### 表单

- [ ] 所有输入有关联的 label
- [ ] 必填字段有 `required` 属性
- [ ] 错误消息有关联（`aria-describedby`）
- [ ] 验证错误有 `aria-invalid`
- [ ] 表单有提交按钮

#### 模态框

- [ ] 有 `role="dialog"` 或 `role="alertdialog"`
- [ ] 有 `aria-modal="true"`
- [ ] 有 `aria-labelledby` 和 `aria-describedby`
- [ ] 焦点被陷阱在模态框内
- [ ] 关闭时焦点返回触发元素
- [ ] ESC 键可关闭

---

### 无障碍测试

#### 自动化测试

```bash
# 使用 Lighthouse
npx lighthouse http://localhost:3000 --view

# 使用 axe DevTools
# 在浏览器中安装扩展程序

# 使用 pa11y
npx pa11y http://localhost:3000
```

#### 手动测试清单

**键盘导航**:
- [ ] 可以使用 Tab 键导航到所有交互元素
- [ ] Shift+Tab 反向导航正常工作
- [ ] Enter/Space 激活按钮和链接
- [ ] 箭头键在列表和菜单中工作
- [ ] Escape 键关闭模态框和下拉菜单
- [ ] 焦点指示器清晰可见

**屏幕阅读器**:
- [ ] NVDA（Windows）测试通过
- [ ] JAWS（Windows）测试通过
- [ ] VoiceOver（macOS/iOS）测试通过
- [ ] TalkBack（Android）测试通过
- [ ] 所有图像有适当的 alt 文本
- [ ] 表单字段有正确的标签
- [ ] 错误消息被朗读
- [ ] 动态内容变化被宣布

**对比度**:
- [ ] 所有文本对比度 ≥ 4.5:1
- [ ] 大文本对比度 ≥ 3:1
- [ ] UI 组件对比度 ≥ 3:1

**缩放**:
- [ ] 200% 缩放下内容可读
- [ ] 400% 缩放下内容可访问（支持重排）
- [ ] 文本大小调整不会破坏布局

---

## 错误处理测试

### 错误边界系统

错误边界是 React 组件，用于捕获子组件树中的 JavaScript 错误，记录错误，并显示备用 UI。

#### 文件结构

```
app/
├── error.tsx                         # 全局错误边界（根级别）
├── not-found.tsx                     # 全局 404 页面（根级别）
└── blog/
    ├── error.tsx                     # 博客列表页错误边界
    └── [...slug]/
        ├── error.tsx                 # 文章详情页错误边界
        └── not-found.tsx             # 文章 404 页面

components/
└── ErrorBoundary.tsx                 # 组件级错误边界
```

---

#### 错误边界层级

**1. 全局错误边界** (`app/error.tsx`)

**作用**: 捕获整个应用程序的错误

**何时触发**:
- 应用程序初始化失败
- 根布局组件错误
- 未被页面级错误边界捕获的错误

**特点**:
- 必须包装完整的 HTML 结构（`<html>` 和 `<body>`）
- 提供重试和刷新选项
- 显示详细的开发模式错误信息

**2. 页面级错误边界**

**博客列表页** (`app/blog/error.tsx`):
- 捕获博客数据加载失败
- BookShelfLayout 组件错误
- 博客卡片渲染错误

**文章详情页** (`app/blog/[...slug]/error.tsx`):
- 捕获文章数据加载失败
- Markdown 渲染错误
- 评论组件错误
- TOC 组件错误

**3. 404 页面** (`app/blog/[...slug]/not-found.tsx`)

**作用**: 处理不存在的文章

**功能**:
- 清晰的 404 图标和消息
- 建议操作列表
- 返回博客列表和首页的导航

**4. 组件级错误边界** (`components/ErrorBoundary.tsx`)

**使用场景**:
- 第三方组件集成
- 复杂的客户端功能
- 可能失败的异步操作

---

#### 使用方法

**自动错误处理**:

```tsx
// app/blog/page.tsx
export default async function BlogPage() {
  // 如果这里抛出错误，Next.js 会自动显示 app/blog/error.tsx
  const posts = await getPosts()
  return <BookShelfLayout posts={posts} />
}
```

**组件级错误边界**:

```tsx
'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function MyComponent() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong</div>}
      onError={(error, errorInfo) => {
        console.error('Custom error handler:', error)
      }}
    >
      <RiskyComponent />
    </ErrorBoundary>
  )
}
```

**编程式错误处理**:

```tsx
import { notFound } from 'next/navigation'

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  if (!post) {
    // 触发 not-found.tsx
    notFound()
  }

  return <PostLayout post={post} />
}
```

---

#### 错误边界特性

**开发模式详细信息**:

在开发模式下，错误边界会显示：
- 错误消息
- 错误堆栈
- Error ID（digest）

```tsx
{process.env.NODE_ENV === 'development' && (
  <div className="rounded-md bg-red-50 p-4">
    <p className="font-mono text-xs">{error.message}</p>
    {error.stack && <pre>{error.stack}</pre>}
  </div>
)}
```

**错误恢复**:

所有错误边界都提供重试功能：

```tsx
<button onClick={reset}>重试</button>
```

点击重试会：
1. 重置错误状态
2. 重新渲染组件
3. 重新尝试数据获取

**错误报告**:

错误边界集成 Sentry 进行错误报告：

```tsx
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  const eventId = Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  })
  this.setState({ eventId })
}
```

---

#### 错误边界不会捕获的场景

错误边界**不会**捕获以下错误：

1. **事件处理器**:
   ```tsx
   <button onClick={() => {
     throw new Error('This will not be caught') // ❌
   }}>
   ```

2. **异步代码**:
   ```tsx
   useEffect(() => {
     async function fetchData() {
       throw new Error('This will not be caught') // ❌
     }
     fetchData()
   }, [])
   ```

3. **服务器端错误**:
   - 使用 `not-found.tsx` 处理
   - 使用 API 路由错误处理

4. **错误边界本身**:
   - `error.tsx` 中的错误不会被捕获

---

#### 测试错误边界

**方法 1: 临时代码修改**

```tsx
export default function BlogPage() {
  // 临时：测试错误边界
  if (process.env.NODE_ENV === 'development') {
    throw new Error('Test error boundary')
  }

  return <BookShelfLayout posts={posts} />
}
```

**方法 2: 使用错误触发按钮**

```tsx
{process.env.NODE_ENV === 'development' && (
  <button onClick={() => {
    throw new Error('Test error')
  }}>
    测试错误边界
  </button>
)}
```

---

## 性能测试

### 压力测试

Refine 集成已完成全面的压力测试（26+ 个测试）：

**边界情况测试**:
- ✅ 超大页码（999999）
- ✅ 零页面大小
- ✅ 超大页面大小（10000）
- ✅ 空资源名和特殊字符
- ✅ 超长筛选值（10000 字符）
- ✅ null/undefined 筛选

**错误处理测试**:
- ✅ 网络超时
- ✅ 500 服务器错误
- ✅ 403 禁止访问
- ✅ 格式错误的响应
- ✅ 缺失字段
- ✅ 错误数据类型

**并发安全测试**:
- ✅ 并发创建（10 个）
- ✅ 并发更新（5 个）
- ✅ 并发删除（5 个）
- ✅ 并发查询（100 个）

**数据一致性测试**:
- ✅ 跨请求一致性
- ✅ 并发更新一致性
- ✅ 状态同步

**性能测试**:
- ✅ 快速连续请求（100+）
- ✅ 大数据集分页（1000+）
- ✅ 内存泄漏检测（1000+ 请求）
- ✅ 响应时间验证

**安全性测试**:
- ✅ XSS 防护
- ✅ SQL 注入防护
- ✅ 敏感信息保护

---

## 测试工具

### 测试框架

| 工具 | 用途 |
|------|------|
| **Vitest** | 单元测试框架 |
| **Testing Library** | React 组件测试 |
| **Playwright** | E2E 测试 |
| **MSW** | API Mock |

### 无障碍工具

| 工具 | 用途 |
|------|------|
| **Lighthouse** | 综合性能和无障碍评分 |
| **axe DevTools** | 详细的 WCAG 违规报告 |
| **WAVE** | 可视化无障碍问题 |
| **Colour Contrast Analyser** | 对比度检查 |
| **NVDA / JAWS** | Windows 屏幕阅读器 |
| **VoiceOver** | macOS/iOS 屏幕阅读器 |

---

## CI/CD 集成

### GitHub Actions 配置

```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: pnpm lint

      - name: Run unit tests
        run: pnpm test --run

      - name: Generate coverage
        run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

---

## 测试结果

### 最新测试统计

**单元测试**:
```
✅ 52 个 Refine 集成测试
✅ 100% 通过率
✅ >80% 代码覆盖率
```

**可访问性**:
```
✅ WCAG 2.1 AA 合规
✅ 键盘导航完整
✅ 屏幕阅读器兼容
✅ 颜色对比度符合标准
```

**性能测试**:
```
✅ 26+ 压力测试通过
✅ 无内存泄漏
✅ 并发安全
✅ 数据一致性保证
```

---

## 相关文档

- [Refine Integration Guide](./refine-integration.md) - Refine 框架集成指南
- [Backend Testing Guide](../backend/testing.md) - 后端测试指南
- [API Reference](../backend/api-reference.md) - API 文档
- [Best Practices](../best-practices.md) - 开发最佳实践

---

**最后更新**: 2025-12-27
**维护者**: Frontend Team
