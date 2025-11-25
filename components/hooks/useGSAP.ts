'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { registerGSAPPlugins, cleanupScrollTrigger } from '@/lib/utils/gsap'

/**
 * useGSAP Hook
 * 用于管理 GSAP 动画的生命周期
 *
 * @param callback 动画设置函数，接收 gsap 和 ScrollTrigger 作为参数
 * @param dependencies 依赖数组，当依赖变化时重新执行动画
 */
export function useGSAP(
  callback: (
    gsapInstance: typeof gsap,
    scrollTrigger: typeof ScrollTrigger
  ) => void | gsap.core.Tween | gsap.core.Timeline,
  dependencies: React.DependencyList = []
) {
  const hasInitialized = useRef(false)
  const animationRef = useRef<gsap.core.Tween | gsap.core.Timeline | null>(null)
  const scrollTriggerRef = useRef<ScrollTrigger[]>([])

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return

    // 注册插件（只注册一次）
    if (!hasInitialized.current) {
      registerGSAPPlugins()
      hasInitialized.current = true
    }

    // 执行动画回调
    const animation = callback(gsap, ScrollTrigger)

    // 保存动画引用（如果是 Timeline 或 Tween）
    if (
      animation &&
      (animation instanceof gsap.core.Timeline || animation instanceof gsap.core.Tween)
    ) {
      animationRef.current = animation

      // 如果动画有 ScrollTrigger，保存引用
      if (animation.scrollTrigger) {
        scrollTriggerRef.current.push(animation.scrollTrigger)
      }
    }

    // 刷新 ScrollTrigger 以确保正确计算位置
    ScrollTrigger.refresh()

    // 清理函数
    return () => {
      // 只清理当前组件创建的 ScrollTrigger
      scrollTriggerRef.current.forEach((trigger) => {
        trigger.kill()
      })
      scrollTriggerRef.current = []

      // 清理动画
      if (animationRef.current) {
        if (animationRef.current instanceof gsap.core.Timeline) {
          animationRef.current.kill()
        } else if (animationRef.current instanceof gsap.core.Tween) {
          animationRef.current.kill()
        }
        animationRef.current = null
      }
    }
  }, dependencies)

  return animationRef.current
}
