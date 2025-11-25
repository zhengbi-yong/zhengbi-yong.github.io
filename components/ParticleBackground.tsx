'use client'

import { useEffect, useMemo, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { loadFull } from 'tsparticles'
import type { Engine } from '@tsparticles/engine'
import { useTheme } from 'next-themes'
import { isMobileDevice } from '@/lib/utils/device'

interface ParticleBackgroundProps {
  className?: string
  particleCount?: number
  color?: string
  speed?: number
}

// 全局引擎初始化状态，避免多个实例重复初始化
let engineInitialized = false
let engineInitPromise: Promise<void> | null = null

/**
 * ParticleBackground - 粒子背景特效组件
 * 使用 tsparticles 高性能粒子库实现
 * 支持深色/浅色主题自动适配
 */
export default function ParticleBackground({
  className = '',
  particleCount = 40,
  color,
  speed = 0.5,
}: ParticleBackgroundProps) {
  // 移动设备优化：减少粒子数量
  const isMobile = isMobileDevice()
  const optimizedParticleCount = isMobile ? Math.min(particleCount, 30) : particleCount

  // 使用 next-themes 检测主题
  const { resolvedTheme } = useTheme()

  // 引擎初始化状态
  const [init, setInit] = useState(engineInitialized)

  // 客户端挂载状态
  const [mounted, setMounted] = useState(false)

  // 客户端挂载和引擎初始化
  useEffect(() => {
    setMounted(true)

    // 如果引擎已经初始化，直接设置状态
    if (engineInitialized) {
      setInit(true)
      return
    }

    // 如果正在初始化，等待完成
    if (engineInitPromise) {
      engineInitPromise.then(() => {
        setInit(true)
      })
      return
    }

    // 开始初始化引擎
    engineInitPromise = initParticlesEngine(async (engine: Engine) => {
      try {
        await loadSlim(engine)
      } catch {
        // 如果 loadSlim 失败，使用 loadFull
        await loadFull(engine)
      }
    })
      .then(() => {
        engineInitialized = true
        setInit(true)
      })
      .catch(() => {
        // 静默处理错误
        engineInitPromise = null
      })
  }, [])

  // 计算主题颜色
  const themeColor = useMemo(() => {
    if (color) return color

    if (!mounted) return '#000000'

    // 使用 resolvedTheme，如果未定义则检查 DOM
    const isDark =
      resolvedTheme === 'dark' ||
      (resolvedTheme === undefined &&
        typeof window !== 'undefined' &&
        document.documentElement.classList.contains('dark'))

    return isDark ? '#ffffff' : '#000000'
  }, [color, resolvedTheme, mounted])

  // 粒子配置
  const particlesOptions = useMemo(
    () => ({
      background: {
        color: {
          value: 'transparent',
        },
      },
      fpsLimit: 60,
      particles: {
        number: {
          value: optimizedParticleCount,
          density: {
            enable: true,
            value_area: 800,
          },
        },
        color: {
          value: themeColor,
        },
        shape: {
          type: 'circle',
        },
        opacity: {
          value: 0.3,
          random: false,
          anim: {
            enable: false,
          },
        },
        size: {
          value: { min: 1, max: 3 },
          random: true,
          anim: {
            enable: false,
          },
        },
        links: {
          enable: true,
          distance: 150,
          color: themeColor,
          opacity: 0.2,
          width: 0.5,
          triangles: {
            enable: false,
          },
        },
        move: {
          enable: true,
          speed: speed * 2,
          direction: 'none',
          random: false,
          straight: false,
          outModes: {
            default: 'bounce',
          },
        },
        collisions: {
          enable: false,
        },
      },
      interactivity: {
        detectsOn: 'window' as const,
        events: {
          onHover: {
            enable: false,
          },
          onClick: {
            enable: false,
          },
          resize: true,
        },
        modes: {},
      },
      detectRetina: true,
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
    }),
    [optimizedParticleCount, speed, themeColor]
  )

  // 等待引擎初始化完成
  if (!init) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 ${className}`}
        style={{ zIndex: 0, width: '100%', height: '100%' }}
      />
    )
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ zIndex: 0, width: '100%', height: '100%' }}
    >
      <Particles
        id="tsparticles"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options={particlesOptions as any}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  )
}
