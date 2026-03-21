'use client'

/**
 * NewsletterSignup - 邮件订阅组件
 *
 * 功能：
 * - 邮箱订阅
 * - 加载状态
 * - 错误处理
 * - 成功反馈动画
 * - 响应式设计
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface NewsletterSignupProps {
  className?: string
  theme?: 'light' | 'dark'
  showTitle?: boolean
  compact?: boolean
}

export function NewsletterSignup({
  className = '',
  theme = 'light',
  showTitle = true,
  compact = false,
}: NewsletterSignupProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 邮箱验证
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error')
      setMessage(t('newsletter.invalidEmail') || '请输入有效的邮箱地址')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(t('newsletter.success') || '订阅成功！请检查您的邮箱')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || t('newsletter.error') || '订阅失败，请稍后重试')
      }
    } catch (error) {
      setStatus('error')
      setMessage(t('newsletter.networkError') || '网络错误，请稍后重试')
    }
  }

  const themeClasses = {
    light: {
      container: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900',
      input: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      text: 'text-gray-900 dark:text-gray-100',
    },
    dark: {
      container: 'bg-gradient-to-br from-gray-800 to-gray-900',
      input: 'bg-gray-700 border-gray-600 text-gray-100',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      text: 'text-gray-100',
    },
  }

  const currentTheme = themeClasses[theme]

  if (compact) {
    return (
      <div className={`${currentTheme.container} rounded-lg p-4 ${className}`}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletter.placeholder') || '您的邮箱'}
            disabled={status === 'loading' || status === 'success'}
            className={`${currentTheme.input} flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
            required
          />
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className={`${currentTheme.button} rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50`}
          >
            {status === 'loading' ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : status === 'success' ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              t('newsletter.subscribe') || '订阅'
            )}
          </button>
        </form>
        {message && (
          <p
            className={`mt-2 text-xs ${
              status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={`${currentTheme.container} rounded-xl p-8 shadow-lg ${className}`}>
      {showTitle && (
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-xl font-bold">{t('newsletter.title') || '订阅我们的通讯'}</h3>
          </div>
          <p className={`text-sm ${currentTheme.text} opacity-80`}>
            {t('newsletter.description') || '获取最新的文章、技术见解和独家内容，直接发送到您的收件箱。'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className={`mb-2 block text-sm font-medium ${currentTheme.text}`}>
            {t('newsletter.emailLabel') || '邮箱地址'}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletter.placeholder') || 'your@email.com'}
            disabled={status === 'loading' || status === 'success'}
            className={`${currentTheme.input} w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
            required
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className={`${currentTheme.button} w-full rounded-lg px-6 py-3 font-semibold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {status === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t('newsletter.subscribing') || '订阅中...'}
            </span>
          ) : status === 'success' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t('newsletter.subscribed') || '已订阅'}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t('newsletter.subscribe') || '立即订阅'}
            </span>
          )}
        </button>

        {message && (
          <div
            className={`rounded-lg p-3 ${
              status === 'error'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            }`}
          >
            <p className="text-sm">{message}</p>
          </div>
        )}
      </form>

      <p className={`mt-4 text-xs ${currentTheme.text} opacity-60`}>
        {t('newsletter.privacy') || '我们尊重您的隐私。随时可以取消订阅。'}
      </p>
    </div>
  )
}

export default NewsletterSignup
