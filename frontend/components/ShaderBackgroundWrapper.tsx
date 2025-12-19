'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// 动态导入着色器背景组件（客户端组件）
// 使用 loading 选项避免 HMR 问题
const ShaderBackground = dynamic(() => import('@/components/ShaderBackground'), {
  ssr: false,
  loading: () => null, // 加载时不显示任何内容
})

interface ShaderBackgroundWrapperProps {
  intensity?: number
  className?: string
}

/**
 * ShaderBackgroundWrapper - 着色器背景包装组件
 * 用于在 Server Component 中使用客户端组件
 *
 * 使用延迟加载避免 Next.js 16 + Turbopack HMR 问题
 */
export default function ShaderBackgroundWrapper({
  intensity = 0.8,
  className = '',
}: ShaderBackgroundWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 确保只在客户端挂载
    setMounted(true)
  }, [])

  // 服务端渲染时不渲染任何内容
  if (!mounted) {
    return null
  }

  return <ShaderBackground intensity={intensity} className={className} />
}
