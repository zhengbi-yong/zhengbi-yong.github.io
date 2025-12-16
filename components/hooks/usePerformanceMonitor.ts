'use client'

import { useEffect, useRef } from 'react'

interface PerformanceMetrics {
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  firstInputDelay?: number
  cumulativeLayoutShift?: number
  timeToInteractive?: number
}

interface UsePerformanceMonitorOptions {
  reportToAnalytics?: boolean
  threshold?: {
    fcp?: number // First Contentful Paint (ms)
    lcp?: number // Largest Contentful Paint (ms)
    fid?: number // First Input Delay (ms)
    cls?: number // Cumulative Layout Shift
    tti?: number // Time to Interactive (ms)
  }
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const {
    reportToAnalytics = false,
    threshold = {
      fcp: 2000,
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      tti: 3800,
    },
  } = options

  const metricsRef = useRef<PerformanceMetrics>({})
  const observerRef = useRef<PerformanceObserver | null>(null)

  useEffect(() => {
    // 检查是否支持 Performance API
    if (typeof window === 'undefined' || !window.performance) {
      return
    }

    // 监听 Web Vitals
    const measureWebVitals = () => {
      // First Contentful Paint
      const fcpEntry = performance.getEntriesByName(
        'first-contentful-paint'
      )[0] as PerformancePaintTiming
      if (fcpEntry) {
        metricsRef.current.firstContentfulPaint = fcpEntry.startTime
        checkThreshold('FCP', fcpEntry.startTime, threshold.fcp!)
      }

      // 监听 LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry && lastEntry.startTime) {
            metricsRef.current.largestContentfulPaint = lastEntry.startTime
            checkThreshold('LCP', lastEntry.startTime, threshold.lcp!)
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      }

      // 监听 FID (First Input Delay)
      if ('PerformanceObserver' in window) {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              const fid = entry.processingStart - entry.startTime
              metricsRef.current.firstInputDelay = fid
              checkThreshold('FID', fid, threshold.fid!)
            }
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      }

      // 监听 CLS (Cumulative Layout Shift)
      if ('PerformanceObserver' in window) {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          }
          metricsRef.current.cumulativeLayoutShift = clsValue
          checkThreshold('CLS', clsValue, threshold.cls!)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      }
    }

    // 监听长任务
    const observeLongTasks = () => {
      if ('PerformanceObserver' in window) {
        const longTaskObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            console.warn('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
            })
          }
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      }
    }

    // 测量 Time to Interactive
    const measureTTI = () => {
      if ('PerformanceObserver' in window) {
        const ttiObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.entryType === 'measure' && entry.name === 'tti') {
              metricsRef.current.timeToInteractive = entry.startTime
              checkThreshold('TTI', entry.startTime, threshold.tti!)
            }
          }
        })
        ttiObserver.observe({ entryTypes: ['measure'] })
      }
    }

    // 检查阈值并发送警告
    const checkThreshold = (metric: string, value: number, threshold: number) => {
      if (value > threshold) {
        console.warn(`${metric} exceeds threshold:`, {
          value,
          threshold,
          percentage: (((value - threshold) / threshold) * 100).toFixed(2) + '%',
        })

        // 发送到分析服务
        if (reportToAnalytics) {
          // TODO: 实现分析服务上报
          // analytics.track('performance_threshold_exceeded', {
          //   metric,
          //   value,
          //   threshold,
          // })
        }
      }
    }

    // 开始测量
    measureWebVitals()
    observeLongTasks()
    measureTTI()

    // 获取初始页面加载性能
    const navigationEntry = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      console.log('Page Load Performance:', {
        domContentLoaded:
          navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
        loadComplete: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
        totalTime: navigationEntry.loadEventEnd - navigationEntry.fetchStart,
      })
    }

    return () => {
      // 清理观察者
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [reportToAnalytics, threshold])

  // 获取当前指标
  const getMetrics = () => metricsRef.current

  // 手动记录性能标记
  const mark = (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name)
    }
  }

  // 测量两个标记之间的时间
  const measure = (name: string, startMark: string, endMark?: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.measure(name, startMark, endMark)
      const measureEntry = window.performance.getEntriesByName(name, 'measure')[0]
      if (measureEntry) {
        return measureEntry.duration
      }
    }
    return null
  }

  return {
    metrics: metricsRef.current,
    getMetrics,
    mark,
    measure,
  }
}
