'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth-store'
import { AuthModal } from '@/components/auth/AuthModal'
import { SidebarProvider, SidebarInset } from '@/components/shadcn/ui/sidebar'
import { AppSidebar } from '@/components/admin/layout/app-sidebar'
import { Header } from '@/components/admin/layout/header'
import { Main } from '@/components/admin/layout/main'

/** 编辑器路由使用全屏布局,不显示 sidebar 和 header */
function isEditorRoute(pathname: string): boolean {
  return pathname.startsWith('/admin/posts/edit/') || pathname === '/admin/posts/new'
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminLayoutInner>{children}</AdminLayoutInner>
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { user, logout, isAuthenticated, isInitialized, checkAuth } = useAuthStore()
  const pathname = usePathname()
  const isEditor = isEditorRoute(pathname)

  useEffect(() => {
    if (!isInitialized) return
    const verifyAuth = async () => {
      setIsCheckingAuth(true)
      const isAuth = await checkAuth()
      setShowLoginModal(!isAuth)
      setIsCheckingAuth(false)
    }
    void verifyAuth()
  }, [checkAuth, isInitialized])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  const handleLoginSuccess = async () => {
    setShowLoginModal(false)
    setIsCheckingAuth(true)
    const isAuth = await checkAuth()
    setShowLoginModal(!isAuth)
    setIsCheckingAuth(false)
  }

  if (isCheckingAuth) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='h-9 w-9 animate-spin rounded-full border-4 border-primary/30 border-t-primary' />
          <p className='text-sm text-muted-foreground'>检查认证状态...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className='flex min-h-screen items-center justify-center p-4'>
        <div className='w-full max-w-md space-y-5'>
          <div className='rounded-lg border bg-card p-8 shadow-sm'>
            <div className='mb-8 text-center'>
              <div className='mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl border bg-primary/10 text-primary'>
                <LayoutDashboard className='h-8 w-8' />
              </div>
              <h1 className='text-2xl font-semibold tracking-tight'>管理后台登录</h1>
              <p className='mt-2 text-sm text-muted-foreground'>请登录以访问管理后台</p>
            </div>
            <AuthModal isOpen={showLoginModal} onClose={handleLoginSuccess} defaultMode='login' />
          </div>
        </div>
      </div>
    )
  }

  // 编辑器路由: 全屏布局,无 sidebar/header
  if (isEditor) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header user={user} onLogout={handleLogout} />
        <Main>{children}</Main>
      </SidebarInset>
    </SidebarProvider>
  )
}
