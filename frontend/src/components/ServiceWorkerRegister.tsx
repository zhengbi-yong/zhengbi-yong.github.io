'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const isDevelopment = process.env.NODE_ENV !== 'production'
    const isServiceWorkerExplicitlyDisabled = process.env.NEXT_PUBLIC_DISABLE_SW === 'true'
    const isServiceWorkerExplicitlyEnabled = process.env.NEXT_PUBLIC_ENABLE_SW === 'true'
    const shouldRegisterServiceWorker =
      !isServiceWorkerExplicitlyDisabled &&
      (!isDevelopment || isServiceWorkerExplicitlyEnabled)

    let isCancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let idleCallbackId: number | undefined

    const cleanupServiceWorker = async (): Promise<void> => {
      try {
        const { unregisterServiceWorker } = await import('@/lib/sw-register')
        await unregisterServiceWorker({ clearCaches: true })
      } catch (error) {
        logger.error('[SW] Failed to clean up Service Worker registrations:', error)
      }
    }

    if (!shouldRegisterServiceWorker) {
      logger.debug('[SW] Service Worker is disabled for this session')
      void cleanupServiceWorker()
      return undefined
    }

    const registerSW = async (): Promise<void> => {
      if (isCancelled) {
        return
      }

      try {
        const { registerServiceWorker } = await import('@/lib/sw-register')
        await registerServiceWorker()
      } catch (error) {
        logger.error('[SW] Failed to register Service Worker:', error)
      }
    }

    if ('requestIdleCallback' in window) {
      idleCallbackId = window.requestIdleCallback(() => {
        void registerSW()
      }, { timeout: 2000 })
    } else {
      timeoutId = setTimeout(() => {
        void registerSW()
      }, 2000)
    }

    return () => {
      isCancelled = true

      if (idleCallbackId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId)
      }

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  return null
}
