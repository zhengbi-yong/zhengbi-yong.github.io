'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthModal } from '@/components/auth/AuthModal'
import { useAuthStore } from '@/lib/store/auth-store'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const { isAuthenticated, isLoading } = useAuthStore()

  // Redirect to intended destination if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthModal
        isOpen={true}
        onClose={() => router.push(redirectTo)}
        defaultMode="login"
      />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">加载中...</div>}>
      <LoginContent />
    </Suspense>
  )
}
