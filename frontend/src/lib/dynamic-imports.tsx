import dynamic from 'next/dynamic'
import { Loader } from '@/components/ui/Loader'

// 通用的动态导入配置
export const dynamicImportConfig: Parameters<typeof dynamic>[1] = {
  loading: () => <Loader className="h-32 w-full" />,
  ssr: false,
}

// 懒加载重型组件
export const LazyThreeViewer = dynamic(
  () => import('@/components/ThreeViewer').then((mod) => ({ default: mod.ThreeViewer })),
  dynamicImportConfig as any
)

export const LazyMusicPlayer = dynamic(
  () => import('@/components/MusicPlayer').then((mod) => ({ default: mod.MusicPlayer })),
  dynamicImportConfig as any
)

export const LazyInteractiveMap = dynamic(
  () => import('@/components/InteractiveMap').then((mod) => ({ default: mod.InteractiveMap })),
  dynamicImportConfig as any
)

// 条件加载的开发工具
export const LazyDebugPanel =
  process.env.NODE_ENV === 'development'
    ? dynamic(
        () => import('@/components/debug/DebugPanel').then((mod) => ({ default: mod.DebugPanel })),
        { ssr: false }
      )
    : () => null

// 性能监控 Hook (不需要动态导入)
// export const LazyPerformanceMonitor = process.env.NODE_ENV === 'production'
//   ? dynamic(
//       () => import('@/components/hooks/usePerformanceMonitor').then(mod => ({ default: mod.usePerformanceMonitor })),
//       { ssr: false }
//     )
//   : () => null

// 触摸手势支持
export const LazySwipeContainer = dynamic(
  () => import('@/components/ui/SwipeContainer').then((mod) => ({ default: mod.SwipeContainer })),
  dynamicImportConfig as any
)

// Excalidraw 绘图工具
export const LazyExcalidrawViewer = dynamic(
  () =>
    import('@/components/Excalidraw/ExcalidrawViewer').then((mod) => ({
      default: mod.ExcalidrawViewer,
    })),
  dynamicImportConfig as any
)

// 预加载关键组件
export const preloadComponents = () => {
  // 在空闲时预加载组件
  if (typeof window !== 'undefined') {
    requestIdleCallback(() => {
      import('@/components/ThreeViewer')
      import('@/components/MusicPlayer')
      import('@/components/Excalidraw/ExcalidrawViewer')
    })
  }
}
