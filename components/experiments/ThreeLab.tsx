'use client'

import dynamic from 'next/dynamic'
import { Spinner } from '@/components/loaders'

const ThreeJSViewer = dynamic(() => import('@/components/ThreeJSViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center">
      <Spinner size="lg" />
    </div>
  ),
})

export default function ThreeLab() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        URDF 机器人模型加载实验，配合自适应渲染策略展示 3D 控制面板。
      </p>
      <ThreeJSViewer className="h-96" />
    </div>
  )
}
