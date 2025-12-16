'use client'

import { useState, useEffect } from 'react'
import { Bug, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../ui/ButtonSimple'
import { cn } from '@/lib/utils'

interface DebugInfo {
  performance: {
    loadTime: number
    renderCount: number
    lastRender: number
  }
  network: {
    pendingRequests: number
    completedRequests: number
    failedRequests: number
  }
  cache: {
    size: number
    hitRate: number
  }
  memory: {
    used: number
    total: number
  }
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    performance: {
      loadTime: 0,
      renderCount: 0,
      lastRender: Date.now(),
    },
    network: {
      pendingRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
    },
    cache: {
      size: 0,
      hitRate: 0,
    },
    memory: {
      used: 0,
      total: 0,
    },
  })

  // 监听性能变化（必须在组件顶层调用）
  useEffect(() => {
    // 只在开发环境执行
    if (process.env.NODE_ENV === 'production') {
      return
    }
    const updateDebugInfo = () => {
      setDebugInfo((prev) => ({
        ...prev,
        performance: {
          ...prev.performance,
          renderCount: prev.performance.renderCount + 1,
          lastRender: Date.now(),
        },
        memory: {
          used: (performance as any).memory?.usedJSHeapSize || 0,
          total: (performance as any).memory?.totalJSHeapSize || 0,
        },
      }))
    }

    // 监听路由变化
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          setDebugInfo((prev) => ({
            ...prev,
            performance: {
              ...prev.performance,
              loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
            },
          }))
        }
      })
    })

    try {
      observer.observe({ entryTypes: ['navigation'] })
    } catch (e) {
      // 某些浏览器可能不支持
    }

    const interval = setInterval(updateDebugInfo, 1000)

    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [])

  // 格式化内存大小
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 清除缓存
  const clearCache = () => {
    if (typeof window !== 'undefined' && 'caches' in window) {
      window.caches.keys().then((names) => {
        names.forEach((name) => {
          window.caches.delete(name)
        })
      })
    }
  }

  // 强制重新加载
  const forceReload = () => {
    window.location.reload()
  }

  // 只在开发环境显示
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 font-mono text-xs">
      {/* 切换按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2 flex items-center gap-2 border-yellow-300 bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-900/30"
      >
        <Bug className="h-4 w-4" />
        Debug
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {/* 调试面板 */}
      {isOpen && (
        <div className="w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {/* 标题栏 */}
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
            <h3 className="font-semibold">Debug Panel</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 性能信息 */}
          <div className="space-y-3">
            <div>
              <h4 className="mb-1 font-medium text-gray-900 dark:text-gray-100">Performance</h4>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Load Time:</span>
                  <span>{debugInfo.performance.loadTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Render Count:</span>
                  <span>{debugInfo.performance.renderCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Render:</span>
                  <span>{new Date(debugInfo.performance.lastRender).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {/* 内存信息 */}
            <div>
              <h4 className="mb-1 font-medium text-gray-900 dark:text-gray-100">Memory</h4>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Used:</span>
                  <span>{formatBytes(debugInfo.memory.used)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{formatBytes(debugInfo.memory.total)}</span>
                </div>
              </div>
            </div>

            {/* 网络信息 */}
            <div>
              <h4 className="mb-1 font-medium text-gray-900 dark:text-gray-100">Network</h4>
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span>{debugInfo.network.pendingRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span>{debugInfo.network.completedRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span>{debugInfo.network.failedRequests}</span>
                </div>
              </div>
            </div>

            {/* 工具按钮 */}
            <div className="space-y-2 border-t border-gray-200 pt-2 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCache}
                className="w-full justify-center"
              >
                Clear Cache
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={forceReload}
                className="w-full justify-center"
              >
                Force Reload
              </Button>
            </div>

            {/* 环境信息 */}
            <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span>{process.env.NODE_ENV}</span>
                </div>
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span>{process.env.NEXT_PUBLIC_VERSION || 'dev'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Viewport:</span>
                  <span>
                    {typeof window !== 'undefined'
                      ? `${window.innerWidth}x${window.innerHeight}`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
