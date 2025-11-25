'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { Spinner } from '@/components/loaders'
import { getOptimalParticleCount } from '@/lib/utils/loading-strategy'

const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), {
  ssr: false,
})

const ConfettiAnimation = dynamic(() => import('@/components/animations/ConfettiAnimation'), {
  ssr: false,
  loading: () => <Spinner />,
})

export default function ParticlesShowcase() {
  const [count, setCount] = useState(40)

  useEffect(() => {
    setCount(getOptimalParticleCount(60))
  }, [])

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 dark:border-indigo-500/20 dark:from-gray-900 dark:to-gray-950">
      <div className="pointer-events-none absolute inset-0">
        <ParticleBackground particleCount={count} speed={0.6} />
      </div>
      <div className="relative z-10 space-y-4 text-indigo-900 dark:text-indigo-100">
        <h4 className="text-2xl font-semibold">粒子 + 庆典动效</h4>
        <p className="text-sm">
          tsparticles + GSAP 的组合，可根据加载策略动态调整粒子数量，保证体验与性能的平衡。
        </p>
        <div className="rounded-2xl border border-white/30 bg-white/40 p-4 text-center backdrop-blur">
          <ConfettiAnimation />
          <p className="mt-2 text-xs tracking-[0.4em] uppercase">celebrate</p>
        </div>
      </div>
    </div>
  )
}
