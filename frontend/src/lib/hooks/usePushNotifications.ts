'use client'

/**
 * usePushNotifications - PWA推送通知Hook
 *
 * 功能：
 * - 请求推送通知权限
 * - 订阅推送通知
 * - 发送本地通知
 * - 处理通知点击
 * - 通知权限状态管理
 */

import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface PushNotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

interface NotificationPermission {
  state: 'default' | 'granted' | 'denied'
  canRequest: boolean
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>({
    state: 'default',
    canRequest: true,
  })
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // 检查浏览器支持
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setIsSupported(supported)

    if (!supported) return

    // 获取当前权限状态
    const checkPermission = () => {
      const state = Notification.permission as 'default' | 'granted' | 'denied'
      setPermission({
        state,
        canRequest: state === 'default',
      })
    }

    checkPermission()

    // 监听权限变化
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'notifications' as PermissionName }).then((permission) => {
        permission.onchange = checkPermission
      })
    }

    // 获取现有订阅
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setSubscription(sub)
      })
    })
  }, [])

  /**
   * 请求通知权限
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Push notifications are not supported')
      return false
    }

    if (permission.state === 'granted') {
      return true
    }

    if (permission.state === 'denied') {
      console.warn('Notification permission denied')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission({
        state: result,
        canRequest: false,
      })
      return result === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }, [isSupported, permission.state])

  /**
   * 订阅推送通知
   */
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported')
    }

    if (permission.state !== 'granted') {
      const granted = await requestPermission()
      if (!granted) {
        throw new Error('Notification permission not granted')
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''),
      })

      setSubscription(subscription)

      // 发送订阅到服务器
      await sendSubscriptionToServer(subscription)

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      throw error
    }
  }, [isSupported, permission.state, requestPermission])

  /**
   * 取消订阅
   */
  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!subscription) {
      console.warn('No active subscription to unsubscribe')
      return
    }

    try {
      await subscription.unsubscribe()
      setSubscription(null)

      // 通知服务器取消订阅
      await removeSubscriptionFromServer(subscription)
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      throw error
    }
  }, [subscription])

  /**
   * 发送本地通知
   */
  const sendLocalNotification = useCallback(
    async (options: PushNotificationOptions): Promise<void> => {
      if (permission.state !== 'granted') {
        console.warn('Notification permission not granted')
        return
      }

      if (!('serviceWorker' in navigator)) {
        // 如果没有Service Worker，使用Notification API
        new Notification(options.title, {
          body: options.body,
          icon: options.icon,
          badge: options.badge,
          image: options.image,
          data: options.data,
        })
        return
      }

      try {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon,
          badge: options.badge,
          image: options.image,
          data: options.data,
          actions: options.actions,
        })
      } catch (error) {
        console.error('Failed to show notification:', error)
        throw error
      }
    },
    [permission.state]
  )

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    sendLocalNotification,
  }
}

// ==================== 辅助函数 ====================

/**
 * 将Base64字符串转换为Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * 发送订阅信息到服务器
 */
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })

  if (!response.ok) {
    throw new Error('Failed to send subscription to server')
  }
}

/**
 * 从服务器移除订阅
 */
async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  const response = await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })

  if (!response.ok) {
    throw new Error('Failed to remove subscription from server')
  }
}

/**
 * 通知权限请求UI组件
 */
export function NotificationPermissionButton() {
  const { t } = useTranslation()
  const { permission, requestPermission, isSupported } = usePushNotifications()

  if (!isSupported) {
    return null
  }

  if (permission.state === 'granted') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {t('notification.enabled') || '通知已启用'}
      </div>
    )
  }

  return (
    <button
      onClick={() => requestPermission()}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {t('notification.enableNotifications') || '启用通知'}
    </button>
  )
}

/**
 * 通知设置页面组件
 */
export function NotificationSettings() {
  const { t } = useTranslation()
  const { permission, subscription, subscribe, unsubscribe, isSupported } = usePushNotifications()

  if (!isSupported) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
        <p className="text-sm">{t('notification.notSupported') || '您的浏览器不支持推送通知'}</p>
      </div>
    )
  }

  const handleToggleSubscription = async () => {
    try {
      if (subscription) {
        await unsubscribe()
        alert(t('notification.unsubscribed') || '已取消订阅')
      } else {
        await subscribe()
        alert(t('notification.subscribed') || '已订阅推送通知')
      }
    } catch (error) {
      alert(t('notification.error') || '操作失败')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {t('notification.pushNotifications') || '推送通知'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('notification.pushNotificationsDesc') || '接收新文章和评论的推送通知'}
          </p>
        </div>
        <button
          onClick={handleToggleSubscription}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            subscription ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              subscription ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {permission.state === 'denied' && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
          <p className="text-sm">
            {t('notification.denied') || '您已拒绝通知权限。请在浏览器设置中允许通知。'}
          </p>
        </div>
      )}

      {permission.state === 'granted' && !subscription && (
        <button
          onClick={handleToggleSubscription}
          className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
        >
          {t('notification.subscribe') || '订阅推送通知'}
        </button>
      )}
    </div>
  )
}

export default usePushNotifications
