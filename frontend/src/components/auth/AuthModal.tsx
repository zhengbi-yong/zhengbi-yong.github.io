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
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { X } from 'lucide-react'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'

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

    // 验证密码强度（仅注册时）
    if (mode === 'register') {
      const strength = password ? { requirements: {
        minLength: password.length >= 12,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasDigit: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      }} : null

      if (!strength || !Object.values(strength.requirements).every(Boolean)) {
        useAuthStore.getState().setError('密码不符合要求，请检查密码强度提示')
        return
      }
    }

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, username, password)
      }
      onClose()
    } catch (err) {
      // Error is handled by the store - just log for debugging
      console.log('[AuthModal] Login/Register error:', err)
      console.log('[AuthModal] Current error state:', useAuthStore.getState().error)
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
      <DialogContent className="sm:max-w-md" data-testid="auth-modal">
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

        <form onSubmit={handleSubmit} className="space-y-4 mt-4" data-testid="auth-form">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm p-3 rounded-md border border-red-200 dark:border-red-800" data-testid="auth-error-message">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              data-testid="auth-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                data-testid="auth-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                placeholder="用户名"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              data-testid="auth-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={12}
              placeholder="••••••••"
            />
            {mode === 'register' && password && (
              <PasswordStrengthIndicator password={password} />
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} data-testid="auth-submit-button">
            {isLoading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>
                还没有账户？{' '}
                <button
                  type="button"
                  onClick={switchMode}
                  data-testid="auth-switch-mode-button"
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
                  data-testid="auth-switch-mode-button"
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
