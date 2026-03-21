'use client'

import { useRef } from 'react'
import { useGSAP } from '@/components/hooks/useGSAP'
import { getGSAPMobileOptimizedParams } from '@/lib/utils/gsap'
import { gsap } from 'gsap'

interface SVGShapeMorphProps {
  paths: string[] // 多个 SVG path 数据
  duration?: number
  className?: string
  trigger?: string | Element
  start?: string
  strokeColor?: string
  strokeWidth?: number
  fill?: string
}

export default function SVGShapeMorph({
  paths,
  duration = 1,
  className = '',
  trigger,
  start = 'top 80%',
  strokeColor = '#000000',
  strokeWidth = 2,
  fill = 'none',
}: SVGShapeMorphProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { duration: optimizedDuration } = getGSAPMobileOptimizedParams(duration)

  useGSAP(() => {
    if (!pathRef.current || paths.length === 0) return undefined

    const pathElement = pathRef.current
    const container = containerRef.current

    // 设置初始路径
    pathElement.setAttribute('d', paths[0])

    // 如果只有一个路径，不需要变形动画
    if (paths.length === 1) return undefined

    // 创建时间线
    const tl = gsap.timeline({
      scrollTrigger:
        trigger || container || pathElement
          ? {
              trigger: trigger || container || pathElement,
              start,
              end: 'bottom 20%',
              once: true,
              toggleActions: 'play none none none',
            }
          : undefined,
    })

    // 为每个路径创建变形动画
    paths.forEach((path, index) => {
      if (index === 0) return // 跳过第一个（初始状态）

      tl.to(pathElement, {
        attr: { d: path },
        duration: optimizedDuration / paths.length,
        ease: 'power2.inOut',
      })
    })

    return tl
  }, [paths, duration, trigger, start, optimizedDuration])

  return (
    <div ref={containerRef} className={className}>
      <svg
        className="w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        <path
          ref={pathRef}
          fill={fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
