'use client'

import { useEffect, useState } from 'react'
import { LogIn } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth-store'
import { cn } from '@/components/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const LazyAuthModal = dynamic(
  () => import('./AuthModal').then((module) => module.AuthModal),
  { ssr: false, loading: () => null }
)

interface AuthButtonProps {
  isDark?: boolean
}

function getAvatarUrl(user: { profile?: Record<string, unknown> | null } | null): string | null {
  if (!user?.profile) return null
  const url = user.profile['avatar_url'] as string | undefined
  return url || null
}

function getInitials(name: string | undefined): string {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

export function AuthButton({ isDark = true }: AuthButtonProps) {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)

    // Close dropdown on outside click
    if (!dropdownOpen) return
    const handler = () => setDropdownOpen(false)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [dropdownOpen])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    router.push('/')
  }

  const iconClass = isDark ? 'text-[#c6c7c6]' : 'text-foreground'

  if (!isMounted) {
    return (
      <button
        className={cn(
          'flex items-center opacity-60 transition-opacity duration-300 cursor-pointer'
        )}
        disabled
        aria-hidden="true"
      >
        <LogIn className={cn('w-5 h-5', iconClass)} />
      </button>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'flex items-center opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-pointer'
          )}
          aria-label="登录"
        >
          <LogIn className={cn('w-5 h-5', iconClass)} />
        </button>

        {isModalOpen ? (
          <LazyAuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        ) : null}
      </>
    )
  }

  // Logged in — show avatar + dropdown
  const avatarUrl = getAvatarUrl(user)
  const username = user?.username

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={cn(
          'flex items-center gap-2 rounded-full transition-all duration-200',
          'hover:ring-2 hover:ring-primary/30 cursor-pointer'
        )}
        aria-label="用户菜单"
      >
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-secondary dark:border-gray-600 dark:bg-gray-700">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username || ''}
              className="h-full w-full object-cover"
              width={32}
              height={32}
            />
          ) : (
            <span className="text-sm font-semibold text-foreground">
              {getInitials(username)}
            </span>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-background py-1 shadow-lg dark:border-gray-700 dark:bg-card z-50'
          )}
        >
          <div className="border-b border-border px-4 py-2 dark:border-gray-700">
            <p className="text-sm font-medium text-foreground truncate">{username}</p>
            {user?.role === 'admin' && (
              <p className="text-xs text-muted-foreground">管理员</p>
            )}
          </div>

          <Link
            href="/profile"
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            个人主页
          </Link>

          <Link
            href={`/@/${encodeURIComponent(username || '')}`}
            onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            我的主页
          </Link>

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary dark:hover:bg-gray-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              管理后台
            </Link>
          )}

          <div className="border-t border-border dark:border-gray-700" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-secondary dark:text-red-400 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}
