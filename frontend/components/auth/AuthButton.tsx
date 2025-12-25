'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { AuthModal } from './AuthModal'
import { LogIn, LogOut, User } from 'lucide-react'

export function AuthButton() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  // Header 风格的按钮样式
  const headerButtonClass = "relative flex h-9 cursor-pointer items-center justify-center rounded-xl border-[0.5px] border-white/30 bg-white/40 backdrop-blur-sm transition-all duration-200 hover:bg-white/50 hover:shadow-md active:scale-95 dark:border-white/10 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/50 px-4"

  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={headerButtonClass}
        >
          <LogIn className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">登录</span>
        </button>
        <AuthModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm">
        <User className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
        <span className="font-medium text-neutral-700 dark:text-neutral-200">{user?.username}</span>
      </div>
      <button
        onClick={handleLogout}
        className={headerButtonClass}
      >
        <LogOut className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">登出</span>
      </button>
    </div>
  )
}
