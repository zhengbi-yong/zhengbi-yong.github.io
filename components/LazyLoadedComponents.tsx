'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { AnalyticsConfig } from 'pliny/analytics'

// 动态导入 Analytics，延迟加载，不阻塞首屏渲染
const Analytics = dynamic(
  () => import('pliny/analytics').then((mod) => ({ default: mod.Analytics })),
  {
    ssr: false,
    loading: () => null, // 不显示加载状态
  }
)

// 延迟加载辅助组件，不阻塞首屏渲染
const KeyboardNavigation = dynamic(
  () =>
    import('@/components/KeyboardNavigation').then((mod) => ({
      default: mod.KeyboardNavigation,
    })),
  { ssr: false }
)

const FocusManager = dynamic(
  () =>
    import('@/components/FocusManager').then((mod) => ({
      default: mod.FocusManager,
    })),
  { ssr: false }
)

// 动态导入 3D 和复杂组件
const ThreeDViewer = dynamic(
  () => import('@/components/ThreeDViewer').then((mod) => ({ default: mod.ThreeDViewer })),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />,
  }
)

const MusicNotation = dynamic(
  () => import('@/components/MusicNotation').then((mod) => ({ default: mod.MusicNotation })),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />,
  }
)

const ParticleEffect = dynamic(
  () => import('@/components/ParticleEffect').then((mod) => ({ default: mod.ParticleEffect })),
  {
    ssr: false,
    loading: () => null,
  }
)

interface LazyLoadedComponentsProps {
  analyticsConfig?: AnalyticsConfig
}

/**
 * LazyLoadedComponents - 延迟加载的组件包装器
 * 在客户端组件中处理动态导入，避免 Server Component 的限制
 */
export default function LazyLoadedComponents({ analyticsConfig }: LazyLoadedComponentsProps) {
  return (
    <>
      {/* 延迟加载辅助组件，不阻塞首屏渲染 */}
      <Suspense fallback={null}>
        <KeyboardNavigation />
        <FocusManager />
      </Suspense>
      {/* Analytics 延迟加载，不阻塞首屏渲染 */}
      {analyticsConfig && (
        <Suspense fallback={null}>
          <Analytics analyticsConfig={analyticsConfig} />
        </Suspense>
      )}
    </>
  )
}
