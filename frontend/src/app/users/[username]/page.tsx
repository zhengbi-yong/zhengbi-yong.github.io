'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { authService } from '@/lib/api/backend'
import type { UserPublicProfile, UserPublicPostsResponse } from '@/lib/types/backend'
import { Calendar, MapPin, Globe, BookOpen, Clock, Eye, Heart, MessageCircle } from 'lucide-react'

export default function UserPublicPage() {
  const { t } = useTranslation()
  const params = useParams()
  const username = decodeURIComponent(params.username as string)

  const [profile, setProfile] = useState<UserPublicProfile | null>(null)
  const [posts, setPosts] = useState<UserPublicPostsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return

    const loadData = async () => {
      try {
        setLoading(true)
        const [profileData, postsData] = await Promise.all([
          authService.getPublicProfile(username),
          authService.getUserPublicPosts(username, { page: 1, page_size: 10 }),
        ])
        setProfile(profileData)
        setPosts(postsData)
        setError(null)
      } catch (err: any) {
        if (err?.statusCode === 404) {
          setError('用户不存在')
        } else {
          setError('加载用户信息失败')
        }
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [username])

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4 py-16">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-lg bg-background p-8 text-center shadow dark:bg-card">
          <div className="mb-4 text-6xl">🔍</div>
          <h1 className="mb-4 text-3xl font-bold text-foreground">{error}</h1>
          <p className="mb-6 text-muted-foreground">
            {error === '用户不存在'
              ? '没有找到该用户，请检查用户名是否正确。'
              : '请稍后重试。'}
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:opacity-90"
          >
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Profile Header */}
      <div className="mb-12 rounded-xl bg-background p-8 shadow-md dark:bg-card">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-border bg-secondary dark:border-border dark:bg-secondary">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-5xl font-bold text-foreground">
                {getInitials(profile.username)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="mb-1 text-3xl font-bold text-foreground">
              {profile.username}
            </h1>
            <div className="mb-3 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${
                profile.role === 'admin'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              }`}>
                {profile.role === 'admin' ? '管理员' : '用户'}
              </span>
              {profile.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(profile.created_at)} 加入
                </span>
              )}
            </div>

            {profile.bio && (
              <p className="mb-4 text-muted-foreground">{profile.bio}</p>
            )}

            {/* Social Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              {profile.location && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
              {profile.github && (
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <svg className="inline h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              )}
              {profile.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-[#1DA1F2]"
                >
                  <svg className="inline h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div>
        <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-foreground">
          <BookOpen className="h-6 w-6" />
          文章 ({posts?.total ?? 0})
        </h2>

        {(!posts || posts.posts.length === 0) ? (
          <div className="rounded-lg bg-background p-8 text-center shadow dark:bg-card">
            <div className="mb-4 text-5xl">📝</div>
            <p className="text-muted-foreground">暂无文章</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block rounded-lg bg-background p-6 shadow transition-all hover:shadow-md dark:bg-card"
              >
                <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                  {post.title}
                </h3>
                {post.summary && (
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {post.summary}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(post.published_at)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.reading_time} 分钟
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {post.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {post.like_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {post.comment_count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
