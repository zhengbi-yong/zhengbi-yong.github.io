'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { LogIn, LogOut, User } from 'lucide-react'

import { Button } from '@/components/shadcn/ui/button'
import { useAuthStore } from '@/lib/store/auth-store'

const LazyAuthModal = dynamic(
  () => import('./AuthModal').then((module) => module.AuthModal),
  {
    ssr: false,
    loading: () => null,
  }
)

const glassEffect =
  'glass-effect relative border border-white/30 bg-white/40 backdrop-blur-sm hover:bg-white/50 dark:border-white/10 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/50'

export function AuthButton() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  if (!isMounted) {
    return (
      <Button
        variant="outline"
        className={glassEffect}
        disabled
        aria-hidden="true"
        data-testid="auth-loading-button"
      >
        <LogIn className="mr-2 h-4 w-4" />
        <span className="text-sm font-medium">登录</span>
      </Button>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className={glassEffect}
          data-testid="auth-login-button"
        >
          <LogIn className="mr-2 h-4 w-4" />
          <span className="text-sm font-medium">登录</span>
        </Button>

        {isModalOpen ? (
          <LazyAuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        ) : null}
      </>
    )
  }

  return (
    <div className="flex items-center gap-3" data-testid="auth-user-info">
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
        <span className="font-medium text-neutral-700 dark:text-neutral-200">
          {user?.username}
        </span>
      </div>

      <Button
        variant="outline"
        onClick={handleLogout}
        className={glassEffect}
        data-testid="auth-logout-button"
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span className="text-sm font-medium">退出</span>
      </Button>
    </div>
  )
}
