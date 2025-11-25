'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/sw-register'

/**
 * Service Worker 注册组件
 * 在客户端注册 Service Worker，实现页面缓存和离线支持
 * 延迟注册，不阻塞首屏渲染
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    // 只在客户端注册
    if (typeof window === 'undefined') {
      return
    }

    // 延迟注册 Service Worker，不阻塞首屏渲染
    // 使用 requestIdleCallback 在浏览器空闲时执行，降级到 setTimeout
    const registerSW = () => {
      registerServiceWorker().catch((error) => {
        console.error('[SW] Failed to register Service Worker:', error)
      })
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

