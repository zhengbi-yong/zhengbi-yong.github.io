'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/components/lib/utils'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  FileText,
  BarChart3,
  Activity,
  Settings,
  LogOut,
} from 'lucide-react'
import { useSidebar } from '@/components/shadcn/ui/sidebar'

const navItems = [
  { id: 'dashboard', label: '仪表板', icon: LayoutDashboard, href: '/admin' },
  { id: 'users', label: '用户管理', icon: Users, href: '/admin/users' },
  { id: 'comments', label: '评论审核', icon: MessageSquare, href: '/admin/comments' },
  { id: 'posts', label: '文章管理', icon: FileText, href: '/admin/posts' },
  { id: 'analytics', label: '数据分析', icon: BarChart3, href: '/admin/analytics' },
  { id: 'monitoring', label: '系统监控', icon: Activity, href: '/admin/monitoring' },
  { id: 'settings', label: '系统设置', icon: Settings, href: '/admin/settings' },
]

export function AppSidebar({ onLogout }: { onLogout?: () => void }) {
  const pathname = usePathname()
  const { open } = useSidebar()

  return (
    <aside
      data-state={!open ? 'collapsed' : 'expanded'}
      style={{ width: open ? '16rem' : '3rem' }}
      className="fixed left-0 top-0 z-30 flex h-full flex-col border-r bg-background transition-[width] duration-200 ease-linear"
    >
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2">
          {open && <span className="text-lg font-bold">管理后台</span>}
          {!open && <span className="text-lg font-bold mx-auto">A</span>}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground',
                !open && 'justify-center px-2'
              )}
              title={!open ? item.label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {open && item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-2">
        <button
          onClick={onLogout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors',
            !open && 'justify-center px-2'
          )}
          title={!open ? '退出登录' : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {open && '退出登录'}
        </button>
      </div>
    </aside>
  )
}
