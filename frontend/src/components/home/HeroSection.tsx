'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Canvas } from '@react-three/fiber'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'

// Dynamic import for Three.js particle content (hooks run inside Canvas)
const ParticleScene = dynamic(
  () => import('@/components/home/ParticleBackground'),
  { ssr: false }
)

interface HeroSectionProps {
  scrollProgress: number
}

export default function HeroSection({ scrollProgress }: HeroSectionProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section
      className="relative flex h-screen items-center justify-center overflow-hidden"
      aria-label="Hero"
    >
      {/* Particle Background */}
      {mounted && (
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <Canvas
            camera={{ position: [0, 0, 5], fov: 75 }}
            dpr={[1, 2]}
            gl={{ antialias: false, alpha: true }}
            style={{ background: 'transparent' }}
          >
            <ParticleScene scrollProgress={scrollProgress} />
          </Canvas>
        </div>
      )}

      {/* Gradient overlay for text readability */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? 'bg-gradient-to-b from-[#0A0A0F]/60 via-transparent to-[#0A0A0F]/80'
            : 'bg-gradient-to-b from-white/50 via-transparent to-white/70'
        }`}
        style={{ zIndex: 1 }}
      />

      {/* Hero Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-6xl mx-auto">
        {/* Main Title */}
        <motion.h1
          className={`font-visitor-serif mb-6 leading-[0.9] tracking-tight ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
          style={{
            fontSize: 'clamp(3rem, 8vw, 8rem)',
            mixBlendMode: 'difference',
          }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Zhengbi Yong
        </motion.h1>

        {/* Bilingual Subtitle */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <span
            className={`text-sm sm:text-base tracking-[0.3em] uppercase ${
              isDark ? 'text-indigo-300/80' : 'text-cyan-700/80'
            }`}
          >
            Robotics
          </span>
          <span className={`hidden sm:block ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
            ·
          </span>
          <span
            className={`text-sm sm:text-base tracking-[0.3em] uppercase ${
              isDark ? 'text-purple-300/80' : 'text-teal-700/80'
            }`}
          >
            Multimodal Perception
          </span>
          <span className={`hidden sm:block ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
            ·
          </span>
          <span
            className={`text-sm sm:text-base tracking-[0.3em] uppercase ${
              isDark ? 'text-amber-300/80' : 'text-sky-700/80'
            }`}
          >
            Music
          </span>
        </motion.div>

        {/* Chinese subtitle */}
        <motion.p
          className={`text-base sm:text-lg tracking-wider ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          机器人 · 多模态感知 · 音乐
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <span
          className={`text-[10px] tracking-[0.3em] uppercase ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          Scroll
        </span>
        <div className="w-px h-12 relative overflow-hidden">
          <motion.div
            className={`w-full h-full ${
              isDark ? 'bg-gradient-to-b from-indigo-400 to-transparent' : 'bg-gradient-to-b from-indigo-600 to-transparent'
            }`}
            animate={{ y: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </section>
  )
}
