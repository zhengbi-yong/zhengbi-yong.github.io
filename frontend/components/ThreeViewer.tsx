'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Loader } from './ui/Loader'

// 动态导入 Three.js 组件以减少初始 bundle 大小
const DynamicThreeViewer = dynamic(
  () => import('./three/ThreeViewer').then((mod) => ({ default: mod.ThreeViewer })),
  {
    loading: () => <Loader className="h-96" />,
    ssr: false, // Three.js 需要在客户端渲染
  }
)

interface ThreeViewerProps {
  modelPath?: string
  modelUrl?: string
  className?: string
  autoRotate?: boolean
  cameraPosition?: [number, number, number]
}

export function ThreeViewer({
  modelPath,
  className = '',
  autoRotate = true,
  cameraPosition = [0, 0, 5],
}: ThreeViewerProps) {
  return (
    <Suspense fallback={<Loader className="h-96" />}>
      <DynamicThreeViewer
        modelPath={modelPath}
        className={className}
        autoRotate={autoRotate}
        cameraPosition={cameraPosition}
      />
    </Suspense>
  )
}

// 导出类型以供其他组件使用
export type { ThreeViewerProps }
