'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth-store'
import { socialService } from '@/lib/api/backend'

interface FollowButtonProps {
  username: string
  initialFollowing?: boolean
  className?: string
  onToggle?: (following: boolean) => void
}

export function FollowButton({
  username,
  initialFollowing = false,
  className = '',
  onToggle,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  // Don't show follow button for own profile
  if (user?.username === username) return null

  const handleClick = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      if (following) {
        await socialService.unfollowUser(username)
        setFollowing(false)
        onToggle?.(false)
      } else {
        await socialService.followUser(username)
        setFollowing(true)
        onToggle?.(true)
      }
    } catch (err) {
      console.error('Follow toggle failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors
        ${following
          ? 'border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:border-red-300 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400'
          : 'bg-primary text-primary-foreground hover:opacity-90'
        }
        disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : following ? (
        <UserCheck className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {following ? '已关注' : '关注'}
    </button>
  )
}
