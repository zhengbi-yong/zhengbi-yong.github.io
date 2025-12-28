'use client'

import { useEffect } from 'react'

/**
 * Service Worker 注册组件
 * 在客户端注册 Service Worker，实现页面缓存和离线支持
 * 延迟注册，不阻塞首屏渲染
 *
 * 使用动态导入避免 Next.js 16 + Turbopack HMR 问题
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    // 只在客户端注册
    if (typeof window === 'undefined') {
      return
    }

    // 开发环境下可以通过环境变量禁用 Service Worker
    if (process.env.NEXT_PUBLIC_DISABLE_SW === 'true') {
      logger.debug('[SW] Service Worker disabled by NEXT_PUBLIC_DISABLE_SW')
      return
    }

    // 延迟注册 Service Worker，不阻塞首屏渲染
    // 使用 requestIdleCallback 在浏览器空闲时执行，降级到 setTimeout
    const registerSW = async () => {
      try {
        // 使用动态导入避免 HMR 模块工厂问题
        const { registerServiceWorker } = await import('@/lib/sw-register')
        await registerServiceWorker()
      } catch (error) {
        logger.error('[SW] Failed to register Service Worker:', error)
      }
    }

    // 优先使用 requestIdleCallback，降级到 setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(registerSW, { timeout: 2000 })
    } else {
      // 降级方案：2秒后执行
      setTimeout(registerSW, 2000)
    }
  }, [])

  // 此组件不渲染任何内容
  return null
}
