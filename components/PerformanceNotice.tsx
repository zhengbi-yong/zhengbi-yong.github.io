'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/components/ui/button'
import { LoadingStrategy, getLoadingStrategy } from '@/lib/utils/loading-strategy'

export default function PerformanceNotice() {
  const [strategy, setStrategy] = useState<LoadingStrategy>('standard')

  useEffect(() => {
    setStrategy(getLoadingStrategy())
  }, [])

  const handleForceMinimal = () => {
    window.dispatchEvent(new CustomEvent('hero:set-mode', { detail: 'minimal' }))
  }

  const handleForceEnhanced = () => {
    window.dispatchEvent(new CustomEvent('hero:set-mode', { detail: 'enhanced' }))
  }

  return (
    <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/70 p-6 text-emerald-900 shadow-inner dark:border-emerald-500/20 dark:bg-emerald-900/20 dark:text-emerald-100">
      <p className="text-sm tracking-[0.3em] uppercase">Performance</p>
      <h3 className="mt-2 text-2xl font-semibold">自适应渲染策略</h3>
      <p className="mt-3 text-sm text-emerald-900/80 dark:text-emerald-100/80">
        当前建议：<span className="font-bold">{strategy}</span>
        。系统会根据设备性能和网络情况自动选择 3D 质量。你也可以手动切换体验。
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Button
          variant="default"
          onClick={handleForceEnhanced}
          className="bg-emerald-600 hover:bg-emerald-500"
        >
          追求极致效果
        </Button>
        <Button variant="outline" onClick={handleForceMinimal}>
          进入省电模式
        </Button>
      </div>
    </div>
  )
}
