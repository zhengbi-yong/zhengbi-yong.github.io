'use client'

import { useRef, ReactNode } from 'react'
import { useGSAP } from '@/components/hooks/useGSAP'
import { getGSAPMobileOptimizedParams } from '@/lib/utils/gsap'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface SVGPathAnimationProps {
  path: string // SVG path 数据
  strokeColor?: string
  strokeWidth?: number
  duration?: number
  className?: string
  autoPlay?: boolean
  trigger?: string | Element
  start?: string
}

export default function SVGPathAnimation({
  path,
  strokeColor = '#000000',
  strokeWidth = 2,
  duration = 2,
  className = '',
  autoPlay = true,
  trigger,
  start = 'top 80%',
}: SVGPathAnimationProps) {
  const svgRef = useRef<SVGPathElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { duration: optimizedDuration } = getGSAPMobileOptimizedParams(duration)

  useGSAP(() => {
    if (!svgRef.current) return

    const pathElement = svgRef.current
    const container = containerRef.current

    // 获取路径总长度
    const pathLength = pathElement.getTotalLength()

    // 设置初始状态：描边不可见，设置 dasharray 和 dashoffset
    pathElement.style.strokeDasharray = `${pathLength}`
    pathElement.style.strokeDashoffset = `${pathLength}`

    // 创建动画
    const animation = gsap.to(pathElement, {
      strokeDashoffset: 0,
      duration: optimizedDuration,
      ease: 'power2.out',
      scrollTrigger: autoPlay
        ? undefined
        : {
            trigger: trigger || container || pathElement,
            start,
            end: 'bottom 20%',
            once: true,
            toggleActions: 'play none none none',
          },
    })

    // 如果 autoPlay 为 true，立即播放
    if (autoPlay) {
      animation.play()
    }

    return animation
  }, [path, duration, autoPlay, trigger, start, optimizedDuration])

  return (
    <div ref={containerRef} className={className}>
      <svg
        className="w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        <path
          ref={svgRef}
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
