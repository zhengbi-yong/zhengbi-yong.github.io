'use client'

/**
 * CommentNotificationButton - 评论通知订阅按钮
 *
 * 功能：
 * - 订阅/取消订阅评论通知
 * - 检查订阅状态
 * - 响应式设计
 * - 动画效果
 */

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { commentNotificationService } from '@/lib/api/backend'
import { useTranslation } from 'react-i18next'

interface CommentNotificationButtonProps {
  postId: string
  postTitle?: string
  className?: string
  variant?: 'icon' | 'button' | 'pill'
}

export function CommentNotificationButton({
  postId,
  postTitle,
  className = '',
  variant = 'pill',
}: CommentNotificationButtonProps) {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // 检查订阅状态
  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }

    const checkSubscription = async () => {
      try {
        const subscribed = await commentNotificationService.isSubscribedToPost(postId)
        setIsSubscribed(subscribed)
      } catch (error) {
        console.error('Failed to check subscription status:', error)
      } finally {
        setChecking(false)
      }
    }

    checkSubscription()
  }, [postId, user])

  // 切换订阅状态
  const toggleSubscription = async () => {
    if (!user) {
      alert(t('notification.loginRequired') || '请先登录')
      return
    }

    setLoading(true)
    try {
      if (isSubscribed) {
        await commentNotificationService.unsubscribeFromPost(postId)
        setIsSubscribed(false)
      } else {
        await commentNotificationService.subscribeToPost(postId)
        setIsSubscribed(true)
      }
    } catch (error) {
      console.error('Failed to toggle subscription:', error)
      alert(t('notification.toggleError') || '操作失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 如果未登录或正在检查，不显示
  if (!user || checking) {
    return null
  }

  const baseClasses = 'transition-all duration-200'

  // 图标版本
  if (variant === 'icon') {
    return (
      <button
        onClick={toggleSubscription}
        disabled={loading}
        className={`${baseClasses} ${className} group relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50`}
        title={isSubscribed ? (t('notification.unsubscribe') || '取消订阅') : (t('notification.subscribe') || '订阅通知')}
      >
        <svg
          className={`h-5 w-5 transition-all ${
            isSubscribed
              ? 'fill-blue-500 text-blue-500 scale-110'
              : 'fill-none text-gray-600 dark:text-gray-400 group-hover:text-blue-500'
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
      </button>
    )
  }

  // 按钮版本
  if (variant === 'button') {
    return (
      <button
        onClick={toggleSubscription}
        disabled={loading}
        className={`${baseClasses} ${className} inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          isSubscribed
            ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
        }`}
      >
        <svg
          className={`h-4 w-4 ${isSubscribed ? 'fill-current' : 'fill-none'}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isSubscribed ? (
          t('notification.subscribed') || '已订阅'
        ) : (
          t('notification.subscribe') || '订阅通知'
        )}
      </button>
    )
  }

  // 药丸版本（默认）
  return (
    <button
      onClick={toggleSubscription}
      disabled={loading}
      className={`${baseClasses} ${className} inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all disabled:opacity-50 ${
        isSubscribed
          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-blue-500/25'
          : 'bg-white text-gray-700 shadow-gray-300/50 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300'
      }`}
    >
      <svg
        className={`h-4 w-4 ${isSubscribed ? 'fill-white text-white' : 'fill-none text-current'}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isSubscribed ? (
        t('notification.subscribed') || '已订阅'
      ) : (
        t('notification.subscribeComments') || '订阅评论'
      )}
    </button>
  )
}

export default CommentNotificationButton
