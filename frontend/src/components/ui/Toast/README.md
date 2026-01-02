# Toast 通知系统使用指南

## 概述

Toast 通知系统提供了一种优雅的方式向用户显示即时反馈消息。

## 文件结构

```
components/ui/
├── Toast.tsx              # 单个 Toast 通知组件
├── Toaster.tsx            # Toast 容器组件
└── Toast/
    └── README.md          # 本文档

lib/store/
└── toast-store.ts         # Zustand store 状态管理
```

## 基本使用

### 1. 使用 Hook（推荐）

```typescript
'use client'

import { useToast } from '@/lib/store/toast-store'

export function MyComponent() {
  const toast = useToast()

  const handleSuccess = () => {
    toast.success('操作成功', '您的更改已保存')
  }

  const handleError = () => {
    toast.error('操作失败', '请稍后重试')
  }

  return (
    <div>
      <button onClick={handleSuccess}>显示成功通知</button>
      <button onClick={handleError}>显示错误通知</button>
    </div>
  )
}
```

### 2. 直接使用 Store

```typescript
'use client'

import { useToastStore } from '@/lib/store/toast-store'

export function MyComponent() {
  const { addToast } = useToastStore()

  const handleClick = () => {
    addToast({
      title: '自定义通知',
      description: '这是一条自定义消息',
      variant: 'info',
      duration: 3000, // 3 秒后自动消失
    })
  }

  return <button onClick={handleClick}>显示通知</button>
}
```

## 可用方法

### useToast Hook

| 方法 | 参数 | 说明 |
|------|------|------|
| `success(title, description?)` | 标题, 描述 | 显示成功通知（绿色，5 秒） |
| `error(title, description?)` | 标题, 描述 | 显示错误通知（红色，7 秒） |
| `warning(title, description?)` | 标题, 描述 | 显示警告通知（黄色，6 秒） |
| `info(title, description?)` | 标题, 描述 | 显示信息通知（蓝色，5 秒） |
| `addToast(toast)` | Toast 对象 | 添加自定义通知 |
| `removeToast(id)` | ID | 手动移除通知 |
| `clearAll()` | - | 清除所有通知 |

### Toast 对象

```typescript
interface Toast {
  id: string              // 自动生成
  title: string           // 通知标题
  description?: string    // 可选描述
  variant: ToastVariant   // success | error | warning | info
  duration?: number       // 自动消失时间（毫秒）
  action?: {              // 可选操作按钮
    label: string
    onClick: () => void
  }
}
```

## 高级用法

### 带操作按钮的通知

```typescript
const { addToast } = useToastStore()

addToast({
  title: '删除成功',
  description: '文件已删除',
  variant: 'success',
  action: {
    label: '撤销',
    onClick: () => {
      // 撤销删除逻辑
      console.log('撤销删除')
    },
  },
})
```

### 自定义持续时间

```typescript
const toast = useToast()

// 显示 10 秒
toast.addToast({
  title: '重要通知',
  description: '此通知将显示 10 秒',
  variant: 'warning',
  duration: 10000,
})
```

### 手动移除通知

```typescript
const { addToast, removeToast } = useToastStore()

const toastId = addToast({
  title: '可手动关闭',
  description: '点击关闭按钮或自动消失',
  variant: 'info',
})

// 3 秒后手动移除
setTimeout(() => {
  removeToast(toastId)
}, 3000)
```

## 样式定制

Toast 组件使用 Tailwind CSS 类，可以通过修改 `Toast.tsx` 中的 `toastVariants` 对象来定制样式：

```typescript
// components/ui/Toast.tsx
const toastVariants = {
  success: {
    container: 'border-l-4 border-green-500 bg-white dark:bg-gray-800',
    icon: 'text-green-500',
    title: 'text-gray-900 dark:text-gray-100',
  },
  // ... 其他变体
}
```

## 动画

Toast 使用 CSS 动画实现滑入/滑出效果。动画定义在 `css/tailwind.css` 中：

```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

## 无障碍支持

- Toast 容器使用 `role="region"` 和 `aria-label="通知区域"`
- 每个 Toast 使用 `role="alert"` 和 `aria-live="polite"`
- 关闭按钮有 `aria-label="关闭通知"`

## 集成到应用

Toaster 组件已在 `app/layout.tsx` 中集成：

```tsx
import { Toaster } from '@/components/ui/Toaster'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />  {/* Toast 容器 */}
      </body>
    </html>
  )
}
```

## 示例场景

### 表单提交成功

```typescript
const handleSubmit = async (data: FormData) => {
  try {
    await api.submitForm(data)
    toast.success('提交成功', '我们已收到您的表单')
  } catch (error) {
    toast.error('提交失败', error.message)
  }
}
```

### 复制到剪贴板

```typescript
const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('已复制', '内容已复制到剪贴板')
  } catch (error) {
    toast.error('复制失败', '请手动复制')
  }
}
```

### 网络错误处理

```typescript
const fetchData = async () => {
  try {
    const response = await api.getData()
    return response
  } catch (error) {
    if (error instanceof NetworkError) {
      toast.error('网络错误', '请检查您的网络连接')
    } else {
      toast.error('加载失败', '请稍后重试')
    }
  }
}
```

## 最佳实践

1. **简洁明了**：标题应该简短，描述可以更详细
2. **及时反馈**：在用户操作后立即显示通知
3. **合理持续时间**：
   - 成功：5 秒（默认）
   - 信息：5 秒（默认）
   - 警告：6 秒（默认）
   - 错误：7 秒（默认）
4. **避免滥用**：不要同时显示太多通知（最多 3-4 个）
5. **提供操作**：对于重要操作，提供撤销或重试按钮

## 故障排除

### Toast 不显示

1. 确认 `<Toaster />` 已在 `app/layout.tsx` 中添加
2. 检查 z-index 是否被其他元素覆盖（Toast 使用 `z-[9999]`）
3. 打开浏览器控制台查看错误

### 样式问题

1. 确认 `css/tailwind.css` 已正确导入
2. 检查 Tailwind CSS 配置
3. 验证设计令牌系统是否正常工作

## 相关文档

- [Zustand 文档](https://zustand-demo.pmnd.rs/)
- [ARIA Alert 角色](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)
- [设计令牌系统](../../styles/tokens/README.md)
