/**
 * Service Worker 注册和管理
 * 用于实现页面缓存和离线支持
 */

const SW_URL = '/sw.js'
const SW_VERSION = 'v1.0.0'

/**
 * 检查浏览器是否支持 Service Worker
 */
function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator
}

/**
 * 注册 Service Worker
 */
export async function registerServiceWorker(): Promise<void> {
  if (!isServiceWorkerSupported()) {
    console.debug('[SW] Service Worker not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/',
    })

    console.log('[SW] Service Worker registered:', registration.scope)

    // 监听更新
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // 新版本已安装，提示用户刷新
          console.log('[SW] New version available, please refresh the page')
          // 可以在这里显示更新提示
        }
      })
    })

    // 检查更新
    await registration.update()
  } catch (error) {
    console.error('[SW] Service Worker registration failed:', error)
    // 注册失败不影响应用功能
  }
}

/**
 * 取消注册 Service Worker（用于调试）
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!isServiceWorkerSupported()) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.unregister()
      console.log('[SW] Service Worker unregistered')
    }
  } catch (error) {
    console.error('[SW] Service Worker unregistration failed:', error)
  }
}

/**
 * 检查 Service Worker 是否已注册
 */
export async function isServiceWorkerRegistered(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    return !!registration
  } catch (error) {
    return false
  }
}

