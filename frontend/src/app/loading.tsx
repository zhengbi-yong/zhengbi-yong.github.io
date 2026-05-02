import { Spinner } from '@/components/loaders'

/**
 * Next.js 全局 loading.tsx
 * 当页面加载时自动显示此组件
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-lg font-medium text-foreground dark:text-foreground">加载中...</p>
      </div>
    </div>
  )
}
