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
    description: '集合按钮、卡片等交互组件，展示多种动效组合。',
    loader: () => import('@/components/experiments/ThreeLab'),
  },
  {
    title: '粒子背景演示',
    description: '简单的粒子动画效果演示。',
    loader: () => import('@/components/experiments/ThreeLab'),
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
      {/* 实验内容 */}
      <div className="relative z-10 space-y-10 py-8 md:py-12">
        {/* 标题区域 - 居中 */}
        <header className="space-y-4 pt-8 pb-4 text-center">
          <p className="text-primary-500 text-sm font-medium tracking-[0.4em] uppercase">Labs</p>
          <h1 className="mx-auto text-4xl leading-tight font-extrabold tracking-tight text-foreground sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight lg:text-7xl lg:leading-tight">
            实验场
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            这里是网站新功能与炫酷动效的试验田，每个模块均采用懒加载与骨架屏确保体验顺畅。
          </p>
        </header>

        <div className="mx-auto max-w-6xl space-y-6 px-4 md:space-y-8">
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
