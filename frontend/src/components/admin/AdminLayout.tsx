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
import {
  KeyboardShortcutProvider,
  CommandPalette,
  useKeyboardShortcuts,
} from '@/components/admin/keyboard-shortcuts'

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
    href: '/admin/posts-manage',
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
  return (
    <KeyboardShortcutProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </KeyboardShortcutProvider>
  )
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const pathname = usePathname()
  const { user, logout, isAuthenticated, isInitialized, checkAuth } = useAuthStore()
  const { toggle: toggleCommandPalette } = useKeyboardShortcuts()

  useEffect(() => {
    if (!isInitialized) {
      return
    }

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

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[var(--shell-bg)] px-4">
        <div className="mx-auto flex min-h-screen max-w-[32rem] items-center justify-center">
          <div className="surface-elevated flex w-full flex-col items-center gap-4 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] px-8 py-10 text-center shadow-[var(--shadow-soft)]">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[var(--brand-color)]/30 border-t-[var(--brand-color)]" />
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-[0.08em] text-[var(--text-secondary)] uppercase">
                Admin Shell
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">检查认证状态...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show login modal if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[var(--shell-bg)] px-4 py-10">
        <div className="mx-auto flex min-h-screen max-w-[32rem] items-center justify-center">
          <div className="w-full space-y-5">
            <div className="surface-elevated rounded-[var(--radius-panel)] border border-[var(--border-subtle)] p-8 shadow-[var(--shadow-medium)] sm:p-10">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[calc(var(--radius-panel)-6px)] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--brand-color)_16%,var(--surface-elevated))] text-[var(--brand-color)] shadow-[var(--shadow-soft)]">
                  <LayoutDashboard className="h-8 w-8" />
                </div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[var(--text-secondary)] uppercase">
                  Admin Access
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                  管理后台登录
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--text-tertiary)]">
                  请登录以访问管理后台
                </p>
              </div>
              <AuthModal
                isOpen={showLoginModal}
                onClose={handleLoginSuccess}
                defaultMode="login"
              />
            </div>
            <div className="rounded-[calc(var(--radius-panel)-6px)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)]/70 px-4 py-3 text-center text-sm text-[var(--text-tertiary)]">
              <p>默认管理员账号：</p>
              <p className="mt-1 font-mono text-[var(--text-secondary)]">邮箱: demo2024@test.com</p>
              <p className="font-mono text-[var(--text-secondary)]">密码: demo123456</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-compact min-h-screen bg-[var(--shell-bg)] text-[var(--text-primary)]">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="关闭侧边栏"
        />
      )}

      <aside
        className={cn(
          'admin-sidebar fixed inset-y-0 left-0 z-50 border-r border-[var(--admin-border-subtle)] bg-[color-mix(in_srgb,var(--surface-elevated)_92%,transparent)] shadow-[var(--shadow-soft)] backdrop-blur-xl transition-transform duration-300 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-[var(--admin-border-subtle)] px-admin-md">
            <Link href="/admin" className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[calc(var(--radius-panel)-8px)] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--brand-color)_16%,var(--surface-elevated))] text-[var(--brand-color)] shadow-[var(--shadow-soft)]">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold tracking-[0.16em] text-[var(--text-secondary)] uppercase">
                  Console
                </p>
                <span className="block truncate text-sm font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                  管理后台
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[calc(var(--radius-panel)-10px)] text-[var(--text-secondary)] transition-colors duration-[var(--motion-fast)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-admin-sm py-admin-md">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'admin-sidebar-item group relative rounded-[calc(var(--radius-panel)-10px)] border border-transparent px-3 py-2.5',
                    isActive
                      ? 'active border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--brand-color)_14%,var(--surface-elevated))] text-[var(--text-primary)] shadow-[var(--shadow-soft)]'
                      : 'hover:border-[var(--admin-border-subtle)] hover:bg-[color-mix(in_srgb,var(--surface-elevated)_82%,transparent)]'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate text-admin-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-admin-xs font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--brand-color)]" />}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-[var(--admin-border-subtle)] px-admin-sm py-admin-md">
            <div className="rounded-[calc(var(--radius-panel)-8px)] border border-[var(--admin-border-subtle)] bg-[var(--surface-elevated)]/80 p-3 shadow-[var(--shadow-soft)]">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-color)_18%,var(--surface-elevated))] text-sm font-semibold text-[var(--brand-color)]">
                  {user?.username?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-admin-sm font-medium text-[var(--text-primary)]">
                    {user?.username || '管理员'}
                  </p>
                  <p className="truncate text-admin-xs text-[var(--text-tertiary)]">{user?.email || ''}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[calc(var(--radius-panel)-10px)] border border-[var(--admin-border-subtle)] px-3 py-2 text-admin-sm font-medium text-[var(--text-secondary)] transition-all duration-[var(--motion-fast)] hover:border-[var(--border-strong)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[200px]">
        <header className="sticky top-0 z-30 border-b border-[var(--admin-border-subtle)] bg-[color-mix(in_srgb,var(--shell-bg)_82%,transparent)] backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-3 px-admin-sm sm:px-admin-md lg:px-admin-lg">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[calc(var(--radius-panel)-8px)] border border-[var(--admin-border-subtle)] bg-[var(--surface-elevated)]/80 text-[var(--text-secondary)] transition-all duration-[var(--motion-fast)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-soft)] lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <BreadcrumbNav />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleCommandPalette}
                className={cn(
                  'group relative inline-flex h-10 items-center gap-2 rounded-[calc(var(--radius-panel)-8px)] border border-[var(--admin-border-subtle)] bg-[var(--surface-elevated)]/80 px-3 text-admin-sm text-[var(--text-secondary)] shadow-none backdrop-blur-sm transition-all duration-[var(--motion-fast)]',
                  'hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-soft)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-color)]/40'
                )}
                title="命令面板 (Cmd+K)"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">搜索</span>
                <kbd className="hidden rounded-full border border-[var(--admin-border-subtle)] bg-black/5 px-2 py-0.5 text-[11px] font-medium tracking-[0.08em] text-[var(--text-tertiary)] sm:inline-block dark:bg-white/10">
                  ⌘K
                </kbd>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="admin-compact p-admin-sm sm:p-admin-md lg:p-admin-lg">
          <div className="mx-auto w-full max-w-[var(--container-shell)]">{children}</div>
        </main>
      </div>

      <CommandPalette />
    </div>
  )
}
