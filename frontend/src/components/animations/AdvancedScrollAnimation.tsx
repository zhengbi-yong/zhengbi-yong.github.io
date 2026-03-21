'use client'

import { useRef, ReactNode } from 'react'
import { useGSAP } from '@/components/hooks/useGSAP'
import { getGSAPMobileOptimizedParams } from '@/lib/utils/gsap'
import { gsap } from 'gsap'

interface AnimationConfig {
  property: string
  from: string | number
  to: string | number
  start?: string
  end?: string
  ease?: string
}

interface AdvancedScrollAnimationProps {
  children: ReactNode
  className?: string
  animations: AnimationConfig[]
  scrub?: boolean | number
  trigger?: string | Element
  start?: string
  end?: string
}

export default function AdvancedScrollAnimation({
  children,
  className = '',
  animations,
  scrub = false,
  trigger,
  start = 'top 80%',
  end = 'bottom 20%',
}: AdvancedScrollAnimationProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { duration: optimizedDuration } = getGSAPMobileOptimizedParams(1)

  useGSAP(() => {
    if (!ref.current) return undefined

    const element = ref.current
    const triggerElement = trigger || element

    // 创建 ScrollTrigger 配置
    const scrollTriggerConfig: {
      trigger: string | Element
      start: string
      end: string
      scrub: boolean | number
    } = {
      trigger: triggerElement,
      start,
      end,
      scrub,
    }

    // 创建动画对象
    const animationVars: Record<string, unknown> = {
      ease: 'none',
      scrollTrigger: scrollTriggerConfig,
    }

    // 为每个动画配置添加属性
    animations.forEach((anim) => {
      // 设置初始值
      gsap.set(element, { [anim.property]: anim.from })

      // 添加到动画对象
      animationVars[anim.property] = anim.to

      // 如果有自定义的 ease，使用它
      if (anim.ease) {
        animationVars.ease = anim.ease
      }

      // 如果有自定义的 start/end，更新 ScrollTrigger 配置
      if (anim.start || anim.end) {
        scrollTriggerConfig.start = anim.start || start
        scrollTriggerConfig.end = anim.end || end
      }
    })

    // 创建动画
    const animation = gsap.to(element, animationVars)

    return animation
  }, [animations, scrub, trigger, start, end, optimizedDuration])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
