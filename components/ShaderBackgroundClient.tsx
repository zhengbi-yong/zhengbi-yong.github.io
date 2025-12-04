'use client'

import dynamic from 'next/dynamic'

// 动态导入 ShaderBackgroundWrapper 避免 HMR 问题
// 这是一个客户端组件包装器，用于在 Server Components 中使用
const ShaderBackgroundWrapper = dynamic(() => import('@/components/ShaderBackgroundWrapper'), {
  ssr: false,
  loading: () => null,
})

interface ShaderBackgroundClientProps {
  intensity?: number
}

export default function ShaderBackgroundClient({ intensity = 0.8 }: ShaderBackgroundClientProps) {
  return <ShaderBackgroundWrapper intensity={intensity} />
}

