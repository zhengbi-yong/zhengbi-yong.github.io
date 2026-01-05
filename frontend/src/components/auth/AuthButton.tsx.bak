'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { AuthModal } from './AuthModal'
import { LogIn, LogOut, User } from 'lucide-react'
import { Button } from '@/components/shadcn/ui/button'

export function AuthButton() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  // 玻璃态效果样式
  const glassEffect = "glass-effect relative bg-white/40 backdrop-blur-sm border border-white/30 dark:bg-neutral-900/40 dark:border-white/10 hover:bg-white/50 dark:hover:bg-neutral-900/50"

  if (!isAuthenticated) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className={glassEffect}
        >
          <LogIn className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">登录</span>
        </Button>
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
      <Button
        variant="outline"
        onClick={handleLogout}
        className={glassEffect}
      >
        <LogOut className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">登出</span>
      </Button>
    </div>
  )
}
