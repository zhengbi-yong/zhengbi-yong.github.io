/**
 * Code Splitting Utilities - 代码分割工具
 *
 * 功能：
 * - 动态导入辅助函数
 * - 路由级别的代码分割
 * - 组件级别的代码分割
 * - 预加载策略
 */

import { lazy, ComponentType, Suspense } from 'react'
import dynamic from 'next/dynamic'

/**
 * 动态导入组件（带加载状态）
 */
export function dynamicImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    fallback?: React.ReactNode
    ssr?: boolean
  }
) {
  return dynamic(() => importFn(), {
    ssr: options?.ssr ?? false,
    loading: () => options?.fallback || <DefaultLoadingFallback />,
  })
}

/**
 * 默认加载回退组件
 */
function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  )
}

/**
 * 带超时的动态导入
 */
export function dynamicImportWithTimeout<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  timeout: number = 10000,
  options?: {
    fallback?: React.ReactNode
    ssr?: boolean
  }
) {
  return dynamic(
    () =>
      Promise.race([
        importFn(),
        new Promise<{ default: T }>((_, reject) =>
          setTimeout(() => reject(new Error(`Component load timeout after ${timeout}ms`)), timeout)
        ),
      ]),
    {
      ssr: options?.ssr ?? false,
      loading: () => options?.fallback || <DefaultLoadingFallback />,
    }
  )
}

/**
 * 预加载组件（不立即渲染）
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): () => void {
  let preloadPromise: Promise<void> | null = null

  return () => {
    if (!preloadPromise) {
      preloadPromise = importFn().then(() => {
        console.log('Component preloaded')
      })
    }
    return preloadPromise
  }
}

/**
 * 条件渲染组件（仅在满足条件时加载）
 */
export function conditionalImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  condition: boolean
) {
  if (!condition) {
    return null
  }

  return dynamic(() => importFn(), {
    ssr: false,
    loading: () => <DefaultLoadingFallback />,
  })
}

/**
 * 创建带加载状态的懒加载组件
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn)

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <DefaultLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

/**
 * 批量预加载多个组件
 */
export function preloadMultipleComponents(
  importFns: Array<() => Promise<any>>
): Promise<void[]> {
  return Promise.all(
    importFns.map((importFn) =>
      importFn().catch((error) => {
        console.warn('Failed to preload component:', error)
      })
    )
  )
}

/**
 * 基于路由的代码分割
 */
export function getRouteComponent<T extends ComponentType<any>>(
  routes: Record<string, () => Promise<{ default: T }>>,
  route: string
) {
  const importFn = routes[route]
  if (!importFn) {
    console.warn(`Route "${route}" not found`)
    return () => null
  }

  return dynamic(() => importFn(), {
    ssr: false,
    loading: () => <DefaultLoadingFallback />,
  })
}

/**
 * 高阶组件：添加组件预加载功能
 */
export function withPreload<P extends object>(
  WrappedComponent: ComponentType<P>,
  importFn: () => Promise<{ default: ComponentType<P> }>
) {
  const preload = preloadComponent(importFn)

  return Object.assign(WrappedComponent, { preload })
}

/**
 * 性能优化的动态导入（带缓存）
 */
const componentCache = new Map<string, Promise<any>>()

export function cachedDynamicImport<T extends ComponentType<any>>(
  key: string,
  importFn: () => Promise<{ default: T }>
) {
  if (!componentCache.has(key)) {
    componentCache.set(
      key,
      importFn().catch((error) => {
        componentCache.delete(key)
        throw error
      })
    )
  }

  return dynamic(() => componentCache.get(key)!, {
    ssr: false,
    loading: () => <DefaultLoadingFallback />,
  })
}

/**
 * 清除组件缓存
 */
export function clearComponentCache() {
  componentCache.clear()
}

/**
 * 预加载下一个路由的组件
 */
export function preloadNextRoute(
  currentRoute: string,
  routes: string[],
  getImportFn: (route: string) => () => Promise<any>
) {
  const currentIndex = routes.indexOf(currentRoute)
  const nextRoute = routes[currentIndex + 1]

  if (nextRoute) {
    const importFn = getImportFn(nextRoute)
    const preload = preloadComponent(importFn)
    preload()
  }
}

/**
 * 监听用户交互，预加载可能需要的组件
 */
export function setupInteractionPreloading(
  handlers: {
    onHover?: (element: HTMLElement) => void
    onFocus?: (element: HTMLElement) => void
    onClick?: (element: HTMLElement) => void
  }
) {
  if (typeof window === 'undefined') return

  const handleInteraction = (event: Event, type: 'hover' | 'focus' | 'click') => {
    const target = event.target as HTMLElement
    const link = target.closest('a') as HTMLAnchorElement

    if (link && link.href) {
      const handler = handlers[type === 'hover' ? 'onHover' : type === 'focus' ? 'onFocus' : 'onClick']
      if (handler) {
        handler(link)
      }
    }
  }

  // 监听鼠标悬停
  if (handlers.onHover) {
    let hoverTimer: NodeJS.Timeout
    document.addEventListener(
      'mouseover',
      (e) => {
        clearTimeout(hoverTimer)
        hoverTimer = setTimeout(() => handleInteraction(e, 'hover'), 100)
      },
      { passive: true }
    )
  }

  // 监听焦点
  if (handlers.onFocus) {
    document.addEventListener('focusin', (e) => handleInteraction(e, 'focus'), { passive: true })
  }

  // 监听点击（预加载下一个可能的页面）
  if (handlers.onClick) {
    document.addEventListener('click', (e) => handleInteraction(e, 'click'), { passive: true })
  }
}
