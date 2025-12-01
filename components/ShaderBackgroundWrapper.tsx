'use client'

import dynamic from 'next/dynamic'

// 动态导入着色器背景组件（客户端组件）
const ShaderBackground = dynamic(() => import('@/components/ShaderBackground'), {
  ssr: false,
})

interface ShaderBackgroundWrapperProps {
  intensity?: number
  className?: string
}

/**
 * ShaderBackgroundWrapper - 着色器背景包装组件
 * 用于在 Server Component 中使用客户端组件
 */
export default function ShaderBackgroundWrapper({
  intensity = 0.8,
  className = '',
}: ShaderBackgroundWrapperProps) {
  return <ShaderBackground intensity={intensity} className={className} />
}

