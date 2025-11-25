'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/sw-register'

/**
 * Service Worker 注册组件
 * 在客户端注册 Service Worker，实现页面缓存和离线支持
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    // 只在客户端注册
    if (typeof window !== 'undefined') {
      registerServiceWorker().catch((error) => {
        console.error('[SW] Failed to register Service Worker:', error)
      })
    }
  }, [])

  // 此组件不渲染任何内容
  return null
}

