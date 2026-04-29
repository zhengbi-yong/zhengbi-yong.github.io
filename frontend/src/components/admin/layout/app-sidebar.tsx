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

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="text-lg font-bold">
          管理后台
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-2">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </button>
      </div>
    </aside>
  )
}
