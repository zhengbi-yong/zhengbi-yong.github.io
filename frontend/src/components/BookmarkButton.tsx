'use client'

/**
 * BookmarkButton - 书签按钮组件
 *
 * 功能：
 * - 添加/删除书签
 * - 检查书签状态
 * - 动画效果
 * - 响应式设计
 */

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { bookmarkService } from '@/lib/api/backend'
import { useTranslation } from 'react-i18next'

interface BookmarkButtonProps {
  postId: string
  postSlug: string
  postTitle: string
  className?: string
  variant?: 'icon' | 'button' | 'pill'
}

export function BookmarkButton({
  postId,
  postSlug,
  postTitle,
  className = '',
  variant = 'icon',
}: BookmarkButtonProps) {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // 检查书签状态
  useEffect(() => {
    if (!user) {
      setChecking(false)
      return
    }

    const checkBookmark = async () => {
      try {
        const bookmarked = await bookmarkService.isBookmarked(postId)
        setIsBookmarked(bookmarked)
      } catch (error) {
        console.error('Failed to check bookmark status:', error)
      } finally {
        setChecking(false)
      }
    }

    checkBookmark()
  }, [postId, user])

  // 切换书签状态
  const toggleBookmark = async () => {
    if (!user) {
      alert(t('bookmark.loginRequired') || '请先登录')
      return
    }

    setLoading(true)
    try {
      if (isBookmarked) {
        await bookmarkService.removeBookmark(postId)
        setIsBookmarked(false)
      } else {
        await bookmarkService.addBookmark(postId, postSlug, postTitle)
        setIsBookmarked(true)
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
      alert(t('bookmark.error') || '操作失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 如果未登录或正在检查，不显示
  if (!user || checking) {
    return null
  }

  const baseClasses = 'transition-all duration-200'

  // 图标版本（最小）
  if (variant === 'icon') {
    return (
      <button
        onClick={toggleBookmark}
        disabled={loading}
        className={`${baseClasses} ${className} group relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50`}
        title={isBookmarked ? (t('bookmark.remove') || '取消收藏') : (t('bookmark.add') || '收藏')}
      >
        <svg
          className={`h-5 w-5 transition-all ${
            isBookmarked
              ? 'fill-yellow-400 text-yellow-400 scale-110'
              : 'fill-none text-gray-600 dark:text-gray-400 group-hover:text-yellow-500 dark:group-hover:text-yellow-400'
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
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
        onClick={toggleBookmark}
        disabled={loading}
        className={`${baseClasses} ${className} inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          isBookmarked
            ? 'border-yellow-500 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
      >
        <svg
          className={`h-4 w-4 ${isBookmarked ? 'fill-current' : 'fill-none'}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isBookmarked ? (
          t('bookmark.saved') || '已收藏'
        ) : (
          t('bookmark.save') || '收藏'
        )}
      </button>
    )
  }

  // 药丸版本（默认）
  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      className={`${baseClasses} ${className} inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all disabled:opacity-50 ${
        isBookmarked
          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-yellow-500/25 hover:shadow-yellow-500/40'
          : 'bg-white text-gray-700 shadow-gray-300/50 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:shadow-gray-700/30 dark:hover:bg-gray-700'
      }`}
    >
      <svg
        className={`h-4 w-4 ${isBookmarked ? 'fill-white text-white' : 'fill-none text-current'}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isBookmarked ? (
        t('bookmark.saved') || '已收藏'
      ) : (
        t('bookmark.save') || '稍后阅读'
      )}
    </button>
  )
}

export default BookmarkButton
