'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { authService } from '@/lib/api/backend'
import { useAuthStore } from '@/lib/store/auth-store'
import type { UserInfo } from '@/lib/types/backend'

interface ProfileViewModel {
  bio: string
  location: string
  website: string
  twitter: string
  github: string
  avatarUrl: string | null
}

function getProfileField(profile: Record<string, unknown> | null, key: string): string {
  const value = profile?.[key]
  return typeof value === 'string' ? value : ''
}

function toProfileViewModel(user: UserInfo): ProfileViewModel {
  return {
    bio: getProfileField(user.profile, 'bio'),
    location: getProfileField(user.profile, 'location'),
    website: getProfileField(user.profile, 'website'),
    twitter: getProfileField(user.profile, 'twitter'),
    github: getProfileField(user.profile, 'github'),
    avatarUrl: getProfileField(user.profile, 'avatar_url') || null,
  }
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  const [profile, setProfile] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'info' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadProfile = async () => {
      try {
        const data = await authService.getCurrentUser()
        setProfile(data)
      } catch (error) {
        console.error('Failed to load profile:', error)
        setMessage({
          type: 'error',
          text: t('profile.loadError') || '个人资料加载失败，请稍后重试。',
        })
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [t, user])

  const profileView = useMemo(() => {
    if (!profile) return null
    return toProfileViewModel(profile)
  }, [profile])

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
          <div className="mb-4 text-6xl">👤</div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('profile.loginRequired') || '请先登录'}
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {t('profile.loginToViewProfile') || '登录后即可查看个人资料。'}
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
          >
            {t('auth.login') || '返回首页登录'}
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  const activeProfile = profile ?? user
  const activeProfileView = profileView ?? toProfileViewModel(activeProfile)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-100">
          {t('profile.title') || '个人资料'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('profile.subtitle') || '当前页面基于已登录会话展示账户信息。'}
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg p-4 ${
            message.type === 'error'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700">
                {activeProfileView.avatarUrl ? (
                  <img
                    src={activeProfileView.avatarUrl}
                    alt={activeProfile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-semibold text-gray-700 dark:text-gray-200">
                    {activeProfile.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {activeProfile.username}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{activeProfile.email}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {t('profile.role')}: {activeProfile.role === 'admin' ? (t('profile.admin') || '管理员') : (t('profile.user') || '用户')}
              </p>
            </div>

            <div className="space-y-2">
              <Link
                href="/reading-history"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {t('profile.readingHistory') || '阅读历史'}
              </Link>
              <Link
                href="/reading-list"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {t('profile.readingList') || '阅读列表'}
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {t('profile.basicInfo') || '基本信息'}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t('profile.readOnlyNotice') || '当前后端仅提供资料读取接口，编辑、头像上传、密码修改和阅读统计功能暂未开放。'}
              </p>
            </div>

            <dl className="grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('profile.username') || '用户名'}
                </dt>
                <dd className="text-base text-gray-900 dark:text-gray-100">{activeProfile.username}</dd>
              </div>
              <div>
                <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('profile.email') || '邮箱'}
                </dt>
                <dd className="text-base text-gray-900 dark:text-gray-100">{activeProfile.email}</dd>
              </div>
              <div>
                <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('profile.bio') || '个人简介'}
                </dt>
                <dd className="text-base text-gray-900 dark:text-gray-100">
                  {activeProfileView.bio || '—'}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('profile.location') || '所在地'}
                </dt>
                <dd className="text-base text-gray-900 dark:text-gray-100">
                  {activeProfileView.location || '—'}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Website
                </dt>
                <dd className="text-base text-gray-900 dark:text-gray-100">
                  {activeProfileView.website || '—'}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  GitHub
                </dt>
                <dd className="text-base text-gray-900 dark:text-gray-100">
                  {activeProfileView.github || '—'}
                </dd>
              </div>
              <div>
                <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Twitter
                </dt>
                <dd className="text-base text-gray-900 dark:text-gray-100">
                  {activeProfileView.twitter || '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
