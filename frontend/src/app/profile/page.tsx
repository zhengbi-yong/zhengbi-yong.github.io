'use client'

/**
 * User Profile Page - 用户个人资料页面
 *
 * 功能：
 * - 查看和编辑个人资料
 * - 修改密码
 * - 上传头像
 * - 查看阅读统计
 * - 管理社交链接
 */

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { authService } from '@/lib/api/backend'
import type { UserProfile, UpdateProfileRequest, UserReadingStats } from '@/lib/types/backend'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'

export default function ProfilePage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserReadingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'stats'>('profile')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 表单数据
  const [formData, setFormData] = useState<UpdateProfileRequest>({
    username: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    twitter: '',
    github: '',
  })

  // 密码表单
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  // 头像上传
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadProfile()
      loadStats()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const data = await authService.getCurrentUser()
      setProfile(data)
      setFormData({
        username: data.username,
        email: data.email,
        bio: (data as any).bio || '',
        location: (data as any).location || '',
        website: (data as any).website || '',
        twitter: (data as any).twitter || '',
        github: (data as any).github || '',
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await authService.getReadingStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const updated = await authService.updateProfile(formData)
      setProfile(updated)
      setUser(updated)
      setMessage({ type: 'success', text: t('profile.saveSuccess') || '保存成功' })
    } catch (error) {
      console.error('Failed to save profile:', error)
      setMessage({ type: 'error', text: t('profile.saveError') || '保存失败' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: t('profile.passwordMismatch') || '两次输入的密码不一致' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      await authService.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      })
      setMessage({ type: 'success', text: t('profile.passwordChangeSuccess') || '密码修改成功' })
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      console.error('Failed to change password:', error)
      setMessage({ type: 'error', text: t('profile.passwordChangeError') || '密码修改失败' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件大小（最大2MB）
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('profile.avatarTooLarge') || '头像大小不能超过2MB' })
      return
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: t('profile.invalidAvatar') || '只能上传图片文件' })
      return
    }

    setUploadingAvatar(true)
    setMessage(null)

    try {
      // 预览
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // 上传
      const { avatar_url } = await authService.uploadAvatar(file)
      setProfile((prev) => (prev ? { ...prev, avatar_url } : null))
      setMessage({ type: 'success', text: t('profile.avatarUploadSuccess') || '头像上传成功' })
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      setMessage({ type: 'error', text: t('profile.avatarUploadError') || '头像上传失败' })
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
          <div className="mb-4 text-6xl">👤</div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('profile.loginRequired') || '请先登录'}
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {t('profile.loginToViewProfile') || '登录后即可查看和编辑个人资料'}
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

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-100">
          {t('profile.title') || '个人资料'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('profile.subtitle') || '管理您的个人信息和偏好设置'}
        </p>
      </div>

      {/* 标签页 */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            {t('profile.basicInfo') || '基本信息'}
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            {t('profile.changePassword') || '修改密码'}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            {t('profile.readingStats') || '阅读统计'}
          </button>
        </nav>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`mb-6 rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* 左侧：头像和快速链接 */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            {/* 头像 */}
            <div className="mb-6 text-center">
              <div className="relative mx-auto mb-4 h-32 w-32">
                <img
                  src={avatarPreview || profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  alt={user.username}
                  className="h-full w-full rounded-full border-4 border-gray-200 object-cover dark:border-gray-700"
                />
                <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                </label>
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.username}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                {t('profile.role')}: {user.role === 'admin' ? (t('profile.admin') || '管理员') : (t('profile.user') || '用户')}
              </p>
            </div>

            {/* 快速链接 */}
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

        {/* 右侧：表单内容 */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('profile.username') || '用户名'}
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('profile.email') || '邮箱'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('profile.bio') || '个人简介'}
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder={t('profile.bioPlaceholder') || '介绍一下自己...'}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t('profile.location') || '位置'}
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      placeholder={t('profile.locationPlaceholder') || '城市, 国家'}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t('profile.website') || '网站'}
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="https://"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                      Twitter
                    </label>
                    <input
                      type="text"
                      value={formData.twitter}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="@username"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                      GitHub
                    </label>
                    <input
                      type="text"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="username"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                  >
                    {saving ? (t('profile.saving') || '保存中...') : (t('profile.save') || '保存')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('profile.currentPassword') || '当前密码'}
                  </label>
                  <input
                    type="password"
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('profile.newPassword') || '新密码'}
                  </label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('profile.confirmPassword') || '确认新密码'}
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                  >
                    {saving ? (t('profile.changing') || '修改中...') : (t('profile.change') || '修改')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'stats' && stats && (
              <div className="space-y-6">
                {/* 统计卡片 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total_posts_read}</div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      {t('profile.postsRead') || '已读文章'}
                    </div>
                  </div>

                  <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.posts_completed}</div>
                    <div className="text-sm text-green-800 dark:text-green-300">
                      {t('profile.postsCompleted') || '已完成'}
                    </div>
                  </div>

                  <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.reading_streak}</div>
                    <div className="text-sm text-yellow-800 dark:text-yellow-300">
                      {t('profile.readingStreak') || '连续阅读天数'}
                    </div>
                  </div>

                  <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.floor(stats.total_reading_time / 60)}h
                    </div>
                    <div className="text-sm text-purple-800 dark:text-purple-300">
                      {t('profile.totalReadingTime') || '总阅读时长'}
                    </div>
                  </div>
                </div>

                {/* 本周/本月阅读 */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      {t('profile.thisWeek') || '本周'}
                    </div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{stats.this_week_posts} 篇</div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      {t('profile.thisMonth') || '本月'}
                    </div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{stats.this_month_posts} 篇</div>
                  </div>
                </div>

                {/* 喜欢的标签 */}
                {stats.favorite_tags.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t('profile.favoriteTags') || '喜欢的标签'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.favorite_tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
