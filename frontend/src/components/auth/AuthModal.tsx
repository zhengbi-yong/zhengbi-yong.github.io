'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/shadcn/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/ui/dialog'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { useAuthStore } from '@/lib/store/auth-store'
import { checkPasswordStrength, isPasswordValid } from '@/lib/utils/password'

import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register'
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'login',
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, register, isLoading, error, clearError, setError } = useAuthStore()

  useEffect(() => {
    setMode(defaultMode)
  }, [defaultMode])

  const resetForm = () => {
    setEmail('')
    setUsername('')
    setPassword('')
  }

  const handleClose = () => {
    clearError()
    resetForm()
    setMode(defaultMode)
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()

    if (mode === 'register') {
      const strength = checkPasswordStrength(password)

      if (!isPasswordValid(strength)) {
        setError('密码不符合要求，请检查密码强度提示。')
        return
      }
    }

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, username, password)
      }

      handleClose()
    } catch (submitError: unknown) {
      // Ignore AbortError — request was cancelled (e.g. component unmounted or duplicate submit).
      // The auth store already handles the error state, so no need to log it.
      if (submitError instanceof Error && submitError.name === 'AbortError') {
        return
      }
      console.error('[AuthModal] Authentication request failed:', submitError)
    }
  }

  const switchMode = () => {
    clearError()
    resetForm()
    setMode((currentMode) => (currentMode === 'login' ? 'register' : 'login'))
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === 'login' ? '登录' : '注册'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login'
              ? '登录以访问评论、点赞和更多交互功能。'
              : '创建账号后即可开始参与互动。'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4" data-testid="auth-form">
          {error ? (
            <div
              className="rounded-md border border-red-200 bg-red-100 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
              data-testid="auth-error-message"
            >
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="auth-email">邮箱</Label>
            <Input
              id="auth-email"
              data-testid="auth-email-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="your@email.com"
            />
          </div>

          {mode === 'register' ? (
            <div className="space-y-2">
              <Label htmlFor="auth-username">用户名</Label>
              <Input
                id="auth-username"
                data-testid="auth-username-input"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                minLength={3}
                autoComplete="username"
                placeholder="请输入用户名"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="auth-password">密码</Label>
            <Input
              id="auth-password"
              data-testid="auth-password-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={12}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="至少 12 位，包含大小写、数字和特殊字符"
            />

            {mode === 'register' && password ? (
              <PasswordStrengthIndicator password={password} />
            ) : null}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            data-testid="auth-submit-button"
          >
            {isLoading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? '还没有账号？' : '已经有账号了？'}{' '}
            <button
              type="button"
              onClick={switchMode}
              data-testid="auth-switch-mode-button"
              className="text-primary hover:underline"
            >
              {mode === 'login' ? '立即注册' : '返回登录'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
