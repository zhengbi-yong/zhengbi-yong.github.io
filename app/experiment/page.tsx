'use client'

import { useEffect, useState, type ComponentType } from 'react'
import ExperimentModule from '@/components/ExperimentModule'
import { getLoadingStrategy, LoadingStrategy } from '@/lib/utils/loading-strategy'

type ModuleConfig = {
  title: string
  description: string
  loader: () => Promise<{ default: ComponentType }>
  requiresEnhanced?: boolean
}

const moduleConfigs: ModuleConfig[] = [
  {
    title: '3D URDF 实验室',
    description: '实时加载机器人模型，体验自适应渲染与交互控制。',
    loader: () => import('@/components/experiments/ThreeLab'),
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
]

export default function ExperimentPage() {
  const [strategy, setStrategy] = useState<LoadingStrategy>('standard')

  useEffect(() => {
    setStrategy(getLoadingStrategy())
  }, [])

  const isMinimal = strategy === 'minimal'

  return (
    <div className="space-y-10 py-6">
      <header className="space-y-2">
        <p className="text-primary-500 text-sm tracking-[0.4em] uppercase">Labs</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl dark:text-gray-100">
          实验场
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400">
          这里是网站新功能与炫酷动效的试验田，每个模块均采用懒加载与骨架屏确保体验顺畅。
        </p>
      </header>

      {isMinimal && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-400/40 dark:bg-amber-900/30 dark:text-amber-100">
          当前处于低功耗策略，部分实验默认禁用。切换至桌面设备或更高性能模式可解锁全部内容。
        </div>
      )}

      <div className="space-y-8">
        {moduleConfigs.map((module) => (
          <ExperimentModule
            key={module.title}
            title={module.title}
            description={module.description}
            loader={module.loader}
            disabled={module.requiresEnhanced && isMinimal}
          />
        ))}
      </div>
    </div>
  )
}
