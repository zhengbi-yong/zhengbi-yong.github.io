'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthModal } from '@/components/auth/AuthModal'
import { useAuthStore } from '@/lib/store/auth-store'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  // Redirect to home page if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthModal isOpen={true} onClose={() => router.push('/')} defaultMode="login" />
    </div>
  )
}
