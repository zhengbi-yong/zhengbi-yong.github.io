'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { notificationService } from '@/lib/api/backend'
import { useAuthStore } from '@/lib/store/auth-store'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const user = useAuthStore((s) => s.user)

  const fetchUnread = useCallback(async () => {
    if (!user) return
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch {
      // Silently fail - bell just shows 0
    }
  }, [user])

  useEffect(() => {
    fetchUnread()
    // Poll every 60s
    const interval = setInterval(fetchUnread, 60_000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  if (!user) return null

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
      aria-label={`通知${unreadCount > 0 ? ` (${unreadCount} 未读)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
