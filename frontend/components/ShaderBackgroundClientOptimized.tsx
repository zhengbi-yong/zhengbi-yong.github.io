'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// 动态导入 ShaderBackgroundWrapper
const ShaderBackgroundWrapper = dynamic(() => import('@/components/ShaderBackgroundWrapper'), {
  ssr: false,
  loading: () => null,
})

interface ShaderBackgroundClientOptimizedProps {
  intensity?: number
}

export default function ShaderBackgroundClientOptimized({
  intensity = 0.6,
}: ShaderBackgroundClientOptimizedProps) {
  const [isClient, setIsClient] = useState(false)
  const [shouldDisable, setShouldDisable] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // 检测设备性能
    const checkPerformance = () => {
      // 检查内存信息（如果可用）
      const memory = (performance as any).memory
      if (memory && memory.totalJSHeapSize < 100 * 1024 * 1024) {
        // < 100MB
        setShouldDisable(true)
        return
      }

      // 检查硬件并发数
      const cores = navigator.hardwareConcurrency || 4
      if (cores <= 2) {
        setShouldDisable(true)
        return
      }

      setShouldDisable(false)
    }

    checkPerformance()
  }, [])

  // 服务端渲染时返回简单的占位符
  if (!isClient) {
    return (
      <div
        className="absolute inset-0 bg-gradient-to-br from-gray-100/20 via-gray-50/10 to-gray-100/20 dark:from-gray-900/20 dark:via-gray-950/10 dark:to-gray-900/20"
        style={{ opacity: 0.6 }}
      />
    )
  }

  // 对于低性能设备，返回简单的背景效果
  if (shouldDisable) {
    return (
      <div
        className="absolute inset-0 bg-gradient-to-br from-gray-100/20 via-gray-50/10 to-gray-100/20 dark:from-gray-900/20 dark:via-gray-950/10 dark:to-gray-900/20"
        style={{ opacity: intensity }}
      />
    )
  }

  return <ShaderBackgroundWrapper intensity={intensity} />
}
