'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import siteMetadata from '@/data/siteMetadata'
import { Button } from '@/components/components/ui/button'
import { Spinner } from '@/components/loaders'
import { getPerformanceOptimizedParams } from '@/components/hooks/useGSAPPerformance'
import { getHeroVisualMode, HeroVisualMode, getLoadingStrategy, LoadingStrategy } from '@/lib/utils/loading-strategy'

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

const HERO_TITLE = '人工智能'

export default function Hero3DSection() {
  // 使用 useState 和 useEffect 确保客户端渲染时使用正确的标题，避免 hydration 不匹配
  const [heroTitle, setHeroTitle] = useState(HERO_TITLE)
  const [visualMode, setVisualMode] = useState<HeroVisualMode>('standard')
  const [mounted, setMounted] = useState(false)
  const [manualOverride, setManualOverride] = useState<HeroVisualMode | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const animationParams = useMemo(() => {
    const durationScale = visualMode === 'enhanced' ? 1.2 : 1
    const distance = visualMode === 'enhanced' ? 90 : 70
    return getPerformanceOptimizedParams(durationScale, distance)
  }, [visualMode])
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }
    setPrefersReducedMotion(media.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  // 移除 prefersReducedMotion 强制设置为 minimal 的逻辑
  // 如果用户偏好减少动画，getHeroVisualMode() 会返回 'standard'

  useEffect(() => {
    // 确保在客户端 hydration 时使用正确的标题值
    setMounted(true)
    setHeroTitle(HERO_TITLE)

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
    // 移除低性能模式限制，始终使用 standard 或 enhanced
    const mode = manualOverride ?? getHeroVisualMode()
    // 确保不会设置为 minimal
    setVisualMode(mode === 'minimal' ? 'standard' : mode)
  }, [manualOverride, mounted])

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
      default:
        // 移除 minimal 模式，default 使用 standard 配置
        return {
          pixelRatio: 1,
          enableShadows: false,
          lightIntensity: 0.8,
          maxDistance: 1.8,
        }
    }
  }, [devicePixelRatio, visualMode])

  const heroClasses =
    'relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900/70 to-gray-800 p-8 text-white shadow-2xl'

  const handleModeToggle = () => {
    // 移除 minimal 模式切换，改为在 enhanced 和 standard 之间切换
    if (visualMode === 'enhanced') {
      setManualOverride('standard')
    } else {
      setManualOverride('enhanced')
    }
  }

  // 使用 state 存储 loadingStrategy，避免 SSR/CSR 不匹配
  const [loadingStrategy, setLoadingStrategy] = useState<LoadingStrategy>('standard')

  useEffect(() => {
    if (mounted) {
      setLoadingStrategy(getLoadingStrategy())
    }
  }, [mounted])

  return (
    <section className="mb-12">
      <div className={heroClasses}>
        {/* 移除低性能模式限制，始终显示粒子背景 */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-60 blur-3xl"
            style={{
              background:
                'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.35), transparent 55%)',
            }}
          />
          <div className="from-primary-500/10 absolute inset-0 bg-gradient-to-tr to-transparent" />
          <ParticleBackground
            className={visualMode === 'enhanced' ? 'opacity-70' : 'opacity-35'}
            particleCount={visualMode === 'enhanced' ? 80 : 30}
            speed={visualMode === 'enhanced' ? 0.55 : 0.25}
          />
        </div>
        <div className="relative z-10 grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="text-primary-300 text-sm tracking-[0.3em] uppercase">Zhengbi Yong</p>
            <h1
              className="text-4xl leading-tight font-extrabold md:text-5xl"
              style={{
                letterSpacing: `${visualMode === 'enhanced' ? 0.02 : 0.01}em`,
              }}
              suppressHydrationWarning
            >
              {mounted ? heroTitle : HERO_TITLE}
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
                {visualMode === 'enhanced' ? '切换至标准模式' : '切换至增强模式'}
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
                {prefersReducedMotion && ' · 已启用低动效模式'}
              </div>
            </div>
          </div>
          <div className="relative min-h-[22rem] rounded-2xl border border-white/10 bg-black/20 backdrop-blur">
            {/* 移除 minimal 模式，始终显示 3D 场景 */}
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
