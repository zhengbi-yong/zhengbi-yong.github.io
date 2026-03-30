'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth-store'
import { cn } from '@/components/lib/utils'

const LazyAuthModal = dynamic(
  () => import('./AuthModal').then((module) => module.AuthModal),
  {
    ssr: false,
    loading: () => null,
  }
)

interface AuthButtonProps {
  isDark?: boolean
}

export function AuthButton({ isDark = true }: AuthButtonProps) {
  const { isAuthenticated, logout } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  const iconClass = isDark ? 'text-[#c6c7c6]' : 'text-gray-700'

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

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleLogout}
        className={cn(
          'flex items-center opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-pointer'
        )}
        aria-label="退出登录"
      >
        <LogOut className={cn('w-5 h-5', iconClass)} />
      </button>
    </div>
  )
}