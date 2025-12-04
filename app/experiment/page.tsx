'use client'

import { type ComponentType } from 'react'
import dynamic from 'next/dynamic'
import ExperimentModule from '@/components/ExperimentModule'

// 动态导入 ShaderBackgroundWrapper 避免 HMR 问题
const ShaderBackgroundWrapper = dynamic(() => import('@/components/ShaderBackgroundWrapper'), {
  ssr: false,
  loading: () => null,
})

type ModuleConfig = {
  title: string
  description: string
  loader: () => Promise<{ default: ComponentType }>
  requiresEnhanced?: boolean
  defaultOpen?: boolean
}

const moduleConfigs: ModuleConfig[] = [
  {
    title: '3D URDF 实验室',
    description: '实时加载机器人模型，体验自适应渲染与交互控制。',
    loader: () => import('@/components/experiments/ThreeLab'),
    defaultOpen: false,
  },
  {
    title: 'Shadcn UI 体验舱',
    description: '集合按钮、卡片、Tabs 等交互组件，展示多种动效组合。',
    loader: () => import('@/components/experiments/ShadcnShowcase'),
  },
  {
    title: '粒子与庆典动画',
    description: '粒子背景 + 彩带/烟花/闪光特效，需要更强算力支持。',
    loader: () => import('@/components/experiments/ParticlesShowcase'),
    requiresEnhanced: true,
  },
  {
    title: '乐谱渲染实验室',
    description: '使用 OpenSheetMusicDisplay 渲染 MusicXML 乐谱，支持缩放、页面导航和示例切换。',
    loader: () => import('@/components/experiments/MusicSheetLab'),
  },
]

export default function ExperimentPage() {
  // 移除低性能模式检查，所有功能都正常显示
  return (
    <div className="relative min-h-screen">
      {/* 着色器背景 - 固定定位覆盖整个视口 */}
      <div className="fixed inset-0 -z-10">
        <ShaderBackgroundWrapper intensity={0.8} />
      </div>
      {/* 内容背景遮罩 - 提升文字可读性 */}
      <div className="fixed inset-0 -z-[5] bg-white/50 dark:bg-gray-950/60 backdrop-blur-sm" />
      {/* 实验内容 */}
      <div className="relative z-10 space-y-10 py-8 md:py-12">
        {/* 标题区域 - 居中 */}
        <header className="text-center space-y-4 pt-8 pb-4">
          <p className="text-primary-500 text-sm tracking-[0.4em] uppercase font-medium">Labs</p>
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight lg:text-7xl lg:leading-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent mx-auto">
            实验场
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 sm:text-lg max-w-2xl mx-auto">
            这里是网站新功能与炫酷动效的试验田，每个模块均采用懒加载与骨架屏确保体验顺畅。
          </p>
        </header>

        <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto px-4">
          {moduleConfigs.map((module) => (
            <ExperimentModule
              key={module.title}
              title={module.title}
              description={module.description}
              loader={module.loader}
              defaultOpen={module.defaultOpen}
              disabled={false}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
