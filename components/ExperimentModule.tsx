'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/shadcn/ui/button'
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
    <section className="group hover:border-primary-300/50 dark:hover:border-primary-600/50 rounded-2xl border border-gray-200/50 bg-white/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:border-gray-700/50 dark:bg-gray-900/60 dark:hover:shadow-gray-900/50">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          {disabled && (
            <span className="text-xs font-medium text-amber-500 dark:text-amber-400">
              性能受限，暂不可用
            </span>
          )}
          <Button
            variant={status === 'ready' ? 'outline' : 'default'}
            onClick={handleToggle}
            disabled={disabled}
            className="transition-all duration-200"
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
          <div className="rounded-xl border border-dashed border-gray-200/50 bg-white/50 p-4 transition-all duration-300 dark:border-gray-700/50 dark:bg-gray-800/50">
            <ModuleComponent />
          </div>
        )}
        {status === 'collapsed' && (
          <p className="text-xs text-gray-500 italic dark:text-gray-400">
            点击"展开实验"即可加载此模块，首次加载可能需要几秒钟。
          </p>
        )}
        {error && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={startLoading}
              className="text-sm font-medium text-red-600 underline transition-colors duration-200 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              重试
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
