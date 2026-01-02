'use client'

import { useToastStore } from '@/lib/store/toast-store'
import Toast from './Toast'

/**
 * Toaster 组件
 * 全局 Toast 通知容器，显示所有活跃的 Toast
 *
 * 使用方法：
 * 1. 在 app/layout.tsx 中引入此组件
 * 2. 确保在 body 标签内渲染
 *
 * @example
 * import { Toaster } from '@/components/ui/Toaster'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster />
 *       </body>
 *     </html>
 *   )
 * }
 */
export function Toaster() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      className="
        fixed top-4 right-4 z-[9999]
        flex flex-col gap-3
        w-full max-w-md
        px-4 sm:px-0
        pointer-events-none
      "
      aria-live="polite"
      aria-atomic="true"
      role="region"
      aria-label="通知区域"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
          style={{
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <Toast toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  )
}

/**
 * 简化版 Toaster（无动画）
 * 用于不需要动画的场景
 */
export function ToasterSimple() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      className="
        fixed top-4 right-4 z-[9999]
        flex flex-col gap-3
        w-full max-w-md
        px-4 sm:px-0
      "
      aria-live="polite"
      aria-atomic="true"
      role="region"
      aria-label="通知区域"
    >
      {toasts.map((toast) => (
        <div key={toast.id}>
          <Toast toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  )
}

export default Toaster
