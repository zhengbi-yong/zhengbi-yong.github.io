/**
 * Admin Layout - 增强的管理后台布局组件（紧凑模式）
 *
 * 优化目标：
 * - 侧边栏宽度：200px（原 256px）
 * - 减少 30% 间距
 * - 提升信息密度
 * - 保持可读性（字体 ≥ 12px）
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth-store'
import { AuthModal } from '@/components/auth/AuthModal'
import BreadcrumbNav from '@/components/admin/BreadcrumbNav'
import ThemeToggle from '@/components/admin/ThemeToggle'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  BarChart3,
  Activity,
  FileText,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { KeyboardShortcutProvider, CommandPalette } from '@/components/admin/keyboard-shortcuts'

// 导入管理界面紧凑样式
import '@/styles/admin-compact.css'
import '@/styles/admin-theme.css'

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: number
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: '仪表板',
    icon: LayoutDashboard,
    href: '/admin',
  },
  {
    id: 'users',
    label: '用户管理',
    icon: Users,
    href: '/admin/users',
  },
  {
    id: 'comments',
    label: '评论审核',
    icon: MessageSquare,
    href: '/admin/comments',
  },
  {
    id: 'posts',
    label: '文章管理',
    icon: FileText,
    href: '/admin/posts',
  },
  {
    id: 'analytics',
    label: '数据分析',
    icon: BarChart3,
    href: '/admin/analytics',
  },
  {
    id: 'monitoring',
    label: '系统监控',
    icon: Activity,
    href: '/admin/monitoring',
  },
  {
    id: 'settings',
    label: '系统设置',
    icon: Settings,
    href: '/admin/settings',
  },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const pathname = usePathname()
  const { user, logout, isAuthenticated, checkAuth } = useAuthStore()
  const { toggle: toggleCommandPalette } = useKeyboardShortcuts()

  useEffect(() => {
    const verifyAuth = async () => {
      setIsCheckingAuth(true)
      try {
        const isAuth = await checkAuth()
        if (!isAuth) {
          setShowLoginModal(true)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setShowLoginModal(true)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    verifyAuth()
  }, [checkAuth])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  const handleLoginSuccess = async () => {
    setShowLoginModal(false)
    // Re-check auth after login
    try {
      await checkAuth()
    } catch (error) {
      console.error('Failed to refresh auth after login:', error)
    }
  }

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">检查认证状态...</p>
        </div>
      </div>
    )
  }

  // Show login modal if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <LayoutDashboard className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                管理后台登录
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                请登录以访问管理后台
              </p>
            </div>
            <AuthModal
              isOpen={showLoginModal}
              onClose={handleLoginSuccess}
              defaultMode="login"
            />
          </div>
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>默认管理员账号：</p>
            <p className="font-mono mt-1">邮箱: demo2024@test.com</p>
            <p className="font-mono">密码: demo123456</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <KeyboardShortcutProvider>
      <div className="admin-compact min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - 紧凑模式：200px 宽度 */}
        <aside
          className={cn(
            'admin-sidebar fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo - 紧凑间距 */}
            <div className="flex items-center justify-between h-14 px-admin-md border-b border-gray-200 dark:border-gray-700">
              <Link href="/admin" className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
                  <LayoutDashboard className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  管理后台
                </span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation - 紧凑间距 */}
            <nav className="flex-1 px-admin-sm py-admin-md space-y-0.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'admin-sidebar-item group',
                      isActive && 'active'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-admin-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-admin-xs font-semibold text-white bg-red-500 rounded">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                  </Link>
                )
              })}
            </nav>

            {/* User section - 紧凑间距 */}
            <div className="px-admin-sm py-admin-md border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-admin-xs font-semibold text-white">
                    {user?.username?.[0]?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-admin-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.username || '管理员'}
                  </p>
                  <p className="text-admin-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || ''}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-admin-sm py-2 text-admin-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content - 侧边栏宽度偏移 */}
        <div className="lg:pl-[200px]">
          {/* Top bar - 紧凑间距 */}
          <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between h-14 px-admin-sm sm:px-admin-md lg:px-admin-lg">
              <div className="flex items-center flex-1">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <BreadcrumbNav />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* 命令面板按钮 */}
                <button
                  onClick={toggleCommandPalette}
                  className={cn(
                    'relative group',
                    'px-2 py-1.5 rounded',
                    'flex items-center gap-2',
                    'text-admin-sm text-gray-600 dark:text-gray-400',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'hover:text-gray-900 dark:hover:text-gray-200',
                    'transition-all duration-150'
                  )}
                  title="命令面板 (Cmd+K)"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline text-admin-xs">搜索</span>
                  <kbd
                    className={cn(
                      'hidden sm:inline-block',
                      'px-1.5 py-0.5',
                      'text-admin-xs font-medium',
                      'bg-gray-100 dark:bg-gray-700',
                      'text-gray-500 dark:text-gray-400',
                      'rounded',
                      'group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                    )}
                  >
                    ⌘K
                  </kbd>
                </button>
                <ThemeToggle />
                {/* 可以在这里添加通知中心等其他功能 */}
              </div>
            </div>
          </header>

          {/* Page content - 紧凑间距 */}
          <main className="p-admin-sm sm:p-admin-md lg:p-admin-lg admin-compact">
            {children}
          </main>
        </div>

        {/* 命令面板 */}
        <CommandPalette />
      </div>
    </KeyboardShortcutProvider>
  )
}

