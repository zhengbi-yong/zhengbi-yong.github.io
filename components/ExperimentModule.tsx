'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/components/ui/button'
import SkeletonProgress from '@/components/SkeletonProgress'

type ModuleStatus = 'collapsed' | 'loading' | 'ready'

interface ExperimentModuleProps {
  title: string
  description: string
  loader: () => Promise<{ default: React.ComponentType }>
  defaultOpen?: boolean
  disabled?: boolean
}

export default function ExperimentModule({
  title,
  description,
  loader,
  defaultOpen = false,
  disabled = false,
}: ExperimentModuleProps) {
  const [status, setStatus] = useState<ModuleStatus>(defaultOpen ? 'loading' : 'collapsed')
  const [ModuleComponent, setModuleComponent] = useState<React.ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startLoading = useCallback(async () => {
    setError(null)
    setStatus('loading')
    try {
      const mod = await loader()
      setModuleComponent(() => mod.default)
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : '模块加载失败')
      setStatus('collapsed')
    }
  }, [loader])

  const handleToggle = () => {
    if (disabled) return
    if (status === 'collapsed') {
      void startLoading()
    } else if (status === 'ready') {
      setStatus('collapsed')
    }
  }

  useEffect(() => {
    if (defaultOpen) {
      void startLoading()
    }
  }, [defaultOpen, startLoading])

  return (
    <section className="rounded-3xl border border-gray-200 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/60">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {disabled && <span className="text-xs text-amber-500">性能受限，暂不可用</span>}
          <Button
            variant={status === 'ready' ? 'outline' : 'default'}
            onClick={handleToggle}
            disabled={disabled}
          >
            {status === 'collapsed' && '展开实验'}
            {status === 'loading' && '加载中…'}
            {status === 'ready' && '折叠模块'}
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {status === 'loading' && <SkeletonProgress label={`正在加载 ${title}`} />}
        {status === 'ready' && ModuleComponent && (
          <div className="rounded-2xl border border-dashed border-gray-200 p-4 dark:border-gray-700">
            <ModuleComponent />
          </div>
        )}
        {status === 'collapsed' && (
          <p className="text-xs text-gray-500 dark:text-gray-500">
            点击“展开实验”即可加载此模块，首次加载可能需要几秒钟。
          </p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-500">
            {error} ·{' '}
            <button onClick={startLoading} className="underline">
              重试
            </button>
          </p>
        )}
      </div>
    </section>
  )
}
