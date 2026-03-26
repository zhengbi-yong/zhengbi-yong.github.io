'use client'

/**
 * Notifications Page - 通知管理页面
 *
 * 功能：
 * - 查看所有评论通知订阅
 * - 管理通知偏好设置
 * - 批量取消订阅
 * - 查看通知历史
 */

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { commentNotificationService } from '@/lib/api/backend'
import type { CommentNotificationSubscription, CommentNotificationPreferences } from '@/lib/types/backend'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Client-side only imports for PWA functionality
const NotificationSettings = dynamic(
  () => import('@/lib/hooks/usePushNotifications').then(mod => mod.NotificationSettings),
  { ssr: false }
)

export default function NotificationsPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  const [subscriptions, setSubscriptions] = useState<CommentNotificationSubscription[]>([])
  const [preferences, setPreferences] = useState<CommentNotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'preferences' | 'push'>('push')

  useEffect(() => {
    if (user) {
      loadSubscriptions()
      loadPreferences()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadSubscriptions = async () => {
    try {
      const data = await commentNotificationService.getSubscriptions()
      setSubscriptions(data)
    } catch (error) {
      console.error('Failed to load subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPreferences = async () => {
    try {
      const data = await commentNotificationService.getPreferences()
      setPreferences(data)
    } catch (error) {
      console.error('Failed to load preferences:', error)
    }
  }

  const handleUnsubscribe = async (postId: string) => {
    if (!confirm(t('notification.confirmUnsubscribe') || '确定要取消订阅吗？')) {
      return
    }

    try {
      await commentNotificationService.unsubscribeFromPost(postId)
      loadSubscriptions()
    } catch (error) {
      alert(t('notification.unsubscribeError') || '取消订阅失败')
    }
  }

  const handleSavePreferences = async () => {
    if (!preferences) return

    setSaving(true)
    try {
      await commentNotificationService.updatePreferences(preferences)
      alert(t('notification.preferencesSaved') || '设置已保存')
    } catch (error) {
      alert(t('notification.saveError') || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 未登录显示
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
          <div className="mb-4 text-6xl">🔔</div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('notification.loginRequired') || '请先登录'}
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {t('notification.loginToManage') || '登录后即可管理您的通知设置'}
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
          >
            {t('auth.login') || '登录'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-100">
          {t('notification.title') || '通知设置'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('notification.subtitle') || '管理您的评论通知和订阅'}
        </p>
      </div>

      {/* 标签页 */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('push')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'push'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            {t('notification.pushTab') || '推送通知'}
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'subscriptions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            {t('notification.mySubscriptions') || '我的订阅'} ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'preferences'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            {t('notification.preferences') || '通知偏好'}
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* PWA推送通知设置 */}
          {activeTab === 'push' && (
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {t('notification.pushSettings') || 'PWA 推送通知'}
                </h2>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                  {t('notification.pushSettingsDesc') || '启用推送通知，即使浏览器关闭也能收到新文章和重要更新的提醒'}
                </p>
                <NotificationSettings />
              </div>

              {/* 使用提示 */}
              <div className="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
                <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                  {t('notification.tipsTitle') || '关于推送通知'}
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li>• {t('notification.tip1') || '推送通知需要在支持的浏览器中使用（Chrome、Firefox、Edge等）'}
                  </li>
                  <li>• {t('notification.tip2') || '您可以在浏览器设置中随时更改通知权限'}
                  </li>
                  <li>• {t('notification.tip3') || '订阅后，您将收到新文章和重要更新的通知'}
                  </li>
                  <li>• {t('notification.tip4') || '推送通知不会影响您的设备性能，可以随时关闭'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* 订阅列表 */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              {subscriptions.length === 0 ? (
                <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                  <div className="mb-4 text-6xl">📭</div>
                  <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {t('notification.noSubscriptions') || '暂无订阅'}
                  </h2>
                  <p className="mb-6 text-gray-600 dark:text-gray-400">
                    {t('notification.startSubscribing') || '订阅文章的评论通知，不错过任何回复'}
                  </p>
                </div>
              ) : (
                subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link
                          href={`/blog/${sub.post_slug}`}
                          className="mb-2 text-xl font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {sub.post_title}
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('notification.subscribedOn') || '订阅于'}:{' '}
                          {new Date(sub.subscribed_at).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUnsubscribe(sub.post_id)}
                        className="ml-4 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        {t('notification.unsubscribe') || '取消订阅'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 通知偏好 */}
          {activeTab === 'preferences' && preferences && (
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <div className="space-y-6">
                {/* 邮件通知开关 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {t('notification.emailNotifications') || '邮件通知'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('notification.emailNotificationsDesc') || '接收评论通知的邮件'}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setPreferences({ ...preferences, email_notifications: !preferences.email_notifications })
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        preferences.email_notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        preferences.email_notifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 回复通知开关 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {t('notification.replyNotifications') || '回复通知'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('notification.replyNotificationsDesc') || '当有人回复您的评论时通知'}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setPreferences({ ...preferences, reply_notifications: !preferences.reply_notifications })
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        preferences.reply_notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        preferences.reply_notifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 提及通知开关 */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {t('notification.mentionNotifications') || '@提及通知'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('notification.mentionNotificationsDesc') || '当有人在评论中提及您时通知'}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setPreferences({
                        ...preferences,
                        mention_notifications: !preferences.mention_notifications,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        preferences.mention_notifications ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        preferences.mention_notifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 摘要频率 */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('notification.digestFrequency') || '摘要频率'}
                  </label>
                  <select
                    value={preferences.digest_frequency}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        digest_frequency: e.target.value as any,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="immediate">{t('notification.immediate') || '立即'}</option>
                    <option value="hourly">{t('notification.hourly') || '每小时'}</option>
                    <option value="daily">{t('notification.daily') || '每天'}</option>
                    <option value="weekly">{t('notification.weekly') || '每周'}</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t('notification.digestFrequencyDesc') || '选择接收通知摘要的频率'}
                  </p>
                </div>

                {/* 保存按钮 */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                  >
                    {saving ? (t('notification.saving') || '保存中...') : (t('notification.save') || '保存')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
