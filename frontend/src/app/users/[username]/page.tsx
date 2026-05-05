'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { userService } from '@/lib/api/backend'
import type { UserPublicProfile, UserPostsResponse } from '@/lib/types/backend'
import { FollowButton } from '@/components/FollowButton'
import { Input } from '@/components/shadcn/ui/input'
import { Button } from '@/components/shadcn/ui/button'
import {
  Calendar, MapPin, Globe, BookOpen, Clock, Eye, Heart, MessageCircle,
  GraduationCap, FlaskConical, Users, UserPlus, ExternalLink, Hash,
  Search,
} from 'lucide-react'

export default function UserPublicPage() {
  const { t } = useTranslation()
  const params = useParams()
  const username = decodeURIComponent(params.username as string)

  const [profile, setProfile] = useState<UserPublicProfile | null>(null)
  const [posts, setPosts] = useState<UserPostsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  // Search state (same pattern as posts-manage page)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    setPage(1)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!username) return

    const loadData = async () => {
      try {
        if (isFirstRender.current) {
          setLoading(true)
        }
        const [profileData, postsData] = await Promise.all([
          userService.getPublicProfile(username),
          userService.getUserPosts(username, page, pageSize, debouncedSearch || undefined),
        ])
        setProfile(profileData)
        setPosts(postsData)
        setError(null)
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.status === 404) {
          setError('用户不存在')
        } else {
          setError('加载用户信息失败')
        }
      } finally {
        setLoading(false)
        isFirstRender.current = false
      }
    }

    void loadData()
  }, [username, page, debouncedSearch])

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
            {error === '用户不存在' ? '没有找到该学者，请检查用户名是否正确。' : '请稍后重试。'}
          </p>
          <Link href="/" className="inline-block rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:opacity-90">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const displayName = profile.display_name || profile.username
  const totalPages = posts ? Math.ceil(posts.total / pageSize) : 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* ── Profile Header: Academic Business Card ── */}
      <div className="mb-10 rounded-xl bg-background p-8 shadow-md dark:bg-card">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-border bg-secondary dark:border-border dark:bg-secondary">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-5xl font-bold text-foreground">{getInitials(displayName)}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
                {profile.display_name && (
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                )}
              </div>
              <FollowButton username={profile.username} className="mt-2 sm:mt-0" />
            </div>

            {/* Role + Join Date */}
            <div className="mb-3 mt-2 flex flex-wrap items-center justify-center gap-2 text-sm sm:justify-start">
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${
                profile.role === 'admin'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : profile.role === 'moderator'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              }`}>
                {profile.role === 'admin' ? '管理员' : profile.role === 'moderator' ? '版主' : '学者'}
              </span>
              {profile.created_at && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(profile.created_at)} 加入
                </span>
              )}
            </div>

            {/* Institution */}
            {profile.institution && (
              <p className="mb-2 flex items-center justify-center gap-1.5 text-sm text-foreground sm:justify-start">
                <GraduationCap className="h-4 w-4 text-primary" />
                {profile.institution}
              </p>
            )}

            {/* Research Fields */}
            {profile.research_fields && profile.research_fields.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
                {profile.research_fields.map((field) => (
                  <span key={field} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {field}
                  </span>
                ))}
              </div>
            )}

            {/* Academic Bio */}
            {profile.academic_bio && (
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {profile.academic_bio}
              </p>
            )}

            {/* Stats Bar */}
            <div className="mb-3 flex flex-wrap items-center justify-center gap-4 text-sm sm:justify-start">
              <span className="font-semibold text-foreground">{profile.total_posts} <span className="font-normal text-muted-foreground">文章</span></span>
              <span className="font-semibold text-foreground">{profile.total_likes} <span className="font-normal text-muted-foreground">获赞</span></span>
              <button onClick={() => {/* TODO: followers modal */}} className="font-semibold text-foreground hover:text-primary transition-colors">
                {profile.follower_count} <span className="font-normal text-muted-foreground">关注者</span>
              </button>
              <span className="font-semibold text-foreground">{profile.following_count} <span className="font-normal text-muted-foreground">正在关注</span></span>
            </div>

            {/* ORCID + Google Scholar + Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              {profile.orcid_id && (
                <a href={`https://orcid.org/${profile.orcid_id}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors">
                  <Hash className="h-3 w-3" /> ORCID
                </a>
              )}
              {profile.google_scholar && (
                <a href={profile.google_scholar} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                  <ExternalLink className="h-3 w-3" /> Google Scholar
                </a>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline">
                  <Globe className="h-4 w-4" /> Website
                </a>
              )}
              {profile.github && (
                <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <svg className="inline h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Posts List ── */}
      <div>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BookOpen className="h-6 w-6" />
            文章 ({posts?.total ?? 0})
          </h2>

          {/* Search bar — same pattern as posts-manage page */}
          <div className="w-full sm:w-80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {(!posts || posts.posts.length === 0) ? (
          <div className="rounded-lg bg-background p-8 text-center shadow dark:bg-card">
            <div className="mb-4 text-5xl">📝</div>
            <p className="text-muted-foreground">{searchQuery ? '没有匹配的文章' : '暂无文章'}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="group block rounded-lg bg-background p-6 shadow transition-all hover:shadow-md dark:bg-card">
                <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                  {post.title}
                </h3>
                {post.summary && (
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{post.summary}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {formatDate(post.published_at)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {post.reading_time} 分钟
                  </span>
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {post.view_count}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {post.like_count}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {post.comment_count}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination — same pattern as posts-manage page */}
        {posts && posts.total > pageSize && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <span className="text-sm text-muted-foreground">
              第 {page} / {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => page < totalPages ? p + 1 : p)}
              disabled={page >= totalPages}
            >
              下一页
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
