'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Loader } from './ui/Loader'

// 动态导入地图组件
const DynamicInteractiveMap = dynamic(
  () => import('./maps/InteractiveMap').then((mod) => ({ default: mod.InteractiveMap })),
  {
    loading: () => <Loader className="h-96" />,
    ssr: false, // Leaflet 需要在客户端渲染
  }
)

interface InteractiveMapProps {
  center: [number, number]
  zoom: number
  markers?: Array<{
    id: string
    position: [number, number]
    title?: string
    description?: string
  }>
  className?: string
}

export function InteractiveMap({
  center,
  zoom,
  markers = [],
  className = '',
}: InteractiveMapProps) {
  return (
    <Suspense fallback={<Loader className="h-96" />}>
      <DynamicInteractiveMap center={center} zoom={zoom} markers={markers} className={className} />
    </Suspense>
  )
}

// 导出类型以供其他组件使用
export type { InteractiveMapProps }
