import { logger } from './utils/logger'

const SW_URL = '/sw.js'
const SW_CACHE_PREFIX = 'blog-cache-'

function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator
}

async function getServiceWorkerRegistrations(): Promise<ServiceWorkerRegistration[]> {
  if (!isServiceWorkerSupported()) {
    return []
  }

  if (typeof navigator.serviceWorker.getRegistrations === 'function') {
    return Array.from(await navigator.serviceWorker.getRegistrations())
  }

  const registration = await navigator.serviceWorker.getRegistration()
  return registration ? [registration] : []
}

async function clearServiceWorkerCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return
  }

  const cacheNames = await caches.keys()
  const serviceWorkerCaches = cacheNames.filter((cacheName) => cacheName.startsWith(SW_CACHE_PREFIX))

  if (serviceWorkerCaches.length === 0) {
    return
  }

  await Promise.all(serviceWorkerCaches.map((cacheName) => caches.delete(cacheName)))
  logger.log('[SW] Cleared Service Worker caches:', serviceWorkerCaches)
}

export async function registerServiceWorker(): Promise<void> {
  if (!isServiceWorkerSupported()) {
    logger.debug('[SW] Service Worker not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/',
    })

    logger.log('[SW] Service Worker registered:', registration.scope)

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) {
        return
      }

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          logger.log('[SW] New version available, please refresh the page')
        }
      })
    })

    if (process.env.NODE_ENV === 'production') {
      await registration.update()
    } else {
      logger.debug('[SW] Skipping registration.update() outside production')
    }
  } catch (error) {
    logger.error('[SW] Service Worker registration failed:', error)
  }
}

export async function unregisterServiceWorker(
  options: { clearCaches?: boolean } = {}
): Promise<void> {
  if (!isServiceWorkerSupported()) {
    return
  }

  try {
    const registrations = await getServiceWorkerRegistrations()

    if (registrations.length > 0) {
      const results = await Promise.all(
        registrations.map((registration) => registration.unregister())
      )
      const unregisteredCount = results.filter(Boolean).length
      logger.log(`[SW] Unregistered ${unregisteredCount} Service Worker registration(s)`)
    }

    if (options.clearCaches) {
      await clearServiceWorkerCaches()
    }
  } catch (error) {
    logger.error('[SW] Service Worker unregistration failed:', error)
  }
}

export async function isServiceWorkerRegistered(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false
  }

  try {
    const registrations = await getServiceWorkerRegistrations()
    return registrations.length > 0
  } catch {
    return false
  }
}
