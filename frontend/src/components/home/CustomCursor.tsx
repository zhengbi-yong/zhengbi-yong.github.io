'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTheme } from 'next-themes'

type CursorVariant = 'default' | 'article' | 'project' | 'music' | 'link' | 'hidden'

const CURSOR_ICONS: Record<CursorVariant, string> = {
  default: '',
  article: '📖',
  project: '→',
  music: '♪',
  link: '↗',
  hidden: '',
}

export default function CustomCursor() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)
  const [variant, setVariant] = useState<CursorVariant>('default')
  const [mounted, setMounted] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  const pos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    pos.current.targetX = e.clientX
    pos.current.targetY = e.clientY
  }, [])

  // Detect hover targets
  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    const closestLink = target.closest('a, button, [role="button"]')
    const closestArticle = target.closest('[data-cursor="article"]')
    const closestProject = target.closest('[data-cursor="project"]')
    const closestMusic = target.closest('[data-cursor="music"]')

    if (closestMusic) setVariant('music')
    else if (closestProject) setVariant('project')
    else if (closestArticle) setVariant('article')
    else if (closestLink) setVariant('link')
    else setVariant('default')
  }, [])

  useEffect(() => {
    setMounted(true)

    // Detect touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true)
      return () => {}
    }

    // Reduced motion check
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsTouchDevice(true)
      return () => {}
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseover', handleMouseOver)

    // Animation loop
    let raf: number
    const animate = () => {
      pos.current.x += (pos.current.targetX - pos.current.x) * 0.12
      pos.current.y += (pos.current.targetY - pos.current.y) * 0.12

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`
      }
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate(${pos.current.targetX}px, ${pos.current.targetY}px)`
      }

      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    // Hide system cursor
    document.documentElement.classList.add('custom-cursor-active')

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseover', handleMouseOver)
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('custom-cursor-active')
    }
  }, [handleMouseMove, handleMouseOver])

  // Don't render on touch devices or before mount
  if (!mounted || isTouchDevice) return null

  const showIcon = variant !== 'default' && variant !== 'hidden'
  const size = variant === 'default' ? 40 : variant === 'hidden' ? 0 : 56

  return (
    <>
      {/* Outer ring */}
      <div
        ref={cursorRef}
        className={`fixed top-0 left-0 pointer-events-none z-[9999] ${isDark ? 'mix-blend-difference' : ''}`}
        style={{
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          transition: 'width 0.3s ease-out, height 0.3s ease-out, opacity 0.3s ease-out',
          opacity: variant === 'hidden' ? 0 : 1,
        }}
      >
        <div
          className="w-full h-full rounded-full border transition-colors duration-300 flex items-center justify-center"
          style={{
            borderColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
            backgroundColor: showIcon
              ? isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
              : 'transparent',
          }}
        >
          {showIcon && (
            <span className="text-xs select-none" style={{ color: isDark ? 'white' : 'black' }}>
              {CURSOR_ICONS[variant]}
            </span>
          )}
        </div>
      </div>

      {/* Inner dot */}
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          width: 6,
          height: 6,
          marginLeft: -3,
          marginTop: -3,
        }}
      >
        <div
          className="w-full h-full rounded-full transition-colors duration-300"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)',
          }}
        />
      </div>
    </>
  )
}
