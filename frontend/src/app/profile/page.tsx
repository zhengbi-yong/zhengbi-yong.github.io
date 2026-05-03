'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
  const setUser = useAuthStore((state) => state.setUser)

  const [profile, setProfile] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Editable fields
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState('')
  const [github, setGithub] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadProfile = async () => {
      try {
        const data = await authService.getCurrentUser()
        setProfile(data)
        const vm = toProfileViewModel(data)
        setBio(vm.bio)
        setLocation(vm.location)
        setWebsite(vm.website)
        setTwitter(vm.twitter)
        setGithub(vm.github)
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: '头像文件过大 (最大 10MB)' })
      return
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '请选择图片文件' })
      return
    }

    try {
      setUploadingAvatar(true)
      setMessage(null)
      const updatedUser = await authService.uploadAvatar(file)
      // Update profile state
      setProfile(updatedUser)
      setUser(updatedUser)
      setMessage({ type: 'success', text: '头像已更新' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || '头像上传失败' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setMessage(null)
      const updatedUser = await authService.updateProfile({
        bio: bio || undefined,
        location: location || undefined,
        website: website || undefined,
        twitter: twitter || undefined,
        github: github || undefined,
      })
      setProfile(updatedUser)
      setUser(updatedUser)
      setMessage({ type: 'success', text: '个人资料已保存' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || '保存失败，请重试' })
    } finally {
      setSaving(false)
    }
  }

  const profileView = useMemo(() => {
    return profile ? toProfileViewModel(profile) : null
  }, [profile])

  // Clear message after 5 seconds
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 5000)
    return () => clearTimeout(timer)
  }, [message])

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-background p-8 text-center shadow dark:bg-card">
          <div className="mb-4 text-6xl">👤</div>
          <h1 className="mb-4 text-3xl font-bold text-foreground">
            {t('profile.loginRequired') || '请先登录'}
          </h1>
          <p className="mb-6 text-muted-foreground">
            {t('profile.loginToViewProfile') || '登录后即可查看个人资料。'}
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:opacity-90"
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  const activeProfile = profile ?? user
  const activeProfileView = profileView ?? toProfileViewModel(activeProfile)
  const initials = activeProfile.username.charAt(0).toUpperCase()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-foreground">
          {t('profile.title') || '个人资料'}
        </h1>
        <p className="text-muted-foreground">
          编辑您的个人资料信息。修改会即时显示在您的公共主页上。
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg p-4 ${
            message.type === 'error'
              ? 'bg-destructive/10 text-destructive dark:bg-destructive/15 dark:text-destructive'
              : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left sidebar — avatar + links */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-background p-6 shadow dark:bg-card">
            <div className="mb-6 text-center">
              {/* Clickable avatar */}
              <div
                className="group relative mx-auto mb-4 flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-border bg-secondary dark:border-border dark:bg-secondary"
                onClick={() => fileInputRef.current?.click()}
                title="点击更换头像"
              >
                {uploadingAvatar ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                ) : activeProfileView.avatarUrl ? (
                  <img
                    src={activeProfileView.avatarUrl}
                    alt={activeProfile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-semibold text-foreground">{initials}</span>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-xs font-medium text-white">更换头像</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />

              <h3 className="text-xl font-semibold text-foreground">
                {activeProfile.username}
              </h3>
              <p className="text-sm text-muted-foreground">{activeProfile.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('profile.role')}: {activeProfile.role === 'admin' ? '管理员' : '用户'}
              </p>
            </div>

            <div className="space-y-2">
              <Link
                href={`/users/${encodeURIComponent(activeProfile.username)}`}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-foreground transition-colors hover:bg-secondary dark:hover:bg-secondary"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                我的公共主页
              </Link>
              <Link
                href="/reading-history"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-foreground transition-colors hover:bg-secondary dark:hover:bg-secondary"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {t('profile.readingHistory') || '阅读历史'}
              </Link>
              <Link
                href="/reading-list"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-foreground transition-colors hover:bg-secondary dark:hover:bg-secondary"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {t('profile.readingList') || '阅读列表'}
              </Link>
            </div>
          </div>
        </div>

        {/* Right side — editable profile form */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-background p-6 shadow dark:bg-card">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">编辑资料</h2>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Read-only fields */}
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">用户名</label>
                <input
                  type="text"
                  value={activeProfile.username}
                  disabled
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground opacity-60 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">邮箱</label>
                <input
                  type="text"
                  value={activeProfile.email}
                  disabled
                  className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-foreground opacity-60 dark:border-gray-700"
                />
              </div>

              {/* Editable fields */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  个人简介
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="介绍一下你自己..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-[var(--theme-bg)] px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  所在地
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例如: Beijing, China"
                  className="w-full rounded-lg border border-border bg-[var(--theme-bg)] px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-border bg-[var(--theme-bg)] px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  GitHub
                </label>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="用户名 (不含 @)"
                  className="w-full rounded-lg border border-border bg-[var(--theme-bg)] px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Twitter
                </label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="用户名 (不含 @)"
                  className="w-full rounded-lg border border-border bg-[var(--theme-bg)] px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    保存中...
                  </>
                ) : (
                  '保存资料'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
