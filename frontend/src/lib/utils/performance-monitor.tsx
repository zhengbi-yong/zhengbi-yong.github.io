'use client'

/**
 * PerformanceMonitor - 性能监控组件
 *
 * 功能：
 * - Core Web Vitals监控
 * - 性能指标收集
 * - 自定义性能追踪
 * - 性能报告生成
 */

import { useEffect, useRef } from 'react'

interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number  // First Contentful Paint
  lcp?: number  // Largest Contentful Paint
  fid?: number  // First Input Delay
  cls?: number  // Cumulative Layout Shift
  ttfb?: number // Time to First Byte

  // Custom metrics
  pageLoadTime?: number
  domContentLoaded?: number
  firstRender?: number

  // Resource metrics
  resourceCount?: number
  totalTransferSize?: number
}

interface PerformanceMonitorProps {
  onReport?: (metrics: PerformanceMetrics) => void
  reportInterval?: number // ms
  enableLogging?: boolean
}

export function PerformanceMonitor({
  onReport,
  reportInterval = 5000,
  enableLogging = process.env.NODE_ENV === 'development',
}: PerformanceMonitorProps) {
  const metricsRef = useRef<PerformanceMetrics>({})
  const observerRef = useRef<PerformanceObserver | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return undefined
    }

    // Collect all metrics
    const collectMetrics = () => {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

      if (perfData) {
        // Navigation timing
        metricsRef.current.ttfb = perfData.responseStart - perfData.requestStart
        metricsRef.current.pageLoadTime = perfData.loadEventEnd - perfData.fetchStart
        metricsRef.current.domContentLoaded = perfData.domContentLoadedEventEnd - perfData.fetchStart
      }

      // FCP: First Contentful Paint
      const fcpEntries = window.performance.getEntriesByName('first-contentful-paint')
      if (fcpEntries.length > 0) {
        metricsRef.current.fcp = fcpEntries[0].startTime
      }

      // Resource metrics
      const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      metricsRef.current.resourceCount = resources.length
      metricsRef.current.totalTransferSize = resources.reduce(
        (sum, resource) => sum + (resource.transferSize || 0),
        0
      )

      // Log metrics in development
      if (enableLogging) {
        console.log('📊 Performance Metrics:', metricsRef.current)
      }

      // Report metrics
      onReport?.(metricsRef.current)
    }

    // Create PerformanceObserver
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Handle LCP
          if (entry.entryType === 'largest-contentful-paint') {
            metricsRef.current.lcp = entry.startTime
          }

          // Handle FID
          if (entry.entryType === 'first-input') {
            const fidEntry = entry as any // PerformanceEventTiming
            metricsRef.current.fid = fidEntry.processingStart - fidEntry.startTime
          }

          // Handle CLS
          if (entry.entryType === 'layout-shift') {
            const clsEntry = entry as any // LayoutShift
            if (!clsEntry.hadRecentInput) {
              metricsRef.current.cls = (metricsRef.current.cls || 0) + clsEntry.value
            }
          }
        }

        // Collect and report after each batch of entries
        collectMetrics()
      })

      observer.observe({
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'],
      })

      observerRef.current = observer
    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }

    // Initial metrics collection
    const timeoutId = setTimeout(collectMetrics, 1000)

    // Periodic reporting
    const intervalId = setInterval(collectMetrics, reportInterval)

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
      observerRef.current?.disconnect()
    }
  }, [onReport, reportInterval, enableLogging])

  // Measure first render time
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const startTime = performance.now()
    return () => {
      const endTime = performance.now()
      metricsRef.current.firstRender = endTime - startTime
    }
  }, [])

  return null
}

/**
 * Custom hook for measuring render performance
 */
export function useRenderTime(componentName: string) {
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
      return undefined
    }

    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime

      if (renderTime > 16) { // Log if render takes longer than one frame (60fps)
        console.warn(`⚠️ ${componentName} slow render: ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [componentName])
}

/**
 * Measure async operation performance
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  try {
    const result = await fn()
    const endTime = performance.now()
    const duration = endTime - startTime

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    }

    return result
  } catch (error) {
    const endTime = performance.now()
    const duration = endTime - startTime
    console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error)
    throw error
  }
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metrics: PerformanceMetrics) {
  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      Object.entries(metrics).forEach(([name, value]) => {
        if (value !== undefined) {
          (window as any).gtag('event', name, {
            event_category: 'Web Vitals',
            value: Math.round(name === 'cls' ? value * 1000 : value),
            non_interaction: true,
          })
        }
      })
    }
  }
}

export default PerformanceMonitor
