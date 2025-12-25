'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/ui/dialog'
import { Button } from '@/components/shadcn/ui/button'
import { X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, register, isLoading, error, clearError } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, username, password)
      }
      onClose()
    } catch (err) {
      // Error is handled by the store
    }
  }

  const handleClose = () => {
    clearError()
    setEmail('')
    setUsername('')
    setPassword('')
    onClose()
  }

  const switchMode = () => {
    clearError()
    setEmail('')
    setUsername('')
    setPassword('')
    setMode(mode === 'login' ? 'register' : 'login')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">关闭</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === 'login' ? '登录' : '注册'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login'
              ? '登录以访问更多功能'
              : '创建账户以开始使用'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="your@email.com"
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                用户名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="用户名"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>
                还没有账户？{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-primary hover:underline"
                >
                  注册
                </button>
              </>
            ) : (
              <>
                已有账户？{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-primary hover:underline"
                >
                  登录
                </button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
