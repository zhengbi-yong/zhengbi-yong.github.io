'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import siteMetadata from '@/data/siteMetadata'
import { Button } from '@/components/components/ui/button'
import { Spinner } from '@/components/loaders'
import {
  getPerformanceOptimizedParams,
  useGSAPPerformance,
} from '@/components/hooks/useGSAPPerformance'
import { getHeroVisualMode, HeroVisualMode, getLoadingStrategy } from '@/lib/utils/loading-strategy'

const ThreeJSViewer = dynamic(() => import('@/components/ThreeJSViewer'), {
  ssr: false,
})

const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), {
  ssr: false,
})

interface QualityProfile {
  pixelRatio: number
  enableShadows: boolean
  lightIntensity: number
  maxDistance: number
}

const HERO_TITLE = '探索未来的人机交互'

export default function Hero3DSection() {
  const [visualMode, setVisualMode] = useState<HeroVisualMode>('standard')
  const [mounted, setMounted] = useState(false)
  const [manualOverride, setManualOverride] = useState<HeroVisualMode | null>(null)
  const { isLowPerformance } = useGSAPPerformance()
  const animationParams = useMemo(() => getPerformanceOptimizedParams(1.2, 80), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<HeroVisualMode>
      if (custom.detail) {
        setManualOverride(custom.detail)
      }
    }

    window.addEventListener('hero:set-mode', handler as EventListener)
    return () => {
      window.removeEventListener('hero:set-mode', handler as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    const mode = manualOverride ?? getHeroVisualMode()
    setVisualMode(mode)
  }, [manualOverride, mounted])

  useEffect(() => {
    if (!mounted || manualOverride) return
    if (isLowPerformance) {
      setVisualMode('minimal')
    }
  }, [isLowPerformance, manualOverride, mounted])

  const devicePixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1

  const qualityProfile = useMemo<QualityProfile>(() => {
    switch (visualMode) {
      case 'enhanced':
        return {
          pixelRatio: Math.min(devicePixelRatio, 2),
          enableShadows: true,
          lightIntensity: 1.2,
          maxDistance: 2.5,
        }
      case 'standard':
        return {
          pixelRatio: 1,
          enableShadows: false,
          lightIntensity: 0.8,
          maxDistance: 1.8,
        }
      default:
        return {
          pixelRatio: 1,
          enableShadows: false,
          lightIntensity: 0.4,
          maxDistance: 1.2,
        }
    }
  }, [devicePixelRatio, visualMode])

  const heroClasses =
    'relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900/70 to-gray-800 p-8 text-white shadow-2xl'

  const handleModeToggle = () => {
    if (visualMode === 'minimal') {
      setManualOverride('standard')
    } else {
      setManualOverride('minimal')
    }
  }

  const loadingStrategy = getLoadingStrategy()

  return (
    <section className="mb-12">
      <div className={heroClasses}>
        {(visualMode === 'enhanced' || visualMode === 'standard') && (
          <div className="absolute inset-0">
            {visualMode === 'enhanced' ? (
              <ParticleBackground className="opacity-60" particleCount={60} speed={0.5} />
            ) : null}
            <div className="from-primary-500/10 absolute inset-0 bg-gradient-to-tr to-transparent" />
          </div>
        )}
        <div className="relative z-10 grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="text-primary-300 text-sm tracking-[0.3em] uppercase">Zhengbi Yong</p>
            <h1
              className="text-4xl leading-tight font-extrabold md:text-5xl"
              style={{
                letterSpacing: `${visualMode === 'enhanced' ? 0.02 : 0.01}em`,
              }}
            >
              {HERO_TITLE}
            </h1>
            <p className="text-lg text-gray-300">
              通过实时 3D
              交互与感知式动画展示机器人控制与人机交互设计。系统会根据设备性能自动切换效果，确保浏览体验始终丝滑。
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="default"
                size="lg"
                onClick={handleModeToggle}
                className="bg-primary-500 hover:bg-primary-400"
              >
                {visualMode === 'minimal' ? '切换至交互模式' : '切换至简约模式'}
              </Button>
              <Button variant="outline" size="lg">
                了解更多
              </Button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200 backdrop-blur-lg">
              <div className="flex items-center justify-between">
                <span>当前模式</span>
                <span className="text-primary-200 font-semibold">{visualMode}</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                自动策略：{loadingStrategy} | 动画距离 {animationParams.distance}px
              </div>
            </div>
          </div>
          <div className="relative min-h-[22rem] rounded-2xl border border-white/10 bg-black/20 backdrop-blur">
            {visualMode === 'minimal' ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                <Image
                  src={siteMetadata.socialBanner}
                  width={600}
                  height={340}
                  alt="hero fallback"
                  className="rounded-xl border border-white/10 object-cover shadow-lg"
                  priority
                />
                <p className="text-sm text-gray-300">
                  正在低功耗模式下展示内容，可随时切换恢复实时 3D。
                </p>
              </div>
            ) : (
              <div className="h-full w-full">
                <Suspense
                  fallback={
                    <div className="flex h-full flex-col items-center justify-center gap-3">
                      <Spinner size="lg" />
                      <p className="text-sm text-gray-300">加载 3D 场景中...</p>
                    </div>
                  }
                >
                  <ThreeJSViewer className="h-full w-full" qualityProfile={qualityProfile} />
                </Suspense>
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-6 bottom-6 flex justify-between text-xs tracking-[0.4em] text-gray-400 uppercase">
              <span>Adaptive 3D</span>
              <span>Realtime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
