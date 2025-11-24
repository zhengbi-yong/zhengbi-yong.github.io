'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
  
  // 客户端挂载状态
  const [mounted, setMounted] = useState(false)
  
  // 实际检测到的主题状态
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // 主题状态，用于触发重新渲染
  const [themeKey, setThemeKey] = useState(0)
  
  // 引擎初始化状态
  const [init, setInit] = useState(false)

  // 确保在客户端挂载后才检测主题
  useEffect(() => {
    setMounted(true)
    
    // 检测当前主题
    const checkTheme = () => {
      if (typeof window === 'undefined') return false
      // 直接检查 DOM，这是最可靠的方法
      const hasDarkClass = document.documentElement.classList.contains('dark')
      setIsDarkMode(hasDarkClass)
      return hasDarkClass
    }
    
    // 使用 setTimeout 确保 DOM 已完全加载
    const timer = setTimeout(() => {
      checkTheme()
    }, 0)
    
    // 立即检测一次（作为备用）
    checkTheme()
    
    // 监听 DOM 变化
    const observer = new MutationObserver(() => {
      checkTheme()
      setThemeKey((prev) => prev + 1)
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  // 预初始化 tsparticles 引擎
  useEffect(() => {
    if (init) return

    initParticlesEngine(async (engine: Engine) => {
      try {
        await loadSlim(engine)
      } catch (error) {
        try {
          await loadFull(engine)
        } catch (fullError) {
          throw fullError
        }
      }
    })
      .then(() => {
        setInit(true)
      })
      .catch(() => {
        // 静默处理错误，避免影响用户体验
      })
  }, [init])

  // 初始化回调（用于兼容，但主要使用预初始化）
  const particlesInit = useCallback(async (_engine: Engine) => {
    // 引擎已经通过 initParticlesEngine 初始化
  }, [])

  // 粒子加载完成回调
  const particlesLoaded = useCallback(async (_container: any) => {
    // 粒子加载完成
  }, [])

  // 检测主题颜色
  const getThemeColor = useCallback(() => {
    if (color) return color
    
    // 如果还未挂载，默认返回黑色（白天模式）
    if (!mounted) {
      return '#000000'
    }
    
    // 使用实际检测到的主题状态
    // 白天模式（浅色背景）使用深色粒子，夜晚模式（深色背景）使用浅色粒子
    return isDarkMode ? '#ffffff' : '#000000'
  }, [color, isDarkMode, mounted])

  // 监听主题变化，更新粒子颜色
  useEffect(() => {
    if (!mounted) return
    // 当 isDarkMode 变化时，更新 key 触发重新渲染
    setThemeKey((prev) => prev + 1)
  }, [isDarkMode, mounted])

  // 粒子配置
  const particlesOptions = useMemo(() => {
    // 直接计算主题颜色，不依赖 getThemeColor
    let themeColor = color
    if (!themeColor) {
      if (!mounted) {
        themeColor = '#000000' // 默认黑色
      } else {
        themeColor = isDarkMode ? '#ffffff' : '#000000'
      }
    }

    return {
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
        detectsOn: 'window',
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
    }
  }, [optimizedParticleCount, speed, color, isDarkMode, mounted, themeKey])

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
        key={`tsparticles-${themeKey}`}
        id={`tsparticles-${themeKey}`}
        init={particlesInit}
        loaded={particlesLoaded}
        options={particlesOptions}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  )
}
