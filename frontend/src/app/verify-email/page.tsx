'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authService } from '@/lib/api/backend'
import { Button } from '@/components/shadcn/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/ui/card'

type VerifyState =
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; message: string }

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [state, setState] = useState<VerifyState>({ status: 'loading' })

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: '验证链接无效：缺少验证令牌。' })
      return
    }

    let cancelled = false

    async function doVerify() {
      try {
        await authService.verifyEmail(token!)
        if (!cancelled) {
          setState({ status: 'success' })
        }
      } catch (error: unknown) {
        if (cancelled) return
        const message =
          error instanceof Error ? error.message : '邮箱验证失败，请稍后重试。'
        setState({ status: 'error', message })
      }
    }

    doVerify()

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        {state.status === 'loading' && (
          <>
            <CardHeader className="text-center">
              <CardTitle>邮箱验证</CardTitle>
              <CardDescription>正在验证您的邮箱...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </CardContent>
          </>
        )}

        {state.status === 'success' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <CardTitle>✅ 邮箱验证成功！</CardTitle>
              <CardDescription>现在可以登录了</CardDescription>
            </CardHeader>
            <CardFooter className="justify-center pb-6">
              <Button asChild className="w-full">
                <Link href="/login">去登录</Link>
              </Button>
            </CardFooter>
          </>
        )}

        {state.status === 'error' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 dark:bg-destructive/20">
                <svg
                  className="h-6 w-6 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <CardTitle>验证失败</CardTitle>
              <CardDescription className="text-destructive">
                {state.message}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex-col gap-3 pb-6">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">重新发送验证邮件</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/">返回首页</Link>
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>邮箱验证</CardTitle>
              <CardDescription>加载中...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
