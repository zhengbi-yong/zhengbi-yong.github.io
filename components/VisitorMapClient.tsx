'use client'

import dynamic from 'next/dynamic'
import type { VisitorData } from '@/lib/types/visitor'

// 动态导入地图组件（避免SSR问题）
const VisitorMap = dynamic(() => import('@/components/VisitorMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
      <p className="text-gray-500 dark:text-gray-400">加载地图中...</p>
    </div>
  ),
})

interface VisitorMapClientProps {
  visitors: VisitorData[]
}

export default function VisitorMapClient({ visitors }: VisitorMapClientProps) {
  return <VisitorMap visitors={visitors} />
}
