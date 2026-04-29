'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor, LogOut, LayoutDashboard } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/lib/store/auth-store'
import { AuthModal } from '@/components/auth/AuthModal'
import { SidebarProvider, SidebarInset } from '@/components/shadcn/ui/sidebar'
import { Button } from '@/components/shadcn/ui/button'
import { Avatar, AvatarFallback } from '@/components/shadcn/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcn/ui/dropdown-menu'
import { AppSidebar } from '@/components/admin/layout/app-sidebar'
import { Header } from '@/components/admin/layout/header'
import { Main } from '@/components/admin/layout/main'

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
  const { theme, setTheme } = useTheme()

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

  return (
    <SidebarProvider>
      <AppSidebar onLogout={handleLogout} />
      <SidebarInset>
        <Header />
        <div className="flex items-center justify-end gap-2 px-4 py-1.5 border-b bg-background/80">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon' className='h-7 w-7'>
                {theme === 'light' ? <Sun className='h-3.5 w-3.5' /> : theme === 'dark' ? <Moon className='h-3.5 w-3.5' /> : <Monitor className='h-3.5 w-3.5' />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => setTheme('light')}><Sun className='mr-2 h-4 w-4' />Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}><Moon className='mr-2 h-4 w-4' />Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}><Monitor className='mr-2 h-4 w-4' />System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-7 w-7 rounded-full'>
                <Avatar className='h-7 w-7'>
                  <AvatarFallback className='text-xs'>{user?.username?.[0]?.toUpperCase() || 'A'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              <div className='flex items-center gap-2 px-2 py-1.5'>
                <Avatar className='h-8 w-8'><AvatarFallback className='text-xs'>{user?.username?.[0]?.toUpperCase() || 'A'}</AvatarFallback></Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>{user?.username || '管理员'}</span>
                  <span className='truncate text-xs text-muted-foreground'>{user?.email || ''}</span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}><LogOut className='mr-2 h-4 w-4' />退出登录</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Main>{children}</Main>
      </SidebarInset>
    </SidebarProvider>
  )
}
