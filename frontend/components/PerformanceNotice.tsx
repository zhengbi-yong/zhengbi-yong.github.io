'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/shadcn/ui/button'
import { Badge } from '@/components/shadcn/ui/badge'
import { LoadingStrategy, getLoadingStrategy } from '@/lib/utils/loading-strategy'

const PerformanceNotice = memo(function PerformanceNotice() {
  const [strategy, setStrategy] = useState<LoadingStrategy>('standard')

  useEffect(() => {
    setStrategy(getLoadingStrategy())
  }, [])

  const handleForceEnhanced = () => {
    window.dispatchEvent(new CustomEvent('hero:set-mode', { detail: 'enhanced' }))
  }

  // 使用 useMemo 缓存策略详情，移除 minimal 模式
  const strategyDetail = useMemo(
    () =>
      ({
        standard: {
          label: '均衡',
          tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200',
          desc: '适量特效与中等分辨率。',
        },
        enhanced: {
          label: '全特效',
          tone: 'bg-sky-100 text-sky-800 dark:bg-sky-400/10 dark:text-sky-200',
          desc: '启用粒子+高像素比，追求极致视觉。',
        },
      }) as Record<'standard' | 'enhanced', { label: string; tone: string; desc: string }>,
    []
  )

  const detail = strategyDetail[strategy === 'minimal' ? 'standard' : strategy]

  return (
    <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/70 p-6 text-emerald-900 shadow-inner dark:border-emerald-500/20 dark:bg-emerald-900/20 dark:text-emerald-100">
      <p className="text-sm tracking-[0.3em] uppercase">Performance</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h3 className="text-2xl font-semibold">自适应渲染策略</h3>
        <Badge className={`${detail.tone} border-none px-3 py-1 text-xs uppercase`}>
          {detail.label}
        </Badge>
      </div>
      <p className="mt-3 text-sm text-emerald-900/80 dark:text-emerald-100/80">{detail.desc}</p>
      <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/70">
        当前建议：<span className="font-semibold">{strategy}</span> ·
        系统会根据设备性能和网络自动切换， 也可以手动覆盖。
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Button
          variant="default"
          onClick={handleForceEnhanced}
          className="bg-emerald-600 hover:bg-emerald-500"
        >
          追求极致效果
        </Button>
      </div>
    </div>
  )
})

PerformanceNotice.displayName = 'PerformanceNotice'

export default PerformanceNotice
