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
  ChevronsLeft,
  ChevronsRight,
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

export function AppSidebar() {
  const pathname = usePathname()
  const { open, setOpen } = useSidebar()

  return (
    <aside
      data-state={!open ? 'collapsed' : 'expanded'}
      style={{ width: open ? '15rem' : '3.5rem' }}
      className="fixed left-0 top-0 z-30 flex h-full flex-col border-r border-border/60 bg-background transition-[width] duration-200 ease-linear"
    >
      {/* Logo + collapse toggle */}
      <div className="flex h-12 items-center justify-between border-b border-border/60 px-3">
        {open ? (
          <>
            <Link href="/admin" className="flex items-center gap-2 min-w-0">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                Z
              </div>
              <span className="text-sm font-semibold truncate">管理后台</span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors flex-shrink-0"
              title="收起侧边栏"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors mx-auto"
            title="展开侧边栏"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
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
                'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                !open && 'justify-center px-0'
              )}
              title={!open ? item.label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {open && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
