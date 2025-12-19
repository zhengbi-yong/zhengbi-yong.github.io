'use client'

import { useEffect, useRef, useState } from 'react'

interface PerformanceMetrics {
  fps: number
  frameTime: number
  isLowPerformance: boolean
}

/**
 * useGSAPPerformance Hook
 * 用于监控 GSAP 动画的性能，并在低性能设备上自动降级
 */
export function useGSAPPerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    isLowPerformance: false,
  })

  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    const measurePerformance = () => {
      const now = performance.now()
      const deltaTime = now - lastTimeRef.current

      frameCountRef.current++

      // 每秒更新一次性能指标
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / deltaTime)
        const frameTime = deltaTime / frameCountRef.current

        // 判断是否为低性能设备（FPS < 30 或帧时间 > 33ms）
        const isLowPerformance = fps < 30 || frameTime > 33

        setMetrics({
          fps,
          frameTime: Math.round(frameTime * 100) / 100,
          isLowPerformance,
        })

        frameCountRef.current = 0
        lastTimeRef.current = now
      }

      rafIdRef.current = requestAnimationFrame(measurePerformance)
    }

    rafIdRef.current = requestAnimationFrame(measurePerformance)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  return metrics
}

/**
 * 检测设备性能等级
 * @returns 'high' | 'medium' | 'low'
 */
export function getDevicePerformanceLevel(): 'high' | 'medium' | 'low' {
  if (typeof window === 'undefined') return 'high'

  // 检测硬件并发数（CPU 核心数）
  const hardwareConcurrency = navigator.hardwareConcurrency || 2

  // 检测内存（如果可用）
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4

  // 检测是否为移动设备
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    navigator.userAgent
  )

  // 综合判断
  if (hardwareConcurrency >= 8 && memory >= 8 && !isMobile) {
    return 'high'
  } else if (hardwareConcurrency >= 4 && memory >= 4) {
    return 'medium'
  } else {
    return 'low'
  }
}

/**
 * 根据性能等级获取动画参数
 * @param baseDuration 基础动画时长
 * @param baseDistance 基础动画距离
 * @returns 优化后的参数
 */
export function getPerformanceOptimizedParams(baseDuration: number = 1, baseDistance: number = 50) {
  const performanceLevel = getDevicePerformanceLevel()

  switch (performanceLevel) {
    case 'high':
      return {
        duration: baseDuration,
        distance: baseDistance,
        particleCount: 100,
      }
    case 'medium':
      return {
        duration: baseDuration * 0.8,
        distance: baseDistance * 0.8,
        particleCount: 50,
      }
    case 'low':
      return {
        duration: baseDuration * 0.6,
        distance: baseDistance * 0.6,
        particleCount: 25,
      }
  }
}
