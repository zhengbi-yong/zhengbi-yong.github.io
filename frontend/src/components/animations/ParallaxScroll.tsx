'use client'

import { useRef, ReactNode } from 'react'
import { useGSAP } from '@/components/hooks/useGSAP'
import { isMobileDevice } from '@/lib/utils/device'
import { gsap } from 'gsap'

interface ParallaxScrollProps {
  children: ReactNode
  speed?: number // 视差速度，范围 -1 到 1
  className?: string
  direction?: 'vertical' | 'horizontal'
}

export default function ParallaxScroll({
  children,
  speed = 0.5,
  className = '',
  direction = 'vertical',
}: ParallaxScrollProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!ref.current) return

    const element = ref.current
    const isMobile = isMobileDevice()
    // 移动设备上降低视差强度
    const adjustedSpeed = isMobile ? speed * 0.5 : speed

    const property = direction === 'vertical' ? 'y' : 'x'
    const distance = adjustedSpeed * 100

    gsap.to(element, {
      [property]: distance,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    })
  }, [speed, direction])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
