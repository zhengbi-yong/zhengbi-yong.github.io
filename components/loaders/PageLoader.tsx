'use client'

import { memo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Spinner from './Spinner'
import { Progress } from '@/components/components/ui/progress'
import { getOptimalParticleCount } from '@/lib/utils/loading-strategy'
import dynamic from 'next/dynamic'

// 动态导入 ParticleBackground，减少初始 bundle 大小
const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), {
  ssr: false,
})

interface PageLoaderProps {
  progress?: number // 0-100
  message?: string
  showParticles?: boolean
}

/**
 * PageLoader - 全局页面加载组件
 * 支持粒子动画、进度条和自定义消息
 */
const PageLoader = memo(function PageLoader({
  progress,
  message = '加载中...',
  showParticles = true,
}: PageLoaderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm dark:bg-gray-950/90"
      aria-label="页面加载中"
      role="status"
    >
      {/* 可选的粒子背景 - 移除低性能模式限制，始终显示（如果 showParticles 为 true） */}
      {showParticles && (
        <div className="absolute inset-0">
          <ParticleBackground particleCount={getOptimalParticleCount(20)} speed={0.3} />
        </div>
      )}

      {/* 中心内容区域 */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <Spinner size="lg" />
        {message && (
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{message}</p>
        )}
        {progress !== undefined && (
          <div className="w-64">
            <Progress value={progress} className="h-2" />
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">{progress}%</p>
          </div>
        )}
      </div>
    </motion.div>
  )
})

PageLoader.displayName = 'PageLoader'

export default PageLoader
